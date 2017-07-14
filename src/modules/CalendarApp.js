// CalendarApp: booking specific calendar logic
import Promise from 'bluebird';
import EventEmitter from 'eventemitter3';
import './Date';

const colourDict = { 'fg': 5, 'dr': 7, 'q1': 6, 'q2': 10, 'qc': 11, 'bb': 3 };
// const RoomList = {
// 	queen1: { id: 'q1', name: 'Queen (Video)' },
// 	queen2: { id: 'q2', name: 'Queen (Projector)' },
// 	queenC: { id: 'qc', name: 'Queen (Combined)', children: ['q1', 'q2'] },
// 	drone: { id: 'dr', name: 'Drone' },
// 	fgd: { id: 'fg', name: 'Focus Group Discussion' },
// 	bb: { id: 'bb', name: 'Bumblebee' }
// };
const jointRoomList = {
	'qc': ['q1', 'q2']
};

const durationOptions = {
	1: '30 mins',
	2: '1 hour',
	3: '1.5 hours',
	4: '2 hours',
	5: '2.5 hours',
	6: '3 hours',
	7: '3.5 hours',
	8: '4 hours'
};

let config;
let cal;
let calendarIdList;
let roomInfoList;

let EE = new EventEmitter();
let bookingQueue = [];

export function init(calendarApiInstance, configObj, roomlistObj) {
	cal = calendarApiInstance;
	config = configObj;
	calendarIdList = configObj.calendarId;
	roomInfoList = roomlistObj;
}

export function getColourForRoom(roomname) {
	return colourDict[roomname];
}

export function getRoomNameFromId(id) {
	return roomInfoList[id].name;
}

function getTimeslotName(startTime) {
	let timeslot = startTime.getFormattedTime();
	startTime = startTime.addMinutes(30);
	return timeslot;
}

export function setupTimeArray(datetimeStr) {
	let earliestSlotToday = new Date(datetimeStr).setTime(8, 0, 0, 0);
	let startTime = new Date(datetimeStr);
	let endTime = new Date(datetimeStr).setTime(21, 0, 0, 0);

	if (!startTime.isDateToday() || startTime < earliestSlotToday) {
		startTime = earliestSlotToday;
	} else if (startTime.isDateToday() && startTime > endTime) {
		return {};
	}
	let roundedTimeStart = startTime.roundupToNearestHalfHour();

	let numOfSlots = Math.round(startTime.getMinuteDiff(endTime) / 30);
	let timeslotDict = {};
	for (let i = 0; i < numOfSlots; i++) {
		let formattedTimeStart = roundedTimeStart.getFormattedTime();
		timeslotDict[getTimeslotName(roundedTimeStart)] = formattedTimeStart;
	}
	return timeslotDict;
}

function countSlotsWithinTimeframe(startTime, endTime) {
	let timeDiff = endTime.getTime() - startTime.getTime();
	return Math.round(timeDiff / (30 * 60 * 1000));
}

export function getDurationOptionNameWithId(optionId) {
	return durationOptions[optionId];
}

export function checkWithinWeek(startDate, today, recurrenceInWeek, dayDiffInWeek) {
	let daysToAddTillNextOccur = 0;
	if (startDate >= today) {
		return daysToAddTillNextOccur;
	}

	for (let j in recurrenceInWeek) {
		let dayInWeek = new Date(startDate);
		dayInWeek.addDays(dayDiffInWeek[recurrenceInWeek[j]]);
		daysToAddTillNextOccur = dayDiffInWeek[recurrenceInWeek[j]];

		if (dayInWeek >= today) {
			return daysToAddTillNextOccur;
		}
	}
	return -1;
}

