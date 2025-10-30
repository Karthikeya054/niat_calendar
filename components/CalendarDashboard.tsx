// components/CalendarDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import type { User, Calendar, EventType, CalendarEvent } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { EventModal } from './EventModal';
import { ShareModal } from './ShareModal';
import { AdminPanel } from './AdminPanel';
import { ROLE_PERMISSIONS } from '../constants';
import { CustomToolbar } from './CustomToolbar';
import { YearView } from './YearView';
import { CustomEvent } from './CustomEvent';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

type View = 'month' | 'week' | 'agenda' | 'year';

export const CalendarDashboard: React.FC<{ user: User; onLogout: () => void; }> = ({ user, onLogout }) => {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [activeCalendar, setActiveCalendar] = useState<Calendar | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [highlightedEventTypeIds, setHighlightedEventTypeIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'academic' | 'event'>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [modalStartDate, setModalStartDate] = useState<Date | null>(null);

    const userPermissions = ROLE_PERMISSIONS[user.role];

    const fetchCalendars = useCallback(async () => {
        try {
            const fetchedCalendars = await supabaseService.getCalendars();

            // Role-based filter: org_admin sees all; PM/COS see only their university; students view only their university
            let visibleCalendars = fetchedCalendars;
            if (user.role !== 'org_admin') {
                if (user.universityId) {
                    visibleCalendars = fetchedCalendars.filter(c => c.universityId === user.universityId);
                } else {
                    // If no universityId (e.g., central employees), limit to central/admin or public calendars only
                    visibleCalendars = fetchedCalendars.filter(c => c.isPublic || c.category === 'admin');
                }
            }

            setCalendars(visibleCalendars);

            // Set default active calendar:
            if (user.role === 'org_admin') {
                if (!activeCalendar && visibleCalendars.length > 0) setActiveCalendar(visibleCalendars[0]);
            } else if (user.role === 'PM' || user.role === 'COS' || user.role === 'program_ops') {
                if (!activeCalendar) {
                    const acad = visibleCalendars.find(c => c.category === 'academic');
                    setActiveCalendar(acad || visibleCalendars[0] || null);
                }
            } else { // student or others
                // Students don't have to select calendars — set activeCalendar to null and show read-only
                setActiveCalendar(null);
            }

        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    }, [user, activeCalendar, categoryFilter]);


    const fetchEventTypes = useCallback(async () => {
        try {
            const fetchedEventTypes = await supabaseService.getEventTypes();
            setEventTypes(fetchedEventTypes);
        } catch (error) {
            console.error('Error fetching event types:', error);
        }
    }, []);
    
    // Replace your existing fetchEvents function with this block
    const fetchEvents = useCallback(async () => {
        // Debug: show current active calendar, view and date
        console.log('🔎 fetchEvents() called. activeCalendar:', activeCalendar ? {
        id: activeCalendar.id,
        name: activeCalendar.name,
        category: activeCalendar.category,
        universityId: (activeCalendar as any).universityId || (activeCalendar as any).university_id
        } : null, 'view:', view, 'date:', date);

        if (!activeCalendar) {
            console.warn('⚠️ No active calendar selected, skipping fetchEvents');
            return;
        }

        setLoading(true);

        // compute date range depending on view
        let rangeStart: Date, rangeEnd: Date;

        if (view === 'year') {
            rangeStart = moment(date).startOf('year').toDate();
            rangeEnd = moment(date).endOf('year').toDate();
        } else if (view === 'agenda') {
            rangeStart = moment(date).startOf('month').toDate();
            rangeEnd = moment(date).endOf('month').add(30, 'days').toDate();
        } else {
            rangeStart = moment(date).startOf(view as any).toDate();
            rangeEnd = moment(date).endOf(view as any).toDate();
        }

        try {
            let fetchedEvents = [];

            // Determine universityId field (support both camelCase and snake_case)
            const uniId = (activeCalendar as any).universityId || (activeCalendar as any).university_id || null;

            // If active calendar is admin/main, fetch combined university events
            if (activeCalendar.category === 'admin' || (activeCalendar.name && activeCalendar.name.toLowerCase().includes('main'))) {
                console.log('➡️ Active calendar is admin/main — attempting university-level fetch. universityId:', uniId);

                if (!uniId) {
                    console.warn('⚠️ Admin calendar missing universityId — attempting fallback to single calendar fetch (will show only events directly on this calendar)');
                    // fallback: fetch events for the single calendar
                    fetchedEvents = await supabaseService.getEvents(activeCalendar.id, rangeStart, rangeEnd);
                } else {
                    // proper combined fetch
                    fetchedEvents = await supabaseService.getEventsForUniversity(uniId, rangeStart, rangeEnd);
                }
            } else {
                // normal single calendar fetch
                console.log('➡️ Active calendar is non-admin — fetching events for calendar:', activeCalendar.id);
                fetchedEvents = await supabaseService.getEvents(activeCalendar.id, rangeStart, rangeEnd);
            }

            // Normalise start/end to Date objects (safe for strings or Date)
            const normalized = (fetchedEvents || []).map((e: any) => ({
                ...e,
                start: e.start ? new Date(e.start) : (e.start_time ? new Date(e.start_time) : new Date()),
                end: e.end ? new Date(e.end) : (e.end_time ? new Date(e.end_time) : new Date()),
            }));

            console.log('📆 Fetched events count:', normalized.length);
            setEvents(normalized);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, [activeCalendar, date, view, supabaseService]);


    useEffect(() => {
        fetchCalendars();
        fetchEventTypes();
    }, [fetchCalendars, fetchEventTypes]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleSelectSlot = ({ start }: { start: Date }) => {
        if (!userPermissions.canCreate) return;
        setSelectedEvent(null);
        setModalStartDate(start);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };
    
    const onEventDrop = async ({ event, start, end }: { event: CalendarEvent, start: string | Date, end: string | Date }) => {
        if (!userPermissions.canEdit) return;
        try {
            await supabaseService.updateEvent(event.id, { start: new Date(start), end: new Date(end) });
            fetchEvents();
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setModalStartDate(null);
    }
    
    const onEventSavedOrDeleted = () => {
        fetchEvents();
        closeModal();
    }

    const handleShareCalendar = () => {
        if (!activeCalendar || !userPermissions.canShare) return;
        setIsShareModalOpen(true);
    }
    
    const components = useMemo(() => ({
        toolbar: (props: any) => (
            <CustomToolbar {...props} view={view} setView={setView} />
        ),
        event: (props: any) => (
            <CustomEvent 
                {...props} 
                eventTypes={eventTypes} 
                highlightedEventTypeIds={highlightedEventTypeIds}
            />
        )
    }), [view, eventTypes, highlightedEventTypeIds]);

    // Filter calendars by category
    const filteredCalendars = useMemo(() => {
        if (categoryFilter === 'all') return calendars;
        return calendars.filter(c => c.category === categoryFilter);
    }, [calendars, categoryFilter]);

    return (
        <div className="flex h-screen font-sans">
            <Sidebar 
                calendars={filteredCalendars}
                activeCalendar={activeCalendar}
                setActiveCalendar={setActiveCalendar}
                eventTypes={eventTypes}
                highlightedEventTypeIds={highlightedEventTypeIds}
                setHighlightedEventTypeIds={setHighlightedEventTypeIds}
                user={user}
                permissions={userPermissions}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                onShareCalendar={handleShareCalendar}
                onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            />

            <div className="flex flex-col flex-1">
                <Header user={user} onLogout={onLogout} />
                <main className="flex-1 p-4 lg:p-6 bg-white overflow-y-auto">
                    {loading && (
                        <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-50 z-10 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <div className="mt-2">Loading events...</div>
                            </div>
                        </div>
                    )}
                    
                    {view === 'year' ? (
                        <YearView date={date} setDate={setDate} setView={setView} />
                    ) : (
                        <DnDCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 'calc(100vh - 8rem)' }}
                            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                            view={view}
                            date={date}
                            onView={(v) => setView(v as View)}
                            onNavigate={(newDate) => setDate(newDate)}
                            selectable={userPermissions.canCreate && user.role !== 'student'}
                            onSelectSlot={handleSelectSlot}
                            onEventDrop={onEventDrop}
                            onEventResize={onEventDrop}
                            resizableAccessor={() => userPermissions.canEdit && user.role !== 'student'}
                            draggableAccessor={() => userPermissions.canEdit && user.role !== 'student'}
                            components={components}
                        />
                    )}
                </main>
            </div>
            {isModalOpen && activeCalendar && (
                <EventModal 
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    event={selectedEvent}
                    startDate={modalStartDate}
                    calendarId={activeCalendar.id}
                    eventTypes={eventTypes}
                    onSaved={onEventSavedOrDeleted}
                    onDeleted={onEventSavedOrDeleted}
                    permissions={userPermissions}
                />
            )}
            {isShareModalOpen && activeCalendar && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    calendarId={activeCalendar.id}
                    calendarName={activeCalendar.name}
                />
            )}
            {isAdminPanelOpen && user.role === 'org_admin' && (
                <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
            )}
        </div>
    );
};