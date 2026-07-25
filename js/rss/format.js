'use strict';
t.module(() => {

  // add a leading 0 to a number if it is only one digit
  function addLeadingZero(num) {
    const numString = num.toString();
    while (numString.length < 2) num = "0" + num;
    return num;
  }

  function buildRFC822Date(date) {
    // Converts the JS Date object to a string format
    // suitable for RSS feeds. It is assumed that the
    // timezone of the Date object is 'MDT'.

    const dayStrings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthStrings = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const day = dayStrings[date.getDay()];
    const dayNumber = addLeadingZero(date.getDate());
    const month = monthStrings[date.getMonth()];
    const year = date.getFullYear();
    const time = `${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:00`;
    const timezone = 'MDT';

    //Wed, 02 Oct 2002 13:00:00 GMT
    return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
  }

  return {
    formatDate: buildRFC822Date,
  };
});
