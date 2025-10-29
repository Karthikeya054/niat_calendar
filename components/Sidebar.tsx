import React, { useState } from 'react';
import type { User, Calendar, EventType } from '../types';
import { mockApiService } from '../services/mockApiService';
import { CalendarIcon, DownloadIcon, ShareIcon } from './Icons';
import { ShareModal } from './ShareModal';

interface SidebarProps {
    calendars: Calendar[];
    activeCalendar: Calendar | null;
    setActiveCalendar: (calendar: Calendar) => void;
    eventTypes: EventType[];
    highlightedEventTypeIds: string[];
    setHighlightedEventTypeIds: (ids: string[]) => void;
    user: User;
    permissions: { canCreate: boolean; canShare: boolean };
}

export const Sidebar: React.FC<SidebarProps> = ({ calendars, activeCalendar, setActiveCalendar, eventTypes, highlightedEventTypeIds, setHighlightedEventTypeIds, permissions }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareLink, setShareLink] = useState('');

    const handleEventTypeToggle = (typeId: string) => {
        const newIds = highlightedEventTypeIds.includes(typeId)
            ? highlightedEventTypeIds.filter(id => id !== typeId)
            : [...highlightedEventTypeIds, typeId];
        setHighlightedEventTypeIds(newIds);
    };

    const handleShare = async () => {
        if (activeCalendar && permissions.canShare) {
            const link = await mockApiService.createShareLink(activeCalendar.id);
            setShareLink(link);
            setIsShareModalOpen(true);
        }
    };
    
    return (
        <>
            <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
                <div className="mb-6">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Calendars</h2>
                    <ul>
                        {calendars.map(cal => (
                            <li key={cal.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveCalendar(cal); }}
                                    className={`flex items-center p-2 rounded-md text-sm font-medium ${
                                        activeCalendar?.id === cal.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <CalendarIcon className="w-5 h-5 mr-3" />
                                    <span>{cal.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="mb-6">
                     <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Highlight Events</h2>
                     <div className="space-y-2">
                        {eventTypes.map(type => (
                            <div key={type.id} className="flex items-center">
                                <input
                                    id={`type-${type.id}`}
                                    type="checkbox"
                                    checked={highlightedEventTypeIds.includes(type.id)}
                                    onChange={() => handleEventTypeToggle(type.id)}
                                    className="h-4 w-4 rounded border-gray-300 focus:ring-indigo-500"
                                    style={{ accentColor: type.color }}
                                />
                                <label htmlFor={`type-${type.id}`} className="ml-3 text-sm text-gray-600 flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }}></span>
                                    {type.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto space-y-2">
                    {permissions.canShare && (
                         <button onClick={handleShare} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <ShareIcon className="w-5 h-5 mr-2" />
                            Share Calendar
                        </button>
                    )}
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Export .ICS
                    </button>
                </div>
            </aside>
            <ShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareLink={shareLink}
            />
        </>
    );
};