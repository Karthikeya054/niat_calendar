import { ROLES, EVENT_TYPES } from '../constants';
import { type User, type Calendar, type Event, type EventType, Role } from '../types';
import { v4 as uuidv4 } from 'uuid';

// --- PRODUCTION-READY PERMISSION MODEL ---
// In a real backend, this list would come from a database or an environment variable
// (e.g., process.env.EDITOR_EMAILS.split(','))
const EDITOR_EMAILS = [
  'admin@nxtwave.in',
  'program_ops@nxtwave.in',
  'teacher@nxtwave.in',
  'programopscentral@nxtwave.in' // Example of another authorized user
];

// In-memory database
let users: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@nxtwave.in', role: Role.ORG_ADMIN },
  { id: 'u2', name: 'Program Ops', email: 'program_ops@nxtwave.in', role: Role.PROGRAM_OPS },
  { id: 'u3', name: 'Teacher Sam', email: 'teacher@nxtwave.in', role: Role.TEACHER },
  { id: 'u4', name: 'Student Alex', email: 'student@example.com', role: Role.STUDENT },
];

let calendars: Calendar[] = [
  { id: 'c1', name: 'Academic Calendar 2025', ownerId: 'u2' },
  { id: 'c2', name: 'Extracurricular Activities', ownerId: 'u3' },
];

let events: Event[] = [
    { id: 'e1', title: 'Mid-term Exams', start: new Date(new Date().setDate(new Date().getDate() + 10)), end: new Date(new Date().setDate(new Date().getDate() + 14)), calendarId: 'c1', eventTypeId: 'et7' },
    { id: 'e2', title: 'Annual Sports Day', start: new Date(new Date().setDate(new Date().getDate() + 3)), end: new Date(new Date().setDate(new Date().getDate() + 3)), calendarId: 'c2', eventTypeId: 'et5', allDay: true },
    { id: 'e3', title: 'Guest Lecture on AI', start: new Date(new Date().setDate(new Date().getDate() - 2)), end: new Date(new Date().setDate(new Date().getDate() - 2)), calendarId: 'c1', eventTypeId: 'et6' },
    { id: 'e4', title: 'Winter Break', start: new Date(new Date().setDate(new Date().getDate() + 20)), end: new Date(new Date().setDate(new Date().getDate() + 30)), calendarId: 'c1', eventTypeId: 'et1', allDay: true },
    { id: 'e5', title: 'Robotics Club Meet', start: new Date(new Date().setDate(new Date().getDate() - 5)), end: new Date(new Date().setDate(new Date().getDate() - 5)), calendarId: 'c2', eventTypeId: 'et4' },
];

const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nameFromEmail = (email: string) => email.split('@')[0].split('.').map(capitalize).join(' ');


class MockApiService {
    
  async login(email: string): Promise<User> {
    await networkDelay(500);
    
    // Find if user already exists
    let user = users.find(u => u.email === email);

    if (!user) {
        // Determine role based on the authorized list of editors
        const isEditor = EDITOR_EMAILS.includes(email.toLowerCase());
        
        // Default to Program Ops for any editor, Student (read-only) for anyone else
        const role = isEditor ? Role.PROGRAM_OPS : Role.STUDENT;

        const newUser: User = {
            id: uuidv4(),
            email: email,
            name: nameFromEmail(email),
            role: role,
        };
        users.push(newUser); // Add to in-memory store for the session
        user = newUser;
    } else {
        // If user exists, ensure their role is correct based on the source of truth
        const isEditor = EDITOR_EMAILS.includes(user.email.toLowerCase());
        user.role = isEditor ? user.role : Role.STUDENT; // Don't demote existing editors, but ensure non-editors are read-only
    }
    
    // In a real app, this would be a real JWT
    localStorage.setItem('authToken', JSON.stringify({ userId: user.id }));
    return user;
  }

  logout() {
    localStorage.removeItem('authToken');
  }

  async getMe(): Promise<User> {
    await networkDelay(200);
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Not authenticated');
    }
    const { userId } = JSON.parse(token);
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
  
  async getEventTypes(): Promise<EventType[]> {
      await networkDelay(100);
      return EVENT_TYPES;
  }

  async getCalendars(): Promise<Calendar[]> {
    await networkDelay(400);
    return calendars;
  }

  async getEvents(calendarId: string, start: Date, end: Date): Promise<Event[]> {
    await networkDelay(600);
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const inDateRange = eventStart <= end && eventEnd >= start;
      const inCalendar = event.calendarId === calendarId;
      return inDateRange && inCalendar;
    });
  }

  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    await networkDelay(500);
    const newEvent: Event = { ...eventData, id: uuidv4() };
    events.push(newEvent);
    return newEvent;
  }

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    await networkDelay(500);
    let eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) throw new Error("Event not found");
    events[eventIndex] = { ...events[eventIndex], ...eventData };
    return events[eventIndex];
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean }> {
    await networkDelay(500);
    events = events.filter(e => e.id !== eventId);
    return { success: true };
  }

  async createShareLink(calendarId: string): Promise<string> {
      await networkDelay(400);
      const token = uuidv4().split('-')[0];
      // In a real backend, this token would be stored with a TTL.
      return `https://example.com/guest/${token}?calendarId=${calendarId}`;
  }
}

export const mockApiService = new MockApiService();
