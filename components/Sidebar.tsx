// components/Sidebar.tsx
import React from 'react';
import type { Calendar, EventType, User } from '../types';

interface SidebarProps {
  calendars: Calendar[];
  activeCalendar: Calendar | null;
  setActiveCalendar: (calendar: Calendar) => void;
  eventTypes: EventType[];
  highlightedEventTypeIds: string[];
  setHighlightedEventTypeIds: (ids: string[]) => void;
  user: User;
  permissions: any;
  categoryFilter: 'all' | 'academic' | 'event';
  setCategoryFilter: (filter: 'all' | 'academic' | 'event') => void;
  onShareCalendar: () => void;
  onOpenAdminPanel: () => void; // <-- ADD THIS
}

export const Sidebar: React.FC<SidebarProps> = ({
    calendars,
    activeCalendar,
    setActiveCalendar,
    eventTypes,
    highlightedEventTypeIds,
    setHighlightedEventTypeIds,
    user,
    permissions,
    categoryFilter,
    setCategoryFilter,
    onShareCalendar,
    onOpenAdminPanel, // <-- ADD THIS
}) => {
  
  const toggleEventType = (id: string) => {
    if (highlightedEventTypeIds.includes(id)) {
      setHighlightedEventTypeIds(highlightedEventTypeIds.filter(i => i !== id));
    } else {
      setHighlightedEventTypeIds([...highlightedEventTypeIds, id]);
    }
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* User Info */}
        <div className="pb-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          {user.universityName && (
            <p className="text-xs text-gray-400 mt-1">{user.universityName}</p>
          )}
        </div>
                {/* Admin Panel button (admin only) */}
                {user.role === 'org_admin' && (
          <div className="mt-3">
            <button
              onClick={onOpenAdminPanel}
              className="w-full text-left px-3 py-2 rounded-md text-sm bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
            >
              ⚙️ Admin Panel
            </button>
          </div>
        )}


        {/* Category Filter */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Calendar Type
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                categoryFilter === 'all'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Calendars
            </button>
            <button
              onClick={() => setCategoryFilter('academic')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                categoryFilter === 'academic'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📚 Academic
            </button>
            <button
              onClick={() => setCategoryFilter('event')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                categoryFilter === 'event'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🎉 Events
            </button>
          </div>
        </div>

        {/* Calendars */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Calendars
            </h3>
            {permissions.canShare && activeCalendar && (
              <button
                onClick={onShareCalendar}
                className="text-xs text-indigo-600 hover:text-indigo-800"
                title="Share calendar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
          </div>
          <div className="space-y-1">
            {calendars.map(calendar => (
              <button
                key={calendar.id}
                onClick={() => setActiveCalendar(calendar)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeCalendar?.id === calendar.id
                    ? 'bg-indigo-100 text-indigo-800 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{calendar.name}</span>
                  {calendar.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                      {calendar.category === 'academic' ? '📚' : '🎉'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Filters */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Event Types
          </h3>
          <div className="space-y-1">
          {eventTypes
              .filter(et => categoryFilter === 'all' ? true : (et.category || 'event') === categoryFilter)
              .map(et => (
                <button
                  key={et.id}
                  onClick={() => toggleEventType(et.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    highlightedEventTypeIds.includes(et.id)
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                    style={{ backgroundColor: et.color }}
                  />
                  <span className="text-gray-700 truncate">{et.name}</span>
                  {highlightedEventTypeIds.includes(et.id) && (
                    <svg className="w-4 h-4 ml-auto text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
            ))}

          </div>
        </div>
      </div>
    </aside>
  );
};