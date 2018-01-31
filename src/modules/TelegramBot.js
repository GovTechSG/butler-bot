import Slimbot from 'slimbot';
import EventEmitter from 'eventemitter3';
import CalendarAPI from 'node-google-calendar';

import './Date';
import MESSAGES from './Messages';
import USERS from '../data/users';
import CONFIG, { ROOM_CONFIG, BOOKING_DURATION_OPTIONS } from '../config/settings';
import SessionManagement from './SessionManagement';
import * as ReplyBuilder from './ReplyBuilder';
import * as CalendarApp from './CalendarApp';
import BookingSteps from './BookingSteps';
// import Logger from './Logger';

const slimbot = new Slimbot(CONFIG.telegramBotToken);
const Emitter = new EventEmitter();
const SessionMgr = new SessionManagement(Emitter);

// let log = new Logger('transaction.log', 'error.log');
let botName;
let anyBookingList = {};
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
	CalendarApp.init(CalAPI, CONFIG, ROOM_CONFIG.roomsListing, BOOKING_DURATION_OPTIONS);
}());

// SessionManager listener

Emitter.on('sessionStateChange', function (event) {
	slimbot.editMessageText(event.userChatId, event.msgId, event.msg);
});

Emitter.on('clearUserSession', function (event) {
	clearUserSessionInfo(event.userChatId);
});

function clearUserSessionInfo(userChatId) {
	console.log('Clear user session data for user: ' + userChatId + '(no of uncompleted bookings: ' + Object.keys(bookerList).length + ' )');
	if (bookerList[userChatId] !== undefined) {
		delete bookerList[userChatId];
	}
	if (anyBookingList[userChatId] !== undefined) {
		delete anyBookingList[userChatId];
	}
}

// Register Telegram listeners
slimbot.on('message', (message) => {
	console.log('incoming message');
	checkAuthorisedUsers(message);

	let isCommand = checkCommandList(message);

	if (!isCommand && anyBookingList[message.chat.id] !== undefined) {
		BookingSteps.any.processAnyRoomInputs(slimbot, message, anyBookingList);
	}

	if (Object.keys(bookerList).length === 0) {
		return;
	}

	if (!isCommand) {
		BookingSteps.book.completeBooking(slimbot, message, bookerList);
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
		BookingSteps.book.selectTodayOrDate(slimbot, callback_data.room, query, true);

	} else if (callback_data.date === 'pick_today') {
		BookingSteps.book.selectTimeslot(slimbot, query, callback_data.room, new Date());

	} else if (callback_data.date === 'pick_date') {
		if (callback_data.month === undefined) {
			BookingSteps.book.selectDate(slimbot, query, callback_data.room, new Date());
		}
	} else {
		// date selected
		if (callback_data.time === undefined) {
			BookingSteps.book.selectTimeslot(slimbot, query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date));

		} else if (callback_data.dur === undefined) {
			BookingSteps.book.selectDuration(slimbot, query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time);

		} else if (callback_data.description === undefined) {
			BookingSteps.book.selectDescription(
				slimbot,
				query,
				callback_data.room,
				new Date().setDateWithSimpleFormat(callback_data.date),
				callback_data.time,
				callback_data.dur,
				roomlist[callback_data.room].name,
				bookerList);
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
			BookingSteps.book.selectTodayOrDate(slimbot, key, message);
			return;
		}
	}
}

function checkCommandList(message) {
	console.log(message);
	checkRoomBookingCommands(message);

	if (message.text === '/version') {
		slimbot.sendMessage(message.chat.id, `v${process.env.npm_package_version}`);

	} else if (message.text === '/exit') {
		SessionMgr.terminateSession(message.chat.id);
	} else if (message.text === '/contribute') {
		slimbot.sendMessage(message.chat.id, MESSAGES.contribute, { parse_mode: 'Markdown' });
	} else if (message.text === `/help@${botName}` || message.text === '/help') {
		slimbot.sendMessage(message.chat.id, MESSAGES.help, { parse_mode: 'Markdown' });

	} else if (message.text === '/view') {
		slimbot.sendMessage(message.chat.id, MESSAGES.view);

	} else if (message.text === '/book_any' || message.text === '/any') {
		BookingSteps.any.promptAny(slimbot, message, anyBookingList);

	} else if (message.text === '/book') {
		BookingSteps.book.selectRoom(slimbot, message);

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
				// console.log(booking.summary);
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

function deleteBookings(eventsToDeleteArray, roomId, message) {
	CalendarApp.deleteEvents(eventsToDeleteArray, roomId)
		.then(() => {
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

export { slimbot, SessionMgr };
