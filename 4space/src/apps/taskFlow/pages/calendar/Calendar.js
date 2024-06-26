import React, { useState } from 'react';
import './Calendar.css';
import { generateMonthlyCalendar } from './monthly.js';
import { generateYearlyCalendar } from './yearly.js';
import { generateWeeklyCalendar } from './weekly.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

function getWeek(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}


function Calendar() {
  const [date, setDate] = useState(new Date());
  const [viewType, setViewType] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());



  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1));
  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1));
  const prevYear = () => setDate(new Date(date.getFullYear() - 1, date.getMonth()));
  const nextYear = () => setDate(new Date(date.getFullYear() + 1, date.getMonth()));
  const prevWeek = () => setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7));
  const nextWeek = () => setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7));

  let calendarCells;

  switch (viewType) {
    case 'monthly':
      calendarCells = generateMonthlyCalendar(date);
      break;
    case 'yearly':
      calendarCells = generateYearlyCalendar(date);
      break;
    case 'weekly':
      calendarCells = generateWeeklyCalendar(date);
      break;
    default:
      calendarCells = null;
  }

  return (
    <div className='calendar-container'>
      <h2>Calendar</h2>
      <div className='calendar-body'>
      <div className='calendar-nav'>
            <a
              href='#monthly'
              className={viewType === 'monthly' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setViewType('monthly');
              }}
            >
              Month
            </a>
            <a
              href='#yearly'
              className={viewType === 'yearly' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setViewType('yearly');
              }}
            >
              Year
            </a>
            <a
              href='#weekly'
              className={viewType === 'weekly' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setViewType('weekly');
              }}
            >
              Week
            </a>

          </div>
        <div className='calendar-container-inner'>
          <div className='calendar-header'>
            {viewType === 'monthly' && (
              <>
                <h2>{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              </>
            )}
            {viewType === 'weekly' && (
              <>
                <h2>
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}&nbsp;&nbsp;&nbsp;
                  Week {getWeek(date)}
                </h2>

              </>
            )}
            {viewType === 'yearly' && (
              <>
                <h2>Year {date.toLocaleDateString('en-US', { year: 'numeric' })}</h2>
              </>
            )}
            <div className='calendar-buttons'>
              <>
                <button onClick={viewType === 'monthly' ? prevMonth : viewType === 'weekly' ? prevWeek : prevYear}><FontAwesomeIcon icon={faChevronLeft} /></button>
                <button onClick={viewType === 'monthly' ? nextMonth : viewType === 'weekly' ? nextWeek : nextYear}><FontAwesomeIcon icon={faChevronRight} /></button>
              </>
            </div>
          </div>
          {calendarCells}
        </div>
      </div>
    </div>
  );

};

export default Calendar;
