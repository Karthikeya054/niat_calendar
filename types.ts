
export enum Role {
  ORG_ADMIN = 'org_admin',
  PROGRAM_OPS = 'program_ops',
  TEACHER = 'teacher',
  STUDENT = 'student',
  GUEST = 'guest',
}

export interface User {
  id: string;
  name:string;
  email: string;
  role: Role;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
}

export interface EventType {
  id: string;
  name: string;
  color: string; // Hex color string for consistency
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  calendarId: string;
  eventTypeId: string;
  allDay?: boolean;
}

// For react-big-calendar compatibility
export interface CalendarEvent extends Event {
  resource?: any; 
}