export function calculateUpcomingRecurrence(recurrenceEvent, today) {
	if (today === undefined) {
		throw new Error('today missing');
	}
	let startDate = new Date(recurrenceEvent.start.dateTime);
	let endDate = new Date(recurrenceEvent.end.dateTime);
	let recurCount = 0;
	let maxRecurCount = (recurrenceEvent.count === undefined) ? 999 : parseInt(recurrenceEvent.count);
	let interval = (recurrenceEvent.interval === undefined) ? 1 : parseInt(recurrenceEvent.interval);
	let terminatingDate = (recurrenceEvent.until === undefined) ? new Date().setDateWithSimpleFormat('1/1/3000') : new Date().setDateWithGoogleRecurEventISO8601Format(recurrenceEvent.until);

	if (recurrenceEvent.freq === 'WEEKLY') {
		interval *= 7;
		while (startDate < today && recurCount < maxRecurCount) {
			if (recurrenceEvent.byday !== undefined) {
				let recurrenceInWeek = recurrenceEvent.byday.split(',');
				let daysTillClosestOccurrenceInWeek = checkWithinWeek(startDate, today, recurrenceInWeek, startDate.getNumOfDaysDiffInWeekForDayNames());
				if (daysTillClosestOccurrenceInWeek > -1) {
					startDate.addDays(daysTillClosestOccurrenceInWeek);
					endDate.addDays(daysTillClosestOccurrenceInWeek);
					break;
				}
			}
			startDate.addDays(interval);
			recurCount++;
		}
		endDate.addDays(interval * recurCount);
	} else if (recurrenceEvent.freq === 'DAILY') {
		while (startDate < today && recurCount < maxRecurCount) {
			startDate.addDays(interval);
			recurCount++;
		}
		endDate.addDays(interval * recurCount);
	}

	if ((startDate < today) || (startDate > terminatingDate)) {
		return {};
	}
	return { startDate, endDate };
}

export function parseRecurrenceEvent(event) {
	let eventRecurrenceInfo = { start: event.start, end: event.end };
	let recurrenceString = event.recurrence[0];
	recurrenceString = recurrenceString.slice(recurrenceString.indexOf(':') + 1);
	let fields = recurrenceString.split(';');
	for (let i in fields) {
		let fieldArr = fields[i].split('=');
		eventRecurrenceInfo[fieldArr[0].toLowerCase()] = fieldArr[1];
	}

	return eventRecurrenceInfo;
}

export function listBookedEventsByUser(startDateTime, user) {
	let promiseList = [];
	let bookedEventsArray = [];
	let endDateTime = startDateTime;
	startDateTime = startDateTime.getISO8601TimeStamp();
	endDateTime = endDateTime.addDays(365).getISO8601TimeStamp();

	for (let room in calendarIdList) {
		let calendarId = calendarIdList[room];

		promiseList.push(cal.listEvents(calendarId, startDateTime, endDateTime, user)
			.then((json) => {

				let eventsInCalendar = [];
				for (let i = 0; i < json.length; i++) {
					if (json[i].description === undefined) json[i].description = '';
					if (json[i].recurrence !== undefined) {
						let { startDate, endDate } = calculateUpcomingRecurrence(parseRecurrenceEvent(json[i]), new Date());
						if (startDate !== undefined) {
							json[i].recurrent = ' (Recurring)';
							json[i].start = { dateTime: startDate.getISO8601TimeStamp() };
							json[i].end = { dateTime: endDate.getISO8601TimeStamp() };
						}
					}
					let event = {
						id: json[i].id,
						summary: json[i].summary,
						location: json[i].location,
						start: json[i].start,
						end: json[i].end,
						status: json[i].status,
						description: json[i].description,
						room: room,
						isByMe: json[i].description.indexOf('booked via butler') !== -1,
						recurrent: json[i].recurrent
					};
					eventsInCalendar.push(event);
					bookedEventsArray.push(event);
				}
				return eventsInCalendar;
			}).catch((err) => {
				throw err;
			})
		);
	}

	return Promise.all(promiseList).then(
		(eventsRoom1, eventsRoom2, eventsRoom3, eventsRoom4, eventsRoom5) => {
			// modify event summaries + combine queensC events

			for (let key in bookedEventsArray) {
				let evnt = bookedEventsArray[key];
				// let bookingDescription = evnt.summary;
				let bookedRoomName = evnt.location;
				// evnt.summary = bookingDescription;

				if (bookedRoomName === roomInfoList.qc.name) {
					if (evnt.description.indexOf('@') >= 0) {
						evnt.room = roomInfoList.qc.id;
					} else {
						delete bookedEventsArray[key];
					}
				}
			}
			return bookedEventsArray;
		});
}

