// components/EventModal.tsx
import React, { useState, useEffect } from 'react';
import type { Event, EventType } from '../types';
import { supabaseService } from '../services/supabaseService'; // CHANGED
import { TrashIcon } from './Icons';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  startDate: Date | null;
  calendarId: string;
  eventTypes: EventType[];
  onSaved: () => void;
  onDeleted: () => void;
  permissions: { canEdit: boolean, canDelete: boolean, canCreate: boolean };
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, event, startDate, calendarId, eventTypes, onSaved, onDeleted, permissions }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [allDay, setAllDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isNewEvent = !event;
  const canEdit = isNewEvent ? permissions.canCreate : permissions.canEdit;
  const canDeleteCurrent = !isNewEvent && permissions.canDelete;

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setEventTypeId(event.eventTypeId);
      setStart(new Date(event.start));
      setEnd(new Date(event.end));
      setAllDay(event.allDay || false);
    } else {
      const initialDate = startDate || new Date();
      setTitle('');
      setDescription('');
      setEventTypeId(eventTypes.length > 0 ? eventTypes[0].id : '');
      setStart(initialDate);
      setEnd(new Date(initialDate.getTime() + 60 * 60 * 1000));
      setAllDay(false);
    }
  }, [event, startDate, eventTypes, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    const eventData = { title, description, start, end, allDay, calendarId, eventTypeId };

    try {
      if (isNewEvent) {
        await supabaseService.createEvent(eventData); // CHANGED
      } else {
        await supabaseService.updateEvent(event!.id, eventData); // CHANGED
      }
      onSaved();
    } catch (error) {
      console.error("Failed to save event", error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNewEvent || !canDeleteCurrent) return;
    if (window.confirm('Are you sure you want to delete this event?')) {
        setIsSaving(true);
        try {
            await supabaseService.deleteEvent(event!.id); // CHANGED
            onDeleted();
        } catch (error) {
            console.error("Failed to delete event", error);
            alert('Failed to delete event. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }
  };
  
  const formatDateForInput = (date: Date, isAllDay: boolean) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return isAllDay ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 16);
  };
  
  const handleDateChange = (dateStr: string, isAllDay: boolean, field: 'start' | 'end') => {
      const newDate = new Date(dateStr);
      if (field === 'start') setStart(newDate);
      else setEnd(newDate);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{isNewEvent ? 'Create Event' : 'Edit Event'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select value={eventTypeId} onChange={e => setEventTypeId(e.target.value)} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100">
                {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center">
                <input type="checkbox" id="allDay" checked={allDay} onChange={e => setAllDay(e.target.checked)} disabled={!canEdit} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                <label htmlFor="allDay" className="ml-2 block text-sm text-gray-900">All day</label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start</label>
                <input type={allDay ? 'date' : 'datetime-local'} value={formatDateForInput(start, allDay)} onChange={e => handleDateChange(e.target.value, allDay, 'start')} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End</label>
                <input type={allDay ? 'date' : 'datetime-local'} value={formatDateForInput(end, allDay)} onChange={e => handleDateChange(e.target.value, allDay, 'end')} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!canEdit} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <div>
              {canDeleteCurrent && (
                <button type="button" onClick={handleDelete} disabled={isSaving} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
                    <TrashIcon className="w-5 h-5"/>
                </button>
              )}
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">Cancel</button>
                {canEdit && (
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300">{isSaving ? 'Saving...' : 'Save'}</button>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};