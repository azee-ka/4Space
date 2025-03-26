export function timeAgo(utcDateTime, isLetter = false) {
    const dateInUTC = new Date(utcDateTime);
    const timeDifference = new Date() - dateInUTC; // in milliseconds
    const seconds = Math.floor(timeDifference / 1000);

    const intervals = {
        [isLetter ? 'y' : 'year']: 31536000,  // 12 months
        [isLetter ? 'mo' : 'month']: 2592000,  // ~30 days
        [isLetter ? 'w' : 'week']: 604800,     // 7 days
        [isLetter ? 'd' : 'day']: 86400,       // 24 hours
        [isLetter ? 'h' : 'hour']: 3600,       // 60 minutes
        [isLetter ? 'm' : 'minute']: 60,       // 60 seconds
        [isLetter ? 's' : 'second']: 1,        // 1 second
    };

    let time, unit;

    for (const key in intervals) {
        if (seconds >= intervals[key]) {
            time = Math.floor(seconds / intervals[key]);
            unit = key;

            // Handle special cases for transitions
            if (unit === (isLetter ? 'm' : 'minute') && time > 59) {
                time = Math.floor(seconds / intervals[isLetter ? 'h' : 'hour']);
                unit = isLetter ? 'h' : 'hour';
            } else if (unit === (isLetter ? 'h' : 'hour') && time > 23) {
                time = Math.floor(seconds / intervals[isLetter ? 'd' : 'day']);
                unit = isLetter ? 'd' : 'day';
            } else if (unit === (isLetter ? 'd' : 'day') && time > 6) {
                time = Math.floor(seconds / intervals[isLetter ? 'w' : 'week']);
                unit = isLetter ? 'w' : 'week';
            } else if (unit === (isLetter ? 'w' : 'week') && time > 4) {
                time = Math.floor(seconds / intervals[isLetter ? 'mo' : 'month']);
                unit = isLetter ? 'mo' : 'month';
            } else if (unit === (isLetter ? 'mo' : 'month') && time > 11) {
                time = Math.floor(seconds / intervals[isLetter ? 'y' : 'year']);
                unit = isLetter ? 'y' : 'year';
            }

            // Return formatted string
            return isLetter
                ? `${time}${unit}`
                : `${time} ${unit}${time > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now'; // For time differences less than 1 second
}

export function convertDateTime(utcDateTime, userLocale=navigator.language || 'en-US') {
    const dateInUTC = new Date(utcDateTime);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return ` on ${dateInUTC.toLocaleString(userLocale, options)}`;
}