export function listBookedEventsByRoom(startDateTime, endDateTime, query) {
	let bookedEventsArray = [];
	let calendarId = calendarIdList[query];

	return cal.listEvents(calendarId, startDateTime, endDateTime)
		.then((json) => {
			for (let i = 0; i < json.length; i++) {
				if (json[i].recurrence !== undefined) {
					let { startDate, endDate } = calculateUpcomingRecurrence(parseRecurrenceEvent(json[i]), new Date());
					if (startDate !== undefined) {
						json[i].start = { dateTime: startDate.getISO8601TimeStamp() };
						json[i].end = { dateTime: endDate.getISO8601TimeStamp() };
					}
				}
				let event = {
					id: json[i].id,
					summary: json[i].summary,
					location: json[i].location,
					start: json[i].start,
					end: json[i].end,
					status: json[i].status
				};
				bookedEventsArray.push(event);
			}
			return bookedEventsArray;
		}).catch((err) => {
			console.log('listBookedEventsByRoom Error:' + err);
			throw err;
		});
}

export function handleListingForTwoCalendars(date, endDate, roomId) {
	return Promise.join(
		exports.listBookedEventsByRoom(date, endDate, jointRoomList[roomId][0])
			.then((jsonArr) => {
				return jsonArr;
			}),

		exports.listBookedEventsByRoom(date, endDate, jointRoomList[roomId][1])
			.then(jsonArr => {
				return jsonArr;
			}),

		(timeslotRoom1, timeslotRoom2) => {
			return timeslotRoom1.concat(timeslotRoom2);
		}
	).catch((err) => {
		console.log('handleListingForTwoCalendars Error');
		throw new Error("handleListingForTwoCalendars error: " + err);
	});
}

export function filterBusyTimeslots(timeslotDict, roomBusyTimeslot) {
	if (timeslotDict === {}) {
		return timeslotDict;
	}

	for (let key in roomBusyTimeslot) {
		if (roomBusyTimeslot[key].start === undefined || roomBusyTimeslot[key].status !== 'confirmed') {
			continue;
		}
		let startTime = new Date(roomBusyTimeslot[key].start.dateTime);
		let endTime = new Date(roomBusyTimeslot[key].end.dateTime);

		let count = countSlotsWithinTimeframe(startTime, endTime);
		for (let x = 0; x < count; x++) {
			delete timeslotDict[getTimeslotName(startTime)];
		}
	}
	return timeslotDict;
}

// assumes booking for max length of a day
export function listEmptySlotsInDay(date, roomId) {
	let endDate = new Date(date).addDays(1).getISO8601TimeStamp();
	date = new Date(date).getISO8601TimeStamp();
	console.log('\tAttempting listEmptySlotsInDay: ' + getRoomNameFromId(roomId) + ' ' + date + ' - ' + endDate);

	if (roomId == roomInfoList.qc.id) {
		return exports.handleListingForTwoCalendars(date, endDate, roomId)
			.then((timeslotObj) => {
				// console.log(timeslotObj);
				let timeArr = setupTimeArray(date);
				filterBusyTimeslots(timeArr, timeslotObj);
				// console.log(timeArr);
				return timeArr;
			})
			.catch((err) => {
				console.log('listEmptySlotsInDay Error: ' + err);
				throw new Error('listEmptySlotsInDay error: ' + err);
			});
	}
	return exports.listBookedEventsByRoom(date, endDate, roomId)
		.then((timeslotObj) => {
			let timeArr = setupTimeArray(date);
			exports.filterBusyTimeslots(timeArr, timeslotObj);
			// console.log(timeArr);
			return timeArr;
		})
		.catch((err) => {
			console.log('listEmptySlotsInDay Error: ' + err);
			throw new Error('listEmptySlotsInDay error: ' + err);
		});
}

export function listAvailableDurationForStartTime(startDatetimeStr, roomId) {
	const listAvailableTime = 21; // Check available time up to 9 pm
	let startTimestamp = new Date(startDatetimeStr).getISO8601TimeStamp();
	let endTimestamp = new Date(startDatetimeStr).getISO8601DateWithDefinedTime(listAvailableTime, 0, 0, 0);

	if (roomId == roomInfoList.qc.id) {
		return handleListingForTwoCalendars(startTimestamp, endTimestamp, roomId)
			.then((timeslotObj) => {
				return filterDurationSlots(timeslotObj, startTimestamp);
			})
			.catch((err) => {
				throw new Error('listAvailableDurationForStartTime: ' + err);
			});
	} else {
		return listBookedEventsByRoom(startTimestamp, endTimestamp, roomId)
			.then((jsonArr) => {
				return filterDurationSlots(jsonArr, startTimestamp);
			})
			.catch((err) => {
				throw new Error('listAvailableDurationForStartTime: ' + err);
			});
	}
}

