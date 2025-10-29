// services/supabaseService.ts
import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
import { User, Calendar, Event, EventType, Role } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseService {
  
  // Google Sign In
  async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  // Get current user
  async getMe(): Promise<User> {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      throw new Error('Not authenticated');
    }

    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name || userProfile.email,
      role: userProfile.role as Role,
    };
  }

  // Logout
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get all calendars
  async getCalendars(): Promise<Calendar[]> {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(cal => ({
      id: cal.id,
      name: cal.name,
      description: cal.description,
      ownerId: cal.owner_id,
    }));
  }

  // Get all event types
  async getEventTypes(): Promise<EventType[]> {
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(et => ({
      id: et.id,
      name: et.name,
      color: et.color,
    }));
  }

  // Get events for a calendar within a date range
  async getEvents(calendarId: string, start: Date, end: Date): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('calendar_id', calendarId)
      .gte('start_time', start.toISOString())
      .lte('end_time', end.toISOString())
      .order('start_time');

    if (error) throw error;

    return data.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      calendarId: event.calendar_id,
      eventTypeId: event.event_type_id,
      allDay: event.all_day,
    }));
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
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      start: new Date(data.start_time),
      end: new Date(data.end_time),
      calendarId: data.calendar_id,
      eventTypeId: data.event_type_id,
      allDay: data.all_day,
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

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      start: new Date(data.start_time),
      end: new Date(data.end_time),
      calendarId: data.calendar_id,
      eventTypeId: data.event_type_id,
      allDay: data.all_day,
    };
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    return { success: true };
  }

  // Create share link (placeholder - implement as needed)
  async createShareLink(calendarId: string): Promise<string> {
    // For now, return a simple public link
    // In production, you'd create a token in a separate table
    return `${window.location.origin}/calendar/${calendarId}`;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const user = await this.getMe();
          callback(user);
        } catch (error) {
          console.error('Error fetching user:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const supabaseService = new SupabaseService();