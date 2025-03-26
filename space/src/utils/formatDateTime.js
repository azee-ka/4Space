export const formatDateTime = (dateTimeString, includeTime) => {
    if(dateTimeString === null) {
        return '';
    }

    let options;
  
    if (includeTime) {
      options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
    } else {
      options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
    }
  
    const formattedDate = new Date(dateTimeString).toLocaleDateString('en-US', options);
  
    return formattedDate;
  };
  