export function filterDurationSlots(roomBusyTimeslot, startDatetimeStr) {
	let maxDurationBlocksAllowed = 8;
	let closestEventBlocksAway = 99;
	let durOptions = {
		1: '30 mins',
		2: '1 hour',
		3: '1.5 hours',
		4: '2 hours',
		5: '2.5 hours',
		6: '3 hours',
		7: '3.5 hours',
		8: '4 hours'
	};

	if (roomBusyTimeslot.length === 0) {
		return durOptions;
	}

	for (let event in roomBusyTimeslot) {
		let setOf30minsBlocks = new Date(startDatetimeStr).getMinuteDiff(new Date(roomBusyTimeslot[event].start.dateTime)) / 30;
		if (setOf30minsBlocks < closestEventBlocksAway) {
			closestEventBlocksAway = setOf30minsBlocks;
		}
	}

	if (closestEventBlocksAway > maxDurationBlocksAllowed) {
		closestEventBlocksAway = maxDurationBlocksAllowed;
	}

	for (let x = maxDurationBlocksAllowed; x > closestEventBlocksAway; x--) {
		if (durOptions[x] !== undefined) {
			delete durOptions[x];
		}
	}
	return durOptions;
}

export function insertEventForCombinedRoom(room1Details, room2Details, username) {
	return insertEvent(room2Details.bookingSummary, room2Details.startDateTime, room2Details.endDateTime,
		room2Details.location, room2Details.status, room2Details.description, username, roomInfoList.qc.name)
		.then((resultsRoom2) => {
			room1Details.description += `@${resultsRoom2.id}`;

			return insertEvent(room1Details.bookingSummary, room1Details.startDateTime, room1Details.endDateTime,
				room1Details.location, room1Details.status, room1Details.description, username, roomInfoList.qc.name)
				.then((resultsRoom1) => {
					let results = {
						'summary': resultsRoom1.summary,
						'location': resultsRoom1.location,
						'status': resultsRoom1.status,
						'htmlLink': config.calendarUrl,
						'start': new Date(resultsRoom1.start).getISO8601TimeStamp(),
						'end': new Date(resultsRoom1.end).getISO8601TimeStamp(),
						'created': new Date(resultsRoom1.created).getISO8601TimeStamp()
					};
					return results;
				});
		}).catch((err) => {
			throw new Error('insertEventForCombinedRoom: ' + err);
		});
}

export function insertEvent(bookingSummary, startDateTimeStr, endDateTimeStr, location, status, description, username, combinedName) {
	console.log(`\tAttempting insertEvent: ${location} | ${startDateTimeStr} | ${endDateTimeStr} | ${bookingSummary} | ${username}  | ${description} `);

	if (location === roomInfoList.qc.id) {
		let eventRoom1 = {
			'bookingSummary': bookingSummary,
			'startDateTime': startDateTimeStr,
			'endDateTime': endDateTimeStr,
			'location': roomInfoList.q1.id,
			'status': status,
			'description': description
		};
		let eventRoom2 = {
			'bookingSummary': bookingSummary,
			'startDateTime': startDateTimeStr,
			'endDateTime': endDateTimeStr,
			'location': roomInfoList.q2.id,
			'status': status,
			'description': description
		};
		return insertEventForCombinedRoom(eventRoom1, eventRoom2, username)
			.catch((err) => {
				throw new Error('insertEvent: ' + err);
			});
	}
	let calendarId = calendarIdList[location];
	let room = getRoomNameFromId(location);
	if (combinedName !== undefined) {
		room = combinedName;
	}
	return cal.insertEvent(calendarId, bookingSummary, startDateTimeStr, endDateTimeStr, room, status, description, getColourForRoom(location))
		.then((resp) => {
			// console.log(resp.body);
			let json = resp.body;
			let results = {
				'id': json.id,
				'summary': json.summary,
				'location': json.location,
				'status': json.status,
				'htmlLink': config.calendarUrl,
				'start': json.start.dateTime,
				'end': json.end.dateTime,
				'created': new Date(json.created).getISO8601TimeStamp()
			};
			return results;
		})
		.catch((err) => {
			console.log('insertEvent Error: ' + err);
			throw new Error('insertEvent: ' + err);
		});
}

