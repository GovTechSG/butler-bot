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
	return `#Booking confirmed ✔️\n----------------------------\nRoom: *${room}*\nDate: *${date}*\nTime: *${startTime} - ${endTime}*\nBy: *${fullName}* (@${userName})\nDescription: ${description}`;
}

export function bookingConfirmedCalendarLink(json) {
	return `Check out this link for the overall room booking schedules: ${json.htmlLink}`;
}

export function checkBookings(number, summary, room, startDate, endDate, user) {
	return `Booking ${number}:\nRoom: *${room}*\nDate: *${new Date(startDate).getFormattedDate()}*\nTime: *${new Date(startDate).getFormattedTime()} - ${new Date(endDate).getFormattedTime()}*\nBy: *${user}*\nDescription: ${summary}\n`;
}

export function askAnyRoom() {
	return `Swee, I like your style 😘 When do you need a room?\n\n_e.g._\n_today 3pm to 4pm_\n_tomorrow 1pm to 3pm_\n_this friday 9am to 10am_`;
}

export function askAnyRoomErrorInput() {
	return `I don't really understand what you're saying leh. Can try rephrase and send your request again?`;
}

export function checkAnyRoom() {
	return `Ok wait ah let me check...`;
}

export function askAnyRoomNoRoom() {
	return `Sorry leh, don't have any room at all. Why don't you look at the calendar and see which timeslot is free?\n\n[Click here to view calendar](https://sgtravelbot.com)`;
}

export function confirmAnyRoom(date, startTime, endTime, duration, room) {
	return `Steady, confirm *${date}* *${startTime} - ${endTime} (${duration} mins)*?\n` +
		`The *${room}* room is available! Would you like to book it?`;
}

export function rejectAnyRoomForLongBooking(date, startTime, endTime, duration) {
	return `Okay, did you want to book *${date}* *${startTime} - ${endTime} (${duration} mins)*?\n\n` +
		`You can only book up to a maximum of 4 hours at one go. Let's give others a chance to use the rooms too:) \n\nTry sending me another datetime below again.`;
}

export function rejectAnyRoomForWrongDatetime(date, startTime, endTime, duration) {
	return `Okay, did you want to book *${date}* *${startTime} - ${endTime} (${duration} mins)*?\n\n` +
		`You cannot make room booking for the past. \n\nTry sending me another datetime below again.`;
}
