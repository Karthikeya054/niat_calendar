// types.ts - UPDATED with universityName
export enum Role {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PM = 'PM',
  COS = 'COS',
  PROGRAM_OPS = 'program_ops',
  ORG_ADMIN = 'org_admin',
  GUEST = 'guest',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  universityId?: string;
  universityName?: string;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  universityId?: string;
  universityName?: string; // NEW: Added this field
  category?: 'academic' | 'event' | 'admin';
  isPublic?: boolean;
}

export interface EventType {
  id: string;
  name: string;
  color: string;
  category?: 'academic' | 'event' | string; // <-- ADD THIS LINE
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  calendarId: string;
  eventTypeId?: string;
  allDay?: boolean;
  location?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  calendarId: string;
  eventTypeId?: string;
  allDay?: boolean;
  location?: string;
}