import React from 'react';
import './Calendar.css';
import './monthly.css';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

export function generateMonthlyCalendar(date) {
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth, daysInMonth);
  const monthDays = [];

  // Fill the array with days of the previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPreviousMonth = getDaysInMonth(previousMonth, previousYear);
  const emptyCellsBefore = firstDayOfMonth.getDay();
  for (let i = daysInPreviousMonth - emptyCellsBefore + 1; i <= daysInPreviousMonth; i++) {
    monthDays.push(new Date(previousYear, previousMonth, i));
  }

  // Fill the array with days of the current month
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push(new Date(currentYear, currentMonth, i));
  }

  // Fill the array with days of the next month
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const emptyCellsAfter = 6 - lastDayOfMonth.getDay();
  for (let i = 1; i <= emptyCellsAfter; i++) {
    monthDays.push(new Date(nextYear, nextMonth, i));
  }

  const today = new Date(); // Get the current date

  return (
    <div className="calendar-grid-monthly">
      {daysOfWeek.map((day, index) => (
        <div key={`${day}-${index}`} className="monthly-calendar-cell-day">
          <div>{day}</div>
        </div>
      ))}
      {monthDays.map((date, index) => {
        const isToday = date && date.toDateString() === today.toDateString();
        const isPreviousMonth = date && date.getMonth() === previousMonth;
        const isNextMonth = date && date.getMonth() === nextMonth;
        const dayNumber = date ? date.getDate() : '';
        const yearDayNumber = date ? Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) + 1 : '';
        return (
          <div key={`${date ? date.getDay().toString() : index}-${index}`} className={`calendar-cell-date ${isPreviousMonth ? 'previous-month' : ''} ${isNextMonth ? 'next-month' : ''}`}>
            {date && (
              <>
                <div className="year-day-number" style={{ opacity: '0.6' }}>{yearDayNumber}</div>
                <div className={`${isToday ? 'today' : ''}`}>{dayNumber}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
