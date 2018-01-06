import Slimbot from 'slimbot';
import EventEmitter from 'eventemitter3';
import Chrono from 'chrono-node';
import CalendarAPI from 'node-google-calendar';

import './Date';
import MESSAGES from './Messages';
import USERS from '../data/users';
import CONFIG, { ROOM_CONFIG, BOOKING_DURATION_OPTIONS } from '../config/settings';
import SessionManagement from './SessionManagement';
import * as ReplyBuilder from './ReplyBuilder';
import * as ParamBuilder from './ParamBuilder';
import * as CalendarApp from './CalendarApp';
// import Logger from './Logger';

const slimbot = new Slimbot(CONFIG.telegramBotToken);
const Emitter = new EventEmitter();
const SessionMgr = new SessionManagement(Emitter);

// let log = new Logger('transaction.log', 'error.log');
let botName;
let anyBookList = {};
let bookerList = {};
let roomlist = ROOM_CONFIG.roomsListing;

slimbot.getMe().then((update) => {
	console.log('bot started on ' + new Date().getISO8601TimeStamp());
	console.log(update);
	botName = update.result.username;
});

(function initCalendar() {
	console.log('init Calendar');
	let CalAPI = new CalendarAPI(CONFIG);
	CalendarApp.init(CalAPI, CONFIG, ROOM_CONFIG.roomsListing);
}());

// SessionManager listener

Emitter.on("sessionStateChange", function (event) {
	slimbot.editMessageText(event.userChatId, event.msgId, event.msg);
});

Emitter.on("clearUserSession", function (event) {
	clearUserSessionInfo(event.userChatId);
});

function clearUserSessionInfo(userChatId) {
	console.log('Clear user session data for user: ' + userChatId + '(no of uncompleted bookings: ' + Object.keys(bookerList).length + ' )');
	if (bookerList[userChatId] !== undefined) {
		delete bookerList[userChatId];
	}
	if (anyBookList[userChatId] !== undefined) {
		delete anyBookList[userChatId];
	}
}

// Register Telegram listeners
slimbot.on('message', (message) => {
	console.log('message');
	let isCommand = checkCommandList(message);

	if (!isCommand && anyBookList[message.chat.id] !== undefined) {
		anyRoom(message);
	}

	if (Object.keys(bookerList).length === 0) {
		return;
	}

	if (!isCommand) {
		completeBooking(message);
	}
});

slimbot.on('callback_query', (query) => {
	processCallBack(query);
});
// End of listeners

function processCallBack(query) {
	if (query.data !== undefined && query.data.trim() === '') {
		return;
	}
	let callback_data = JSON.parse(query.data);

	if (callback_data.exit !== undefined) {
		SessionMgr.terminateSession(callback_data.exit);

	} else if (callback_data.date === undefined) {
		promptTodayOrDateOption(callback_data.room, query, true);

	} else if (callback_data.date == 'pick_today') {
		promptTimeslotSelection(query, callback_data.room, new Date());

	} else if (callback_data.date == 'pick_date') {
		if (callback_data.month === undefined) {
			promptDateSelection(query, callback_data.room, new Date());
		}
	} else {
		// date selected
		if (callback_data.time === undefined) {
			promptTimeslotSelection(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date));

		} else if (callback_data.dur === undefined) {
			promptDurationSelection(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time);

		} else if (callback_data.description === undefined) {
			promptDescription(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time, callback_data.dur);

		}
	}
}

function checkAuthorisedUsers(message) {
	if (!USERS.hasOwnProperty(message.from.username)) {
		slimbot.sendMessage(message.chat.id, MESSAGES.unauthenticated);
		console.log(`Unauthenticated Access by ${message.from.username} on ${new Date().getISO8601TimeStamp()}`);
		throw new Error('Unauthenticated access');
	}
}

function checkRoomBookingCommands(message) {
	let commandlist = ROOM_CONFIG.roomsOpenForBooking;
	for (let key in commandlist) {
		if (commandlist[key].command === message.text) {
			promptTodayOrDateOption(key, message);
			return;
		}
	}
}

function checkCommandList(message) {
	console.log(message);
	checkAuthorisedUsers(message);
	checkRoomBookingCommands(message);

	if (message.text === '/version') {
		slimbot.sendMessage(message.chat.id, `v${process.env.npm_package_version}`);

	} else if (message.text === '/exit') {
		SessionMgr.terminateSession(message.chat.id);

	} else if (message.text === `/help@${botName}` || message.text === '/help') {
		slimbot.sendMessage(message.chat.id, MESSAGES.help, { parse_mode: 'Markdown' });

	} else if (message.text === '/view') {
		slimbot.sendMessage(message.chat.id, MESSAGES.view);

	} else if (message.text === '/book_any' || message.text === '/any') {
		askAny(message);

	} else if (message.text === '/book') {
		promptRoomSelection(message);

	} else if ((message.text === '/booked' && message.chat.type === 'group') || (message.text === '/delete' && message.chat.type === 'group')) {
		slimbot.sendMessage(message.chat.id, MESSAGES.private);
	} else if (message.chat.type === 'private') {
		return checkPrivateChatCommandList(message);
	} else {   // ignore non-commands
		return false;
	}
	return true;
}

