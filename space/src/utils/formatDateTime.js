export const formatDateTime = (dateTimeString, includeTime = false) => {
  // 1) nothing or empty → ""
  if (!dateTimeString) {
    return "";
  }

  const d = new Date(dateTimeString);
  // 2) invalid → ""
  if (isNaN(d.getTime())) {
    return "";
  }

  // 3) pick your formatter
  if (includeTime) {
    return d.toLocaleString("en-US", {
      year:   "numeric",
      month:  "short",
      day:    "numeric",
      hour:   "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return d.toLocaleDateString("en-US", {
      year:  "numeric",
      month: "short",
      day:   "numeric",
    });
  }
};
