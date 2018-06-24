import Chrono from 'chrono-node';
import * as CalendarApp from './CalendarApp';
import * as ParamBuilder from './ParamBuilder';
import * as ReplyBuilder from './ReplyBuilder';
import { SessionMgr } from './TelegramBot';
import MESSAGES from './Messages';

import { ROOM_CONFIG, BOOKING_DURATION_OPTIONS } from '../../config/settings';

let roomlist = ROOM_CONFIG.roomsListing;

function promptRoomSelection(bot, message) {
	let optionalParams = {
		parse_mode: 'markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: ParamBuilder.constructRoomOptions(ROOM_CONFIG.roomsOpenForBooking)
		})
	};
	bot.sendMessage(message.chat.id, MESSAGES.book, optionalParams)
		.then((sentMsg) => {
			SessionMgr.startSessionCountdown(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
		});
}

// Step 1 - Today or Date
function promptTodayOrDateOption(bot, roomSelectedId, query, hasPrevMsg) {
	console.log('Room Selected: /' + roomSelectedId);
	let optionalParams = ParamBuilder.getTodayOrDateOptions(roomSelectedId);
	let msg = ReplyBuilder.askForDate(roomlist[roomSelectedId].name);
	if (hasPrevMsg) {
		bot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
		SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
	} else {
		bot.sendMessage(query.chat.id, msg, optionalParams)
			.then((message) => {
				SessionMgr.startSessionCountdown(message.result.chat.id, message.result.message_id, message.result.chat.username);
			});
	}
}

function promptDateSelection(bot, query, room, startDate) {
	let msg = `You have selected:\n*${roomlist[room].name}*\n\nPlease select a date in the upcoming month:`;
	bot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getDateSelection(room));
	SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
}

// //Step 2 - Timeslot
function promptTimeslotSelection(bot, query, room, startDate) {
	let startDateStr = new Date().getISO8601TimeStamp();
	if (!startDate.isDateToday()) {
		startDateStr = startDate.getISO8601DateWithDefinedTime(8, 0, 0, 0);
	}

	CalendarApp.listEmptySlotsInDay(startDateStr, room)
		.then((jsonArr) => {
			let msg = ReplyBuilder.askForTime(roomlist[room].name, startDate);
			if (jsonArr === undefined || jsonArr === {} || Object.keys(jsonArr).length === 0) {
				msg = ReplyBuilder.informNoTimeslot(roomlist[room].name, startDate);
			}
			bot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getTimeslots(jsonArr, room, startDate));
			SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
		})
		.catch((err) => {
			console.log('Error promptTimeslotSelection: room: ' + room + ' | ' + JSON.stringify(err));
			bot.editMessageText(query.message.chat.id, query.message.message_id, MESSAGES.error);
			throw new Error('Error promptTimeslotSelection: ' + JSON.stringify(err));
		});
}

// Step 3 - Duration
function promptDurationSelection(bot, query, room, startDate, startTime) {
	CalendarApp.listAvailableDurationForStartTime(startDate.getISO8601DateWithDefinedTimeString(startTime), room)
		.then((jsonArr) => {
			let msg = ReplyBuilder.askForDuration(roomlist[room].name, startDate, startTime);
			bot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getDuration(jsonArr, room, startDate, startTime));
			SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
		})
		.catch((err) => {
			console.log('Error promptDurationSelection: ' + JSON.stringify(err));
			bot.editMessageText(query.message.chat.id, query.message.message_id, MESSAGES.error);
		});
}

//Step 4 - Booking Description
function promptDescription(bot, query, room, startDate, startTime, duration, roomName, bookerList) {
	let msg = ReplyBuilder.askForDescription(roomName, startDate, startTime, BOOKING_DURATION_OPTIONS[duration]);
	bot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getBackButton(room, startDate, startTime, duration))
		.then((message) => {
			let botId = message.result.chat.id;
			bookerList[query.from.id] = {
				id: botId,
				chatType: query.message.chat.type,
				msgid: query.message.message_id,
				name: query.from.username,
				date: startDate.getSimpleDate(),
				room: room,
				time: startTime,
				dur: duration,
				lastUpdated: new Date()
			};
			SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
		});
}

// Step 5 - Confirm Booking Complete
function completeBooking(bot, query, bookerList) {
	if (bookerList[query.from.id] === undefined) {
		return;
	}
	// TODO: input validation before sending to gcal. _ wouldnt work properly

	let booking = bookerList[query.from.id];

	if (booking.chatType == query.chat.type) {
		let summary = query.text;
		let fullname = query.from.first_name + ' ' + query.from.last_name;

		insertBookingIntoCalendar(bot, booking.id, booking.msgid, summary, booking.room,
			new Date().setDateWithSimpleFormat(booking.date), booking.time, booking.dur, booking.name, fullname);
	}
}

function insertBookingIntoCalendar(bot, userId, msgId, description, room, startDate, timeSlot, duration, userName, fullName) {
	let bookingSummary = `${description} by @${userName} (${fullName})`;
	let startTime = startDate.getISO8601DateWithDefinedTimeString(timeSlot);
	for (let i = 0; i < duration; i++) {
		startDate.addMinutes(30);
	}
	let endTime = startDate.getISO8601TimeStamp();

	CalendarApp.queueForInsert(bookingSummary, startTime, endTime, room, 'confirmed', 'booked via butler', userName)
		.then((json) => {
			bot.editMessageText(userId, msgId, MESSAGES.confirm);
			let startDateTime = new Date(json.start);
			let endDateTime = new Date(json.end);
			let msg = ReplyBuilder.bookingConfirmed(roomlist[room].name, startDateTime.getFormattedDate(), startDateTime.getFormattedTime(), endDateTime.getFormattedTime(), fullName, userName, description);

			bot.sendMessage(userId, msg, { parse_mode: 'Markdown' })
				.then((message) => {
					msg = ReplyBuilder.bookingConfirmedCalendarLink(json);
					bot.sendMessage(userId, msg);
					// log.transaction(userId, 'insertEvent', { bookingSummary: bookingSummary, room: room, startTime: startTime, endTime: endTime });
				});
			SessionMgr.endSession(userId);
		}).catch((err) => {
			console.log('Error insertBookingIntoCalendar: ' + JSON.stringify(err));
			bot.editMessageText(userId, msgId, MESSAGES.tooLate);
			// log.error(userId, 'insertBookingIntoCalendar', err.message);
			throw err;
		});
}

// Free-text flow
function askAny(bot, message, anyBookList) {
	bot.sendMessage(message.chat.id, ReplyBuilder.askAnyRoom(), { parse_mode: 'markdown' })
		.then((sentMsg) => {
			SessionMgr.startSessionCountdown(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			anyBookList[message.chat.id] = {};
		});
}

function anyRoom(bot, message, anyBookList) {
	let results = new Chrono.parse(message.text);
	if (!results.length || results[0].end === undefined || results[0].start === undefined) {
		bot.sendMessage(message.chat.id, ReplyBuilder.askAnyRoomErrorInput(), { parse_mode: 'markdown' })
			.then((sentMsg) => {
				SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			});
		return;
	}
	results[0].start.assign('timezoneOffset', 480);
	results[0].end.assign('timezoneOffset', 480);

	let startTime = results[0].start.date();
	let endTime = results[0].end.date();

	startTime = startTime.rounddownToNearestHalfHour();
	endTime = endTime.roundupToNearestHalfHour();

	if (startTime <= new Date() || endTime <= startTime) {
		bot.sendMessage(message.chat.id,
			ReplyBuilder.rejectAnyRoomForWrongDatetime(
				startTime.getFormattedDate(),
				startTime.getFormattedTime(),
				endTime.getFormattedTime(),
				startTime.getMinuteDiff(endTime)),
			{ parse_mode: 'markdown' })
			.then((sentMsg) => {
				SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			});
		return;
	}

	let maxBookingDurationSlotsAllowed = 8;
	let numOfSlotsBooked = Math.round(startTime.getMinuteDiff(endTime) / 30);
	if (numOfSlotsBooked > maxBookingDurationSlotsAllowed) {
		bot.sendMessage(message.chat.id,
			ReplyBuilder.rejectAnyRoomForLongBooking(
				startTime.getFormattedDate(),
				startTime.getFormattedTime(),
				endTime.getFormattedTime(),
				startTime.getMinuteDiff(endTime)),
			{ parse_mode: 'markdown' })
			.then((sentMsg) => {
				SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			});
		return;
	}

	bot.sendMessage(message.chat.id, ReplyBuilder.checkAnyRoom(), { parse_mode: 'markdown' });

	// look up lowest-priority cal for available slot
	let rooms = Object.keys(ROOM_CONFIG.roomsListing).filter(x => x !== 'primary');
	checkRoomFreeAtTimeslot(bot, message, startTime, endTime, rooms, anyBookList);
}

async function checkRoomFreeAtTimeslot(bot, message, startDate, endDate, rooms, anyBookList) {
	let responses = await Promise.all(rooms.map(room => CalendarApp.checkTimeslotFree(startDate, endDate, room)));

	const freeRooms = responses.reduce((result, isRoomFree, index) => {
		if (isRoomFree) {
			const roomCode = rooms[index];
			result.push({ name: roomlist[roomCode].name, code: roomCode });
		}

		return result;
	}, []);

	if (!freeRooms.length) {
		bot.sendMessage(message.chat.id, ReplyBuilder.askAnyRoomNoRoom(), { parse_mode: 'markdown' });
		return;
	}

	delete anyBookList[message.chat.id];

	let numOfSlots = Math.round(startDate.getMinuteDiff(endDate) / 30);
	let optionalParams = ParamBuilder.getFreeRooms(freeRooms,
		startDate.getSimpleDate(),
		startDate.getFormattedTime(),
		numOfSlots,
		message.chat.id);

	bot.sendMessage(message.chat.id, ReplyBuilder.confirmAnyRoom(
		startDate.getFormattedDate(),
		startDate.getFormattedTime(),
		endDate.getFormattedTime(),
		startDate.getMinuteDiff(endDate)), optionalParams)
		.then((sentMsg) => {
			SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
		});
}

const BookingSteps = {
	book: {
		selectRoom: promptRoomSelection,
		selectTodayOrDate: promptTodayOrDateOption,
		selectDate: promptDateSelection,
		selectTimeslot: promptTimeslotSelection,
		selectDuration: promptDurationSelection,
		selectDescription: promptDescription,
		completeBooking: completeBooking
	},
	any: {
		promptAny: askAny,
		processAnyRoomInputs: anyRoom

	}
};

export default BookingSteps;
