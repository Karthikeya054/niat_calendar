// services/supabaseService.ts - FIXED VERSION (with safe profile upsert)
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Calendar, Event, EventType, Role } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseService {
  
  // Google Sign In
  async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) throw error;
  }

  // Get current user with detailed error logging & safe upsert for profile
  async getMe(): Promise<User> {
    try {
      // Step 1: Get auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }

      if (!authUser) {
        throw new Error('No authenticated user');
      }

      console.log('✅ Auth user found:', authUser.email);

      // Step 2: Try to get profile (by auth_uid)
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*, universities(name)')
        .eq('auth_uid', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw profileError;
      }

      // Step 3: If profile doesn't exist, upsert it (safe for race conditions)
      if (!userProfile) {
        console.log('⚠️ No profile found, upserting one for:', authUser.email);

        const payload = {
          auth_uid: authUser.id,
          email: authUser.email,
          display_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'student', // Default role - adjust as needed
        };

        try {
          // Upsert on auth_uid to avoid duplicate key errors (race-safe)
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'auth_uid' })
            .select('*, universities(name)')
            .single();

          if (upsertError) {
            console.warn('⚠️ Profile upsert returned error:', upsertError);

            // If we get a conflict or other race-related issue, try to re-select the profile
            const { data: rechecked, error: recheckError } = await supabase
              .from('profiles')
              .select('*, universities(name)')
              .eq('auth_uid', authUser.id)
              .maybeSingle();

            if (recheckError) {
              console.error('❌ Failed to re-check profile after upsert error:', recheckError);
              throw recheckError;
            }

            if (!rechecked) {
              // Nothing found after retry — rethrow the original upsert error
              throw upsertError;
            }

            console.log('🔁 Found existing profile after race:', rechecked.email);
            return {
              id: rechecked.id,
              email: rechecked.email,
              name: rechecked.display_name || rechecked.email,
              role: rechecked.role as Role,
              universityId: rechecked.university_id,
              universityName: rechecked.universities?.name,
            };
          }

          // Upsert succeeded (created or updated)
          console.log('✅ Profile created or updated:', newProfile.email);

          return {
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.display_name || newProfile.email,
            role: newProfile.role as Role,
            universityId: newProfile.university_id,
            universityName: newProfile.universities?.name,
          };
        } catch (err) {
          console.error('❌ Failed to upsert profile (unexpected):', err);
          throw err;
        }
      }

      // Step 4: Profile exists — return mapped user
      console.log('✅ Profile found:', userProfile.email, 'Role:', userProfile.role);

      return {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.display_name || userProfile.email,
        role: userProfile.role as Role,
        universityId: userProfile.university_id,
        universityName: userProfile.universities?.name,
      };
    } catch (error) {
      console.error('💥 getMe() failed:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get all calendars with university names
  async getCalendars(): Promise<Calendar[]> {
    try {
      const { data, error } = await supabase
        .from('calendars')
        .select(`
          *,
          universities (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Calendars fetch error:', error);
        throw error;
      }

      console.log('📅 Raw calendars data:', data?.length || 0, 'calendars');

      // Transform the data
      const calendars = (data || []).map(cal => ({
        id: cal.id,
        name: cal.name,
        description: cal.description,
        ownerId: cal.owner_id,
        universityId: cal.university_id,
        universityName: cal.universities?.name,
        category: cal.category || 'event',
        isPublic: cal.is_public,
      }));

      console.log('✅ Transformed calendars:', calendars.length);
      
      return calendars;
    } catch (error) {
      console.error('💥 getCalendars failed:', error);
      return [];
    }
  }

    // Get all event types (with deduplication) - now includes category
    async getEventTypes(): Promise<EventType[]> {
        try {
          const { data, error } = await supabase
            .from('event_types')
            .select('id, name, color, category')
            .order('name');
    
          if (error) {
            console.error('❌ Event types fetch error:', error);
            throw error;
          }
    
          // Deduplicate by name (in case SQL fix didn't run yet) and keep category
          const uniqueTypes = new Map<string, EventType>();
          (data || []).forEach((et: any) => {
            const key = et.name.trim().toLowerCase();
            if (!uniqueTypes.has(key)) {
              uniqueTypes.set(key, {
                id: et.id,
                name: et.name,
                color: et.color || '#1976d2',
                category: et.category || 'event',
              } as EventType);
            }
          });
    
          const result = Array.from(uniqueTypes.values());
          console.log('✅ Event types loaded:', result.length, '(deduplicated from', data?.length || 0, ')');
          
          return result;
        } catch (error) {
          console.error('💥 getEventTypes failed:', error);
          return [];
        }
    }
    

  // Get events for a calendar within a date range
  async getEvents(calendarId: string, start: Date, end: Date): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('calendar_id', calendarId)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString())
        .order('start_time');

      if (error) {
        console.error('❌ Events fetch error:', error);
        throw error;
      }

      console.log('📆 Loaded events:', data?.length || 0);

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        calendarId: event.calendar_id,
        eventTypeId: event.event_type_id,
        allDay: event.all_day,
        location: event.location,
      }));
    } catch (error) {
      console.error('💥 getEvents failed:', error);
      return [];
    }
  }
    // Get events for an entire university (combines academic + event calendars)
      // Get events for an entire university (combines academic + event calendars)
  // Get events for an entire university (combines academic + event calendars)
async getEventsForUniversity(universityId: string, start: Date, end: Date): Promise<Event[]> {
    try {
      console.log('getEventsForUniversity() called for universityId=', universityId, 'range', start, end);
  
      // Step 1: fetch calendar ids for this university
      const { data: calData, error: calErr } = await supabase
        .from('calendars')
        .select('id')
        .eq('university_id', universityId);
  
      if (calErr) {
        console.error('❌ Failed to fetch calendars for university:', calErr);
        throw calErr;
      }
  
      const calIds: string[] = (calData || []).map((c: any) => c.id).filter(Boolean);
  
      if (calIds.length === 0) {
        console.log('⚠️ No calendars found for university:', universityId);
        return [];
      }
  
      // Step 2: fetch events for those calendars; select * so we don't request unknown columns
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select(`
          *,
          calendars ( id, name, category, university_id ),
          event_types ( id, name, color )
        `)
        .in('calendar_id', calIds)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString())
        .order('start_time', { ascending: true });
  
      if (eventsErr) {
        console.error('❌ Failed to fetch university events:', eventsErr);
        throw eventsErr;
      }
  
      const mapped: Event[] = (eventsData || []).map((evt: any) => {
        // Normalize field names safely; handle missing fields
        const startRaw = evt.start_time ?? evt.start ?? evt.start_time;
        const endRaw = evt.end_time ?? evt.end ?? evt.end_time;
  
        return {
          id: evt.id,
          title: evt.title ?? evt.name ?? 'Untitled',
          description: evt.description ?? '',
          start: startRaw ? new Date(startRaw) : new Date(),
          end: endRaw ? new Date(endRaw) : new Date(),
          calendarId: evt.calendar_id,
          eventTypeId: evt.event_type_id ?? null,
          allDay: !!evt.all_day,
          // location may not exist; only include if present
          ...(evt.location !== undefined ? { location: evt.location } : {}),
          // extras for UI
          // @ts-ignore
          calendarName: evt.calendars?.name,
          // @ts-ignore
          calendarCategory: evt.calendars?.category,
          // @ts-ignore
          eventTypeName: evt.event_types?.name,
          // @ts-ignore
          eventTypeColor: evt.event_types?.color,
        } as Event;
      });
  
      console.log(`📆 Loaded university events: ${mapped.length} (university ${universityId})`);
      return mapped;
    } catch (error) {
      console.error('💥 getEventsForUniversity failed:', error);
      return [];
    }
  }
  
    
  // Create a new event
  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.start.toISOString(),
        end_time: eventData.end.toISOString(),
        all_day: eventData.allDay || false,
        calendar_id: eventData.calendarId,
        event_type_id: eventData.eventTypeId,
        location: eventData.location,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Create event error:', error);
      throw error;
    }

    console.log('✅ Event created:', data.title);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      start: new Date(data.start_time),
      end: new Date(data.end_time),
      calendarId: data.calendar_id,
      eventTypeId: data.event_type_id,
      allDay: data.all_day,
      location: data.location,
    };
  }

  // Update an event
  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    const updateData: any = {};

    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.start !== undefined) updateData.start_time = eventData.start.toISOString();
    if (eventData.end !== undefined) updateData.end_time = eventData.end.toISOString();
    if (eventData.allDay !== undefined) updateData.all_day = eventData.allDay;
    if (eventData.eventTypeId !== undefined) updateData.event_type_id = eventData.eventTypeId;
    if (eventData.location !== undefined) updateData.location = eventData.location;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update event error:', error);
      throw error;
    }

    console.log('✅ Event updated:', data.title);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      start: new Date(data.start_time),
      end: new Date(data.end_time),
      calendarId: data.calendar_id,
      eventTypeId: data.event_type_id,
      allDay: data.all_day,
      location: data.location,
    };
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('❌ Delete event error:', error);
      throw error;
    }

    console.log('✅ Event deleted');

    return { success: true };
  }

  // Create share link
  async createShareLink(calendarId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase.rpc('create_guest_share', {
        calendar_uuid: calendarId,
        creator_auth_uid: user.id,
        ttl_seconds: 2592000 // 30 days
      });

      if (error) {
        console.error('❌ Create share link error:', error);
        throw error;
      }

      const shareUrl = `${window.location.origin}/guest/${data}`;
      console.log('✅ Share link created:', shareUrl);
      
      return shareUrl;
    } catch (error: any) {
      console.error('💥 createShareLink failed:', error);
      throw new Error(error.message || 'Failed to create share link');
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Listen to auth state changes - WITH DEDUPLICATION
  onAuthStateChange(callback: (user: User | null) => void) {
    let isProcessing = false;
    
    return supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent duplicate processing
      if (isProcessing) {
        console.log('⏭️ Skipping duplicate auth event:', event);
        return;
      }
      
      isProcessing = true;
      console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user');
      
      try {
        if (session?.user) {
          const user = await this.getMe();
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error fetching user after auth change:', error);
        callback(null);
      } finally {
        // Reset flag after a brief delay
        setTimeout(() => {
          isProcessing = false;
        }, 100);
      }
    });
  }
}

export const supabaseService = new SupabaseService();
