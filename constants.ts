// constants.ts
import { Role, EventType } from './types';

export const ROLES: Role[] = [
  Role.ORG_ADMIN,
  Role.PM,
  Role.COS,
  Role.PROGRAM_OPS,
  Role.TEACHER,
  Role.STUDENT,
];

export const EVENT_TYPES: EventType[] = [
  { id: '', name: 'Holiday', color: '#ef4444' }, // IDs will come from database
  { id: '', name: 'Assembly', color: '#3b82f6' },
  { id: '', name: 'Activity', color: '#22c55e' },
  { id: '', name: 'Club Activity', color: '#a855f7' },
  { id: '', name: 'Competition', color: '#eab308' },
  { id: '', name: 'Guest Lecture', color: '#6366f1' },
  { id: '', name: 'Exam', color: '#f97316' },
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
  [Role.PM]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
  },
  [Role.COS]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
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
};