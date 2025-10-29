// components/CalendarDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import type { User, Calendar, EventType, CalendarEvent } from '../types';
import { supabaseService } from '../services/supabaseService'; // CHANGED
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { EventModal } from './EventModal';
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [modalStartDate, setModalStartDate] = useState<Date | null>(null);

    const userPermissions = ROLE_PERMISSIONS[user.role];

    const fetchCalendars = useCallback(async () => {
        try {
            const fetchedCalendars = await supabaseService.getCalendars(); // CHANGED
            setCalendars(fetchedCalendars);
            if (fetchedCalendars.length > 0 && !activeCalendar) {
                setActiveCalendar(fetchedCalendars[0]);
            }
        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    }, [activeCalendar]);

    const fetchEventTypes = useCallback(async () => {
        try {
            const fetchedEventTypes = await supabaseService.getEventTypes(); // CHANGED
            setEventTypes(fetchedEventTypes);
        } catch (error) {
            console.error('Error fetching event types:', error);
        }
    }, []);
    
    const fetchEvents = useCallback(async () => {
        if (!activeCalendar) return;
        setLoading(true);

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
            const fetchedEvents = await supabaseService.getEvents(activeCalendar.id, rangeStart, rangeEnd); // CHANGED
            setEvents(fetchedEvents.map(e => ({...e, start: new Date(e.start), end: new Date(e.end)})));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, [activeCalendar, date, view]);

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
            await supabaseService.updateEvent(event.id, { start: new Date(start), end: new Date(end) }); // CHANGED
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

    return (
        <div className="flex h-screen font-sans">
            <Sidebar 
                calendars={calendars}
                activeCalendar={activeCalendar}
                setActiveCalendar={setActiveCalendar}
                eventTypes={eventTypes}
                highlightedEventTypeIds={highlightedEventTypeIds}
                setHighlightedEventTypeIds={setHighlightedEventTypeIds}
                user={user}
                permissions={userPermissions}
            />
            <div className="flex flex-col flex-1">
                <Header user={user} onLogout={onLogout} />
                <main className="flex-1 p-4 lg:p-6 bg-white overflow-y-auto">
                    {loading && <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-50 z-10 flex items-center justify-center">Loading events...</div>}
                    
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
                            selectable={userPermissions.canCreate}
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            onEventDrop={onEventDrop}
                            onEventResize={onEventDrop}
                            resizableAccessor={() => userPermissions.canEdit}
                            draggableAccessor={() => userPermissions.canEdit}
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
        </div>
    );
};