export function queueForInsert(bookingSummary, startDateTimeStr, endDateTimeStr, location, status, description, username) {
	let bookTime = new Date();
	let booking = {
		bookingSummary: bookingSummary,
		startDateTime: startDateTimeStr,
		endDateTime: endDateTimeStr,
		location: location,
		status: status,
		description: description,
		username: username,
		bookTime: bookTime
	};

	bookingQueue.push(booking);
	return new Promise((fulfill, reject) => {
		EE.once('booked' + username + bookTime, (resp) => {
			if (resp.success) {
				fulfill(resp.results);
			} else {
				reject();
			}
		}, {});

		waitForTurnToBook(username, bookTime);
	});
}

function checkBookingTurn(username, bookTime, bookQueue) {
	let firstItemInQueue = bookQueue[0];
	console.log('checking turn: ' + firstItemInQueue.username + ' == ' + username);
	if (firstItemInQueue.username == username && firstItemInQueue.bookTime == bookTime) {
		// current booking's turn
		console.log('turn for ' + username + ' to insert event');
		return true;
	}

	// not current booking's turn yet
	return false;
}

function checkJointRoomFree(startDateTimeStr, endDateTimeStr, room) {
	let promiseList = [];
	let statusList = [];
	let jointRoom = jointRoomList[room];

	for (let smallRoom in jointRoom) {
		console.log('checkJointRoomFree: ' + jointRoom[smallRoom]);

		let calendarId = calendarIdList[jointRoom[smallRoom]];

		promiseList.push(
			cal.checkBusyPeriod(calendarId, startDateTimeStr, endDateTimeStr)
				.then((json) => {
					if (json != undefined && json.length > 0) {
						statusList.push(false);
						return false;
					} else {
						statusList.push(true);
						return true;
					}
				}).catch((err) => {
					throw new Error("checkJointRoomFree: " + err);
				})
		);
	}

	return Promise.all(promiseList).then(
		(room1Free, room2Free) => {
			let result = statusList[0];
			for (let index in statusList) {
				result = result && statusList[index];
			}
			return result;
		});
}

export function checkTimeslotFree(startDateTimeStr, endDateTimeStr, room) {
	console.log('checkTimeslotFree: ' + startDateTimeStr + ', ' + endDateTimeStr + ' ,' + room);

	if (room === roomInfoList.qc.id) {
		return checkJointRoomFree(startDateTimeStr, endDateTimeStr, room);
	}

	let calendarId = calendarIdList[room];
	return cal.checkBusyPeriod(calendarId, startDateTimeStr, endDateTimeStr)
		.then(function (eventsJson) {
			if (eventsJson !== undefined && eventsJson.length > 0) {
				return false;
			}
			return true;
		}).catch((err) => {
			throw new Error('checkTimeslotFree: ' + err);
		});

}

function handleBookingProcess(booking) {
	checkTimeslotFree(booking.startDateTime, booking.endDateTime, booking.location)
		.then((isSlotFree) => {
			if (isSlotFree) {
				insertEvent(booking.bookingSummary, booking.startDateTime, booking.endDateTime,
					booking.location, booking.status, booking.description, booking.username)
					.then((results) => {
						bookingQueue.shift();
						EE.emit('booked' + booking.username + booking.bookTime, { success: true, results: results });
					});
			} else {
				bookingQueue.shift();
				EE.emit('booked' + booking.username + booking.bookTime, { success: false });
			}
		});
}

function waitForTurnToBook(username, bookTime) {
	if (checkBookingTurn(username, bookTime, bookingQueue)) {
		let booking = bookingQueue[0];
		handleBookingProcess(booking);
	} else {
		setTimeout(() => {
			waitForTurnToBook(username, bookTime);
		}, 3000);
	}
}

export function deleteEvents(eventIdArray, roomId) {
	let promiseList = [];
	if (roomInfoList.qc.id === roomId) {
		for (let index in roomInfoList.qc.children) {
			let childRoom = roomInfoList.qc.children[index];
			let calendarId = calendarIdList[childRoom];
			console.log(`\tAttempting to delete event: ${childRoom}, ${eventIdArray[index]} `)
			promiseList.push(cal.deleteEvent(calendarId, eventIdArray[index]));
		}
	} else {
		console.log(`\tAttempting to delete event: ${roomId}, ${eventIdArray[0]} `)
		promiseList.push(cal.deleteEvent(calendarIdList[roomId], eventIdArray[0]));
	}
	return Promise.all(promiseList).then((result) => {
		console.log('\t' + JSON.stringify(result));
		return result;
	}).catch((err) => {
		throw new Error('deleteEvents: ' + err);
	});
}
