
import { Role, EventType } from './types';

export const ROLES: Role[] = [
  Role.ORG_ADMIN,
  Role.PROGRAM_OPS,
  Role.TEACHER,
  Role.STUDENT,
];

// Updated event types based on user feedback
export const EVENT_TYPES: EventType[] = [
  { id: 'et1', name: 'Holiday', color: '#ef4444' },        // Red
  { id: 'et2', name: 'Assembly', color: '#3b82f6' },       // Blue
  { id: 'et3', name: 'Activity', color: '#22c55e' },      // Green
  { id: 'et4', name: 'Club Activity', color: '#a855f7' },  // Purple
  { id: 'et5', name: 'Competition', color: '#eab308' },    // Yellow
  { id: 'et6', name: 'Guest Lecture', color: '#6366f1' }, // Indigo
  { id: 'et7', name: 'Exam', color: '#f97316' },           // Orange
];

export const ROLE_PERMISSIONS = {
    [Role.STUDENT]: {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
    },
    [Role.TEACHER]: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: false,
    },
    [Role.PROGRAM_OPS]: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
    },
    [Role.ORG_ADMIN]: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
    },
     [Role.GUEST]: {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
    }
}
