
import React from 'react';
import moment from 'moment';
import { Views } from 'react-big-calendar';

interface YearViewProps {
  date: Date;
  setDate: (date: Date) => void;
  setView: (view: any) => void;
}

export const YearView: React.FC<YearViewProps> = ({ date, setDate, setView }) => {
  const year = date.getFullYear();
  const months = moment.months();

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(year, monthIndex, 1);
    setDate(newDate);
    setView(Views.MONTH);
  };
  
  const navigate = (direction: 'PREV' | 'NEXT') => {
      const newDate = moment(date).add(direction === 'PREV' ? -1 : 1, 'year').toDate();
      setDate(newDate);
  }

  const today = new Date();
  const isCurrentYear = today.getFullYear() === year;
  const currentMonth = today.getMonth();

  return (
    <div className="p-4">
      <div className="flex items-center justify-center mb-6">
        <button onClick={() => navigate('PREV')} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">&lt; Back</button>
        <h2 className="text-2xl font-bold text-center text-gray-700 mx-6">{year}</h2>
        <button onClick={() => navigate('NEXT')} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Next &gt;</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month, index) => {
            const isCurrentMonth = isCurrentYear && index === currentMonth;
            return (
                <div
                    key={month}
                    onClick={() => handleMonthClick(index)}
                    className={`p-4 rounded-lg cursor-pointer text-center transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105
                    ${isCurrentMonth ? 'bg-indigo-600 text-white font-bold' : 'bg-gray-100 hover:bg-indigo-100'}`}
                >
                    <p className="font-semibold text-lg">{month}</p>
                </div>
            )
        })}
      </div>
    </div>
  );
};