function checkPrivateChatCommandList(message) {
	if (message.text === '/start') {
		slimbot.sendMessage(message.chat.id, MESSAGES.start, { parse_mode: 'Markdown' });

	} else if (message.text === '/help') {
		slimbot.sendMessage(message.chat.id, MESSAGES.help, { parse_mode: 'Markdown' });

	} else if (message.text === '/booked') {
		let fullname = message.from.first_name + ' ' + message.from.last_name;
		let searchQuery = '@' + message.chat.username;
		checkUserBookings(message, searchQuery, MESSAGES.noBooking);

	} else if (message.text === '/delete') {
		let fullname = message.from.first_name + ' ' + message.from.last_name;
		let searchQuery = '@' + message.chat.username;
		checkUserBookings(message, searchQuery, MESSAGES.noBooking, true);

	} else if (new RegExp(/\/deleteBookingqc[a-z0-9]+@/, 'i').test(message.text)) {
		let roomId = 'qc';
		let event2Id = message.text.substring(message.text.indexOf('c') + 1, message.text.indexOf('@'));
		let event1Id = message.text.substring(message.text.indexOf('@') + 1);
		deleteBookings([event1Id, event2Id], roomId, message);

	} else if (new RegExp(/\/deleteBooking[a-z0-9]+@/, 'i').test(message.text)) {
		let roomId = message.text.substring(message.text.indexOf('g') + 1, message.text.indexOf('@'));
		let bookId = message.text.substring(message.text.indexOf('@') + 1);
		deleteBookings([bookId], roomId, message);

	} else {  // ignore non-commands in private chat
		if (message.text.charAt(0) === '/' && message.text.length > 1) {
			slimbot.sendMessage(message.chat.id, MESSAGES.unrecognisedCommands, { parse_mode: 'Markdown' });
		}
		return false;
	}
	return true;
}

// booked command
function checkUserBookings(message, searchQuery, NoBookingReplyText, isDelete) {
	CalendarApp.listBookedEventsByUser(new Date(), searchQuery)
		.then((bookings) => {
			if (!bookings.length) {
				slimbot.sendMessage(message.chat.id, NoBookingReplyText, { parse_mode: 'Markdown' });
				return;
			}

			let count = 0;
			let msg = '';
			for (let key in bookings) {
				count++;
				let booking = bookings[key];
				msg += '-------------------------------\n';
				console.log(booking.summary);
				let details = booking.summary.split(' by ');
				let recur = booking.recurrent === undefined ? '' : booking.recurrent;
				console.log(recur);
				msg += ReplyBuilder.checkBookings(count, details[0] + recur, booking.location, booking.start.dateTime, booking.end.dateTime, details[1]);
				if (undefined !== isDelete) {
					if (!booking.isByMe) {
						msg += MESSAGES.notBookedByMe;
					} else {
						let aryDesc = booking.description.split('@');
						let room2Id = '';
						if (aryDesc.length > 1) {
							room2Id = aryDesc[1];
						}
						msg += `${MESSAGES.deleteInstruction}/\deleteBooking${booking.room}${room2Id}@${booking.id}\n`;
					}
				}
				msg = msg.replace('_', '-'); // escape _ cuz markdown cant handle it
			}
			let reply = MESSAGES.listBooking + msg;
			slimbot.sendMessage(message.chat.id, reply, { parse_mode: 'Markdown' });

		});
}

function promptRoomSelection(message) {
	let optionalParams = {
		parse_mode: 'markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: ParamBuilder.constructRoomOptions(ROOM_CONFIG.roomsOpenForBooking)
		})
	};
	slimbot.sendMessage(message.chat.id, MESSAGES.book, optionalParams)
		.then((sentMsg) => {
			SessionMgr.startSessionCountdown(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
		});
}

// Step 1 - Today or Date
function promptTodayOrDateOption(roomSelectedId, query, hasPrevMsg) {
	console.log('Room Selected: /' + roomSelectedId);
	let optionalParams = ParamBuilder.getTodayOrDateOptions(roomSelectedId);
	let msg = ReplyBuilder.askForDate(roomlist[roomSelectedId].name);
	if (hasPrevMsg) {
		slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
		SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
	} else {
		slimbot.sendMessage(query.chat.id, msg, optionalParams)
			.then((message) => {
				SessionMgr.startSessionCountdown(message.result.chat.id, message.result.message_id, message.result.chat.username);
			});
	}
}

