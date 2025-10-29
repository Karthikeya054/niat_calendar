
import React from 'react';
import { Views } from 'react-big-calendar';

interface CustomToolbarProps {
    label: string;
    view: string;
    views: string[];
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    onView: (view: any) => void;
    setView: (view: any) => void;
}

export const CustomToolbar: React.FC<CustomToolbarProps> = ({ label, onNavigate, onView, setView, view }) => {
    
    const viewNames = [
        { key: Views.MONTH, label: 'Month'},
        { key: Views.WEEK, label: 'Week'},
        { key: Views.AGENDA, label: 'Agenda'},
        { key: 'year', label: 'Year'},
    ]

    return (
        <div className="rbc-toolbar">
            <span className="rbc-btn-group">
                <button type="button" onClick={() => onNavigate('PREV')}>Back</button>
                <button type="button" onClick={() => onNavigate('TODAY')}>Today</button>
                <button type="button" onClick={() => onNavigate('NEXT')}>Next</button>
            </span>

            <span className="rbc-toolbar-label">{label}</span>

            <span className="rbc-btn-group">
                {viewNames.map(v => (
                     <button
                        key={v.key}
                        type="button"
                        className={view === v.key ? 'rbc-active' : ''}
                        onClick={() => {
                            if (v.key === 'year') setView('year');
                            else onView(v.key);
                        }}
                     >
                        {v.label}
                    </button>
                ))}
            </span>
        </div>
    );
};
