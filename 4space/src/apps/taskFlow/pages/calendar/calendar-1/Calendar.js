import React, { useState } from 'react';
import './Calendar.css';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    const getWeekdayName = (dayIndex) => {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex % 7];
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    return (
        <div className='calendar-container'>
            <div className='calendar-container-inner'>
            <div className='calendar-header'>
                <button className='calendar-nav' onClick={prevMonth}>&lt;</button>
                <h2 className='calendar-title'>
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                </h2>
                <button className='calendar-nav' onClick={nextMonth}>&gt;</button>
            </div>
            <div className='calendar-grid'>
                {[...Array(7)].map((_, index) => (
                    <div key={index} className='calendar-day-header'>
                        {getWeekdayName(index)}
                    </div>
                ))}
                {[...Array(firstDayOfMonth)].map((_, index) => (
                    <div key={`empty-${index}`} className='calendar-day-empty'></div>
                ))}
                {days.map((day) => (
                    <div key={day} className='calendar-day'>
                        <div className='day-number'>{day}</div>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
}

export default Calendar;
