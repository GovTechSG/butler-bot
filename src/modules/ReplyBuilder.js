exports.askForDate = function(room) {
  return `Booking Details (_Step 1 of 4_)\n----------------------------------------\nRoom: *${room}*\n\nPlease select a date for this booking:`;
}

exports.askForTime = function(room, date) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 2 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\n\nPlease select a time for this booking:`;
}

exports.askForDuration = function(room, date, time) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 3 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\nTime: *${time}*\n\nPlease select a duration for this booking:`;
}

exports.askForDescription = function(room, date, time, duration) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 4 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\nTime: *${time}*\nDuration: *${duration}*\n\nPlease type a brief description for your booking:`;
}

exports.bookingConfirmed = function(room, date, startTime, endTime, fullName, userName, description) {
  return `#Booking confirmed ✔️\n----------------------------\nRoom: *${room}*\nDate: *${date}*\nTime: *${startTime} - ${endTime}*\nBy: *${fullName}* (@${userName})\nDescription: ${description}`
}