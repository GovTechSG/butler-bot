export function askForDate(room) {
  return `Booking Details (_Step 1 of 4_)\n----------------------------------------\nRoom: *${room}*\n\nPlease select a date for this booking:`;
}

export function askForTime(room, date) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 2 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\n\nPlease select a time for this booking:`;
}

export function askForDuration(room, date, time) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 3 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\nTime: *${time}*\n\nPlease select a duration for this booking:`;
}

export function askForDescription(room, date, time, duration) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 4 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\nTime: *${time}*\nDuration: *${duration}*\n\nPlease type a brief description for your booking:`;
}

export function bookingConfirmed(room, date, startTime, endTime, fullName, userName, description) {
  return `#Booking confirmed ✔️\n----------------------------\nRoom: *${room}*\nDate: *${date}*\nTime: *${startTime} - ${endTime}*\nBy: *${fullName}* (@${userName})\nDescription: ${description}`
}