function promptDateSelection(query, room, startDate) {
	let msg = `You have selected:\n*${roomlist[room].name}*\n\nPlease select a date in the upcoming month:`;
	slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getDateSelection(room));
	SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
}

// //Step 2 - Timeslot
function promptTimeslotSelection(query, room, startDate) {
	let startDateStr = new Date().getISO8601TimeStamp();
	if (!startDate.isDateToday()) {
		startDateStr = startDate.getISO8601DateWithDefinedTime(8, 0, 0, 0);
	}

	CalendarApp.listEmptySlotsInDay(startDateStr, room)
		.then((jsonArr) => {
			console.log('promptTimeslotSelection - listEmptySlotsInDay done:');
			console.log(jsonArr);
			let msg = ReplyBuilder.askForTime(roomlist[room].name, startDate);
			if (jsonArr === undefined || jsonArr === {} || Object.keys(jsonArr).length === 0) {
				msg = ReplyBuilder.informNoTimeslot(roomlist[room].name, startDate);
			}
			slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getTimeslots(jsonArr, room, startDate));
			SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
		})
		.catch((err) => {
			console.log('Error promptTimeslotSelection: room: ' + room + ' | ' + JSON.stringify(err));
			slimbot.editMessageText(query.message.chat.id, query.message.message_id, MESSAGES.error);
			throw new Error('Error promptTimeslotSelection: ' + JSON.stringify(err));
		});
}

// Step 3 - Duration
function promptDurationSelection(query, room, startDate, startTime) {
	CalendarApp.listAvailableDurationForStartTime(startDate.getISO8601DateWithDefinedTimeString(startTime), room)
		.then((jsonArr) => {
			let msg = ReplyBuilder.askForDuration(roomlist[room].name, startDate, startTime);
			slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getDuration(jsonArr, room, startDate, startTime));
			SessionMgr.extendSession(query.message.chat.id, query.message.message_id, query.message.chat.username);
		})
		.catch((err) => {
			console.log('Error promptDurationSelection: ' + JSON.stringify(err));
			slimbot.editMessageText(query.message.chat.id, query.message.message_id, MESSAGES.error);
		});
}

//Step 4 - Booking Description
function promptDescription(query, room, startDate, startTime, duration) {
	let msg = ReplyBuilder.askForDescription(roomlist[room].name, startDate, startTime, BOOKING_DURATION_OPTIONS[duration]);
	slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, ParamBuilder.getBackButton(room, startDate, startTime, duration))
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
function completeBooking(query) {
	if (bookerList[query.from.id] === undefined) {
		return;
	}
	// TODO: input validation before sending to gcal. _ wouldnt work properly

	let booking = bookerList[query.from.id];

	if (booking.chatType == query.chat.type) {
		let summary = query.text;
		let fullname = query.from.first_name + ' ' + query.from.last_name;

		insertBookingIntoCalendar(booking.id, booking.msgid, summary, booking.room,
			new Date().setDateWithSimpleFormat(booking.date), booking.time, booking.dur, booking.name, fullname);
	}
}

function insertBookingIntoCalendar(userId, msgId, description, room, startDate, timeSlot, duration, userName, fullName) {
	let bookingSummary = `${description} by @${userName} (${fullName})`;
	let startTime = startDate.getISO8601DateWithDefinedTimeString(timeSlot);
	for (let i = 0; i < duration; i++) {
		startDate.addMinutes(30);
	}
	let endTime = startDate.getISO8601TimeStamp();

	CalendarApp.queueForInsert(bookingSummary, startTime, endTime, room, 'confirmed', 'booked via butler', userName)
		.then((json) => {
			slimbot.editMessageText(userId, msgId, MESSAGES.confirm);
			let startDateTime = new Date(json.start);
			let endDateTime = new Date(json.end);
			let msg = ReplyBuilder.bookingConfirmed(roomlist[room].name, startDateTime.getFormattedDate(), startDateTime.getFormattedTime(), endDateTime.getFormattedTime(), fullName, userName, description);

			slimbot.sendMessage(userId, msg, { parse_mode: 'Markdown' })
				.then((message) => {
					msg = ReplyBuilder.bookingConfirmedCalendarLink(json);
					slimbot.sendMessage(userId, msg);
					// log.transaction(userId, 'insertEvent', { bookingSummary: bookingSummary, room: room, startTime: startTime, endTime: endTime });
				});
			SessionMgr.endSession(userId);
		}).catch((err) => {
			console.log('Error insertBookingIntoCalendar: ' + JSON.stringify(err));
			slimbot.editMessageText(userId, msgId, MESSAGES.tooLate);
			// log.error(userId, 'insertBookingIntoCalendar', err.message);
			throw err;
		});
}

function deleteBookings(eventsToDeleteArray, roomId, message) {
	CalendarApp.deleteEvents(eventsToDeleteArray, roomId).then(
		() => {
			let deletedFromRoom = roomlist[roomId].name;
			slimbot.sendMessage(message.chat.id, `${MESSAGES.delete} for ${deletedFromRoom}.`, { parse_mode: 'Markdown' });
			let fullname = `${message.from.first_name} ${message.from.last_name}`;
			let searchQuery = `@${message.chat.username}`;
			// log.transaction(userId, 'deleteEvent', { username: searchQuery, room: roomId, eventsToDelete: eventsToDeleteArray });

			checkUserBookings(message, searchQuery, MESSAGES.noBookingAfterDelete, true);
		}).catch((err) => {
			console.log(err);
			//log.error(userId, 'deleteBookings', err.message);
			slimbot.sendMessage(message.chat.id, MESSAGES.deleteErr, { parse_mode: 'Markdown' });
		});
}

// Exit Booking
function replyCancelBookProcess(query) {
	slimbot.editMessageText(query.from.id, query.message.message_id, MESSAGES.canceled);
}

// Free-text flow
function askAny(message) {
	slimbot.sendMessage(message.chat.id, ReplyBuilder.askAnyRoom(), { parse_mode: 'markdown' })
		.then(sentMsg => {
			SessionMgr.startSessionCountdown(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			anyBookList[message.chat.id] = {};
		});
}

function anyRoom(message) {
	let results = new Chrono.parse(message.text);
	if (!results.length || results[0].end === undefined || results[0].start === undefined) {
		slimbot.sendMessage(message.chat.id, ReplyBuilder.askAnyRoomErrorInput(), { parse_mode: 'markdown' })
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
		slimbot.sendMessage(message.chat.id, ReplyBuilder.rejectAnyRoomForWrongDatetime(startTime.getFormattedDate(),
			startTime.getFormattedTime(), endTime.getFormattedTime(), startTime.getMinuteDiff(endTime)),
			{ parse_mode: 'markdown' })
			.then((sentMsg) => {
				SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			});
		return;
	}

	let maxBookingDurationSlotsAllowed = 8;
	let numOfSlotsBooked = Math.round(startTime.getMinuteDiff(endTime) / 30);
	if (numOfSlotsBooked > maxBookingDurationSlotsAllowed) {
		slimbot.sendMessage(message.chat.id, ReplyBuilder.rejectAnyRoomForLongBooking(startTime.getFormattedDate(),
			startTime.getFormattedTime(), endTime.getFormattedTime(), startTime.getMinuteDiff(endTime)),
			{ parse_mode: 'markdown' })
			.then((sentMsg) => {
				SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
			});
		return;
	}

	slimbot.sendMessage(message.chat.id, ReplyBuilder.checkAnyRoom(), { parse_mode: 'markdown' });

	// look up lowest-priority cal for available slot
	let rooms = ['fg', 'q1', 'q2', 'qc'];
	checkRoomFreeAtTimeslot(message, startTime, endTime, rooms);
}

function checkRoomFreeAtTimeslot(message, startDate, endDate, rooms) {
	if (!rooms.length) {
		slimbot.sendMessage(message.chat.id, ReplyBuilder.askAnyRoomNoRoom(), { parse_mode: 'markdown' });
		return;
	}
	return CalendarApp.checkTimeslotFree(startDate, endDate, rooms[0])
		.then((roomFree) => {
			if (roomFree) {
				let numOfSlots = Math.round(startDate.getMinuteDiff(endDate) / 30);

				let optionalParams = {
					parse_mode: 'markdown',
					reply_markup: JSON.stringify({
						inline_keyboard: [[
							{ text: 'Yes', callback_data: JSON.stringify({ date: startDate.getSimpleDate(), time: startDate.getFormattedTime(), dur: numOfSlots + '', room: rooms[0] }) },
							{ text: 'No', callback_data: JSON.stringify({ exit: message.chat.id + '' }) }
						]]
					})
				};

				delete anyBookList[message.chat.id];

				slimbot.sendMessage(message.chat.id, ReplyBuilder.confirmAnyRoom(startDate.getFormattedDate(),
					startDate.getFormattedTime(), endDate.getFormattedTime(), startDate.getMinuteDiff(endDate), roomlist[rooms[0]].name), optionalParams)
					.then((sentMsg) => {
						SessionMgr.extendSession(sentMsg.result.chat.id, sentMsg.result.message_id, sentMsg.result.chat.username);
					});
			} else {
				console.log(`${rooms[0]} is not free, trying next room`);
				rooms.shift();
				checkRoomFreeAtTimeslot(message, startDate, endDate, rooms);
			}
		});
}
export { slimbot };
