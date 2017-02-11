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

export function informNoTimeslot(room, date) {
  let formattedDate = date.getFormattedDate();
  if (date.getSimpleDate() === new Date().getSimpleDate()) {
    formattedDate += ' (Today)';
  }
  return `Booking Details (_Step 2 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\n\nThere are no more slots available your requested date. \nPlease try another room.`;
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

export function checkAnyRoom() {
  return `Ok wait ah let me check...`;
}

export function confirmAnyRoom(date, startTime, endTime, duration, room) {
  return `Steady, confirm *${date}* *${startTime} - ${endTime} (${duration} mins)*?\n` +
    `The *${room}* room is available! Would you like to book it?`;
}

export function rejectAnyRoomForLongBooking(date, startTime, endTime, duration) {
  return `Okay, did you want to book *${date}* *${startTime} - ${endTime} (${duration} mins)*?\n\n` +
    `You can only book up to a maximum of 4 hours at one go. Give others a chance to use the rooms too. Please try again.`;
}

export function rejectAnyRoomForWrongDatetime(date, startTime, endTime, duration) {
  return `Okay, did you want to book *${date}* *${startTime} - ${endTime} (${duration} mins)*?\n\n` +
    `You cannot make room booking for the past. Please try again.`;
}
