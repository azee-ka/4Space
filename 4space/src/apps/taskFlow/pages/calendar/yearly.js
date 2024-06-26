import React from 'react';
import './yearly.css';

export function generateYearlyCalendar(date) {
  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const year = date.getFullYear();
  const today = new Date();

  const months = monthNames.map((monthName, index) => {
    const monthDays = new Date(year, index + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, index, 1).getDay();
    const days = [];

    for (let i = 0; i < monthDays + firstDayOfWeek; i++) {
      if (i < firstDayOfWeek) {
        days.push(<div key={`empty-${i}`} className="empty-cell">&nbsp;</div>);
      } else {
        const dayOfMonth = i - firstDayOfWeek + 1;
        const currentDate = new Date(year, index, dayOfMonth);
        const isToday = currentDate.toDateString() === today.toDateString();
        const cellClassName = isToday ? 'today' : '';
        days.push(
          <div key={`day-${dayOfMonth}`} className={`day-cell ${cellClassName}`}>
            {dayOfMonth}
          </div>
        );
      }
    }

    return (
      <div key={monthName} className="month">
        <div className="month-name">{monthName}</div>
        <div className="weekdays">
          {weekdays.map((weekday, index) => (
            <div key={`weekday-${weekday}-${index}`} className="weekday-cell">{weekday}</div>
          ))}
        </div>
        <div className="days">{days}</div>
      </div>
    );
  });

  return <div className="yearly-calendar">{months}</div>;
}
