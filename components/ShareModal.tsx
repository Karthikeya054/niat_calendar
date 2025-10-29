
import React, { useState } from 'react';
import { CopyIcon } from './Icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareLink }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Share Calendar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Anyone with the link can view this calendar. The link is valid for 30 days.</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
            >
              {copied ? 'Copied!' : <CopyIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
