
import React from 'react';
import moment from 'moment';
import type { Event as CalendarEventType, EventType } from '../types';

interface CustomEventProps {
    event: CalendarEventType;
    eventTypes: EventType[];
    highlightedEventTypeIds: string[];
}

export const CustomEvent: React.FC<CustomEventProps> = ({ event, eventTypes, highlightedEventTypeIds }) => {
    const eventType = eventTypes.find(et => et.id === event.eventTypeId);
    const color = eventType?.color || '#6B7280'; // Default gray color

    // An event is deemphasized if a filter is active and this event's type is not selected
    const isDeemphasized = highlightedEventTypeIds.length > 0 && !highlightedEventTypeIds.includes(event.eventTypeId);

    // Use a light background color derived from the main event color for better readability
    const backgroundColor = isDeemphasized ? '#F3F4F6' : `${color}20`; // Hex color with alpha
    const textColor = isDeemphasized ? '#6B7280' : '#111827'; // Dark text for light background
    const borderColor = isDeemphasized ? '#D1D5DB' : color;

    const startTime = moment(event.start).format('h:mm A');
    const endTime = moment(event.end).format('h:mm A');

    return (
        <div
            className="h-full rounded-md p-1.5 text-xs flex flex-col overflow-hidden"
            style={{
                borderLeft: `4px solid ${borderColor}`,
                backgroundColor: backgroundColor,
                color: textColor,
            }}
        >
            <strong className="font-semibold truncate">{event.title}</strong>
            {!event.allDay && (
                <span className="text-gray-600">{`${startTime} - ${endTime}`}</span>
            )}
        </div>
    );
};
