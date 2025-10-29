
import React, { useState } from 'react';
import type { User } from '../types';
import { ChevronDownIcon } from './Icons';

interface HeaderProps {
    user: User;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    return (
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div>
                <h1 className="text-xl font-bold text-gray-800">EdTech Calendar</h1>
            </div>
            <div className="relative">
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    className="flex items-center space-x-2 focus:outline-none"
                >
                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-500 text-white rounded-full font-bold">
                        {getInitials(user.name)}
                    </div>
                    <span className="hidden sm:inline text-gray-700 font-medium">{user.name}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-600"/>
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20">
                        <div className="py-2">
                            <div className="px-4 py-2 text-sm text-gray-700">
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                <p className="text-xs text-indigo-500 font-bold mt-1">{user.role.replace('_', ' ')}</p>
                            </div>
                            <div className="border-t border-gray-100"></div>
                            <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); onLogout(); }} 
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Log out
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
