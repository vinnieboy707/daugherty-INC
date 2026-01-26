import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const Calendar = ({ onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth, currentYear]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/availability/calendar/month?month=${currentMonth}&year=${currentYear}`);
      setCalendarData(response.data.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (dayData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(dayData.date);
    
    // Only allow selecting future dates that are available
    if (dayDate < today) return;
    if (dayData.status === 'booked' || dayData.status === 'unavailable') return;
    
    setSelectedDate(dayData.date);
    if (onDateSelect) {
      onDateSelect(dayData.date);
    }
  };

  const getStatusColor = (status, isPast) => {
    if (isPast) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
      case 'booked':
        return 'bg-red-100 text-red-800 cursor-not-allowed';
      case 'unavailable':
        return 'bg-gray-200 text-gray-600 cursor-not-allowed';
      default:
        return 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'unavailable':
        return 'Unavailable';
      default:
        return '';
    }
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  // Create array with empty slots for days before month starts
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  calendarGrid.push(...calendarData);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentMonth - 1]} {currentYear}
          </h2>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-700">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-gray-700">Booked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
          <span className="text-gray-700">Unavailable</span>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {calendarGrid.map((dayData, index) => {
            if (!dayData) {
              return (
                <div key={`empty-${index}`} className="aspect-square"></div>
              );
            }

            const dayDate = new Date(dayData.date);
            const isPast = dayDate < today;
            const isSelected = selectedDate && new Date(selectedDate).toDateString() === dayDate.toDateString();
            const dayNumber = dayDate.getDate();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(dayData)}
                className={`
                  aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center
                  transition-all duration-200
                  ${getStatusColor(dayData.status, isPast)}
                  ${isSelected ? 'border-purple-600 ring-2 ring-purple-300' : 'border-transparent'}
                `}
                title={`${dayNumber} - ${getStatusLabel(dayData.status)}`}
              >
                <div className="text-lg font-bold">{dayNumber}</div>
                {dayData.availableSlots > 0 && !isPast && dayData.status === 'available' && (
                  <div className="text-xs mt-1">
                    {dayData.availableSlots} slot{dayData.availableSlots !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedDate && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-purple-900 font-semibold">
            Selected Date: {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default Calendar;
