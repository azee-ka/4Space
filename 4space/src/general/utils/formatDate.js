// Function to convert ISO 8601 date-time to readable format
export function formatDate(dateTime, showTime = true, showDate = true) {
    const dateObj = new Date(dateTime);
    let formattedDate = "";
    if (showDate) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        formattedDate = dateObj.toLocaleDateString('en-US', options);
    }
    if (showTime) {
        const timeOptions = { hour: 'numeric', minute: 'numeric' };
        const formattedTime = dateObj.toLocaleTimeString('en-US', timeOptions);
        formattedDate += (formattedDate ? ' ' : '') + formattedTime;
    }
    return formattedDate;
}


// Function to convert date-time to human-readable time ago format
export function timeAgo(dateTime) {
    const currentDate = new Date();
    const dateObj = new Date(dateTime);
    const timeDifference = currentDate - dateObj;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes >= 1) {
        return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
    } else if (seconds <= 59 && seconds >= 10) {
        return `${seconds} secs ago`;
    } else {
        return 'Just now';
    }
}
