import React from 'react';
import './Calendar.css';
import './weekly.css';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function generateWeeklyCalendar(date) {
  const firstDayOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  const weekDays = [];

  // Fill the array with days of the week
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate() + i));
  }

  const today = new Date(); // Get the current date

  return (
    <div className="calendar-grid-weekly">
      {daysOfWeek.map((day, index) => {
        const weekDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + (index + 1) - (date.getDay() === 0 ? 6 : 1));
        const isToday = weekDay.toDateString() === today.toDateString();

        return (
          <div key={`${day}-${index}`} className="weekly-calendar-cell-day">
            <div>{day}</div>
            <div className={`weekly-calendar-cell-date ${isToday ? 'today' : ''}`}>
              {weekDay.getDate()}
            </div>
          </div>
        );
      })}
      {[...Array(7)].map((_, i) => (
        <div key={i} className="weekly-calendar-cell-content"></div>
      ))}
    </div>
  );
}
