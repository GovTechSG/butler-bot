//cal-app.js - booking app specific calendar logic
import { CONFIG } from '../config/settings';
import CalendarAPI from 'node-google-calendar';
import './Date';
import Promise from 'bluebird';
import EventEmitter from 'eventemitter3';

const cal = new CalendarAPI(CONFIG);

let calendarIdList = CONFIG.calendarId;

let EE = new EventEmitter();

let colourDict = { "fg": 1, "dr": 2, "q1": 3, "q2": 4, "qc": 5, "bb": 6 };
let RoomList = {
    queen1: { id: 'q1', name: 'Queen 1' },
    queen2: { id: 'q2', name: 'Queen 2' },
    queenC: { id: 'qc', name: 'Queen (Combined)', children: ['q1', 'q2'] },
    drone: { id: 'dr', name: 'Drone' },
    fgd: { id: 'fg', name: 'Focus Group Discussion Room' },
    bb: { id: 'bb', name: 'Bumblebee' }
};

let jointRoomList = {
    'qc': ['q1', 'q2']
};

let durationOptions = {
    1: '30 mins',
    2: '1 hour',
    3: '1.5 hours',
    4: '2 hours',
    5: '2.5 hours',
    6: '3 hours',
    7: '3.5 hours',
    8: '4 hours'
};

let bookingQueue = [];

function getRoomNameFromId(id) {
    for (let index in RoomList) {
        if (RoomList[index].id == id) {
            return RoomList[index].name;
        }
    }
}

export function setupTimeArray(datetimeStr) {
    let earliestSlotToday = new Date(datetimeStr).setTime(8, 0, 0, 0);
    let startTime = new Date(datetimeStr);
    if (!startTime.isDateToday() || startTime < earliestSlotToday) {
        startTime = earliestSlotToday;
    }
    let endTime = new Date(datetimeStr).setTime(21, 0, 0, 0);
    let timeStart = startTime.roundupToNearestHalfHour();

    let numOfSlots = Math.round(startTime.getMinuteDiff(endTime) / 30);
    let timeslotDict = {};
    for (let i = 0; i < numOfSlots; i++) {
        let startTime = timeStart.getFormattedTime();
        timeslotDict[getTimeslotName(timeStart)] = startTime;
    }
    return timeslotDict;
};

function getTimeslotName(startTime) {
    let timeslot = startTime.getFormattedTime();
    startTime = startTime.addMinutes(30);
    return timeslot;
}

function countSlotsWithinTimeframe(startTime, endTime) {
    let timeDiff = endTime.getTime() - startTime.getTime();
    return Math.round(timeDiff / (30 * 60 * 1000));
}

export function getDurationOptionNameWithId(option_id) {
    return durationOptions[option_id];
};

export function getColourForRoom(roomname) {
    return colourDict[roomname];
};

export function listBookedEventsByUser(startDateTime, user) {
    let promiseList = [];
    let bookedEventsArray = [];
    let endDateTime = startDateTime;
    startDateTime = startDateTime.getISO8601TimeStamp();
    endDateTime = endDateTime.addDays(365).getISO8601TimeStamp();

    for (let room in calendarIdList) {
        let calendarId = calendarIdList[room];

        promiseList.push(cal.listEvents(calendarId, startDateTime, endDateTime, user)
            .then(json => {
                let eventsInCalendar = [];
                for (let i = 0; i < json.length; i++) {
                    let event = {
                        id: json[i].id,
                        summary: json[i].summary,
                        location: json[i].location,
                        start: json[i].start,
                        end: json[i].end,
                        status: json[i].status,
                        description: json[i].description,
                        room: room
                    };
                    eventsInCalendar.push(event);
                    bookedEventsArray.push(event);
                }
                return eventsInCalendar;
            }).catch(err => {
                throw err;
            })
        );
    }

    return Promise.all(promiseList).then(
        (eventsRoom1, eventsRoom2, eventsRoom3, eventsRoom4, eventsRoom5) => {
            //modify event summaries + combine queensC events

            for (let key in bookedEventsArray) {
                let evnt = bookedEventsArray[key];
                let bookingDescription = evnt.summary.slice(evnt.summary.indexOf("]") + 2);
                let bookedRoomName = evnt.summary.slice(1, evnt.summary.indexOf("]"));
                evnt.summary = bookingDescription;

                if (bookedRoomName == RoomList.queenC.name) {
                    if (evnt.location == RoomList.queen1.name) {
                        evnt.location = RoomList.queenC.name;
                        evnt.room = RoomList.queenC.id;
                    } else {
                        delete bookedEventsArray[key];
                    }
                }
            }
            return bookedEventsArray;
        });
};

export function listBookedEventsByRoom(startDateTime, endDateTime, query) {
    let bookedEventsArray = [];
    let calendarId = calendarIdList[query];

    return cal.listEvents(calendarId, startDateTime, endDateTime)
        .then(json => {
            for (let i = 0; i < json.length; i++) {
                let event = {
                    id: json[i].id,
                    summary: json[i].summary,
                    start: json[i].start,
                    end: json[i].end,
                    status: json[i].status
                };
                bookedEventsArray.push(event);
            }
            return bookedEventsArray;

        }).catch(err => {
            console.log(err);
            throw err;
        });
};

export function handleListingForTwoCalendars(date, endDate, roomId) {
    return Promise.join(
        listBookedEventsByRoom(date, endDate, RoomList.queen1.id)
            .then(jsonArr => {
                return jsonArr;
            }),

        listBookedEventsByRoom(date, endDate, RoomList.queen2.id)
            .then(jsonArr => {
                return jsonArr;
            }),

        (timeslotQueen1, timeslotQueen2) => {
            return timeslotQueen1.concat(timeslotQueen2);
        }
    ).catch(err => {
        throw new Error("handleListingForTwoCalendars error: " + err);
    });
};

function filterBusyTimeslots(timeslotDict, roomBusyTimeslot) {
    for (let key in roomBusyTimeslot) {
        let startTime = new Date(roomBusyTimeslot[key].start.dateTime);
        let endTime = new Date(roomBusyTimeslot[key].end.dateTime);

        let count = countSlotsWithinTimeframe(startTime, endTime);
        for (let x = 0; x < count; x++) {
            delete timeslotDict[getTimeslotName(startTime)];
        }
    }
    return timeslotDict;
}

//assumes booking for max length of a day
export function listEmptySlotsInDay(date, roomId) {
    let endDate = new Date(date).addDays(1).getISO8601TimeStamp();
    date = new Date(date).getISO8601TimeStamp();
    console.log('listEmptySlotsInDay: ' + getRoomNameFromId(roomId) + ' ' + date + ' - ' + endDate);

    if (roomId == RoomList.queenC.id) {
        return handleListingForTwoCalendars(date, endDate, roomId)
            .then(timeslotObj => {
                let timeArr = setupTimeArray(date);
                filterBusyTimeslots(timeArr, timeslotObj);
                return timeArr;
            })
            .catch(err => {
                throw new Error("listEmptySlotsInDay error: " + err);
            });

    } else {
        let calendarId = calendarIdList[roomId];
        return listBookedEventsByRoom(date, endDate, roomId)
            .then(jsonArr => {
                let timeArr = setupTimeArray(date);
                filterBusyTimeslots(timeArr, jsonArr);
                return timeArr;
            })
            .catch(err => {
                throw new Error("listEmptySlotsInDay error: " + err);
            });
    }
};

export function listAvailableDurationForStartTime(startDatetimeStr, roomId) {
    const listAvailableTime = 21; //Check available time up to 9 pm
    let startTimestamp = new Date(startDatetimeStr).getISO8601TimeStamp();
    let endTimestamp = new Date(startDatetimeStr).getISO8601DateWithDefinedTime(listAvailableTime, 0, 0, 0);
    let calendarId = calendarIdList[roomId];

    if (roomId == RoomList.queenC.id) {
        return handleListingForTwoCalendars(startTimestamp, endTimestamp, roomId)
            .then(timeslotObj => {

                return filterDurationSlots(timeslotObj, startTimestamp);
            })
            .catch(err => {
                throw new Error("listAvailableDurationForStartTime: " + err);
            });
    } else {
        return listBookedEventsByRoom(startTimestamp, endTimestamp, roomId)
            .then(jsonArr => {

                return filterDurationSlots(jsonArr, startTimestamp);
            })
            .catch(err => {
                throw new Error("listAvailableDurationForStartTime: " + err);
            });
    }
};

function filterDurationSlots(roomBusyTimeslot, startDatetimeStr) {
    console.log('filterDurationSlots');

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

    if (roomBusyTimeslot.length == 0) {
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
        room2Details.location, room2Details.status, room2Details.description, username)
        .then(resultsRoom2 => {

            room1Details.description += '@' + resultsRoom2.id;
            return insertEvent(room1Details.bookingSummary, room1Details.startDateTime, room1Details.endDateTime,
                room1Details.location, room1Details.status, room1Details.description, username)
                .then(resultsRoom1 => {
                    let results = {
                        'summary': resultsRoom1.summary,
                        'location': resultsRoom1.location + '&' + resultsRoom2.location,
                        'status': resultsRoom1.status,
                        'htmlLink': CONFIG.calendarUrl,
                        'start': new Date(resultsRoom1.start),
                        'end': new Date(resultsRoom1.end),
                        'created': new Date(resultsRoom1.created).getISO8601TimeStamp()
                    };
                    return results;
                });
        }).catch(err => {
            throw new Error("insertEventForCombinedRoom: " + err);
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
    return new Promise(function (fulfill, reject) {
        EE.once('booked' + username + bookTime, function (resp) {
            if (resp.success) {
                fulfill(resp.results);
            } else {
                reject();
            }
        }, {});

        waitForTurnToBook(username, bookTime);
    });
}

export function insertEvent(bookingSummary, startDateTimeStr, endDateTimeStr, location, status, description, username) {
    console.log('insert: ' + location);

    if (location === RoomList.queenC.id) {
        let eventRoom1 = {
            'bookingSummary': bookingSummary,
            'startDateTime': startDateTimeStr,
            'endDateTime': endDateTimeStr,
            'location': RoomList.queen1.id,
            'status': status,
            'description': description
        };
        let eventRoom2 = {
            'bookingSummary': bookingSummary,
            'startDateTime': startDateTimeStr,
            'endDateTime': endDateTimeStr,
            'location': RoomList.queen2.id,
            'status': status,
            'description': description
        };
        return insertEventForCombinedRoom(eventRoom1, eventRoom2, username)
            .catch(err => {
                throw new Error("insertEvent: " + err);
            });

    } else {

        let calendarId = calendarIdList[location];
        let room = getRoomNameFromId(location);
        return cal.insertEvent(calendarId, bookingSummary, startDateTimeStr, endDateTimeStr, room, status, description, getColourForRoom(location))
            .then(resp => {
                let json = resp.body;
                let results = {
                    'id': json.id,
                    'summary': json.summary,
                    'location': json.location,
                    'status': json.status,
                    'htmlLink': CONFIG.calendarUrl,
                    'start': json.start.dateTime,
                    'end': json.end.dateTime,
                    'created': new Date(json.created).getISO8601TimeStamp()
                };

                return results;
            })
            .catch(err => {
                throw new Error("insertEvent: " +
                    console.log(err));
            });
    }
};

function waitForTurnToBook(username, bookTime) {
    if (checkBookingTurn(username, bookTime)) {
        let booking = bookingQueue[0];
        handleBookingProcess(booking);
    } else {
        setTimeout(function () {
            waitForTurnToBook(username, bookTime);
        }, 3000);
    }
}

function checkBookingTurn(username, bookTime) {
    let firstItemInQueue = bookingQueue[0];
    console.log('checking turn: ' + firstItemInQueue.username + ' == ' + username);
    if (firstItemInQueue.username == username && firstItemInQueue.bookTime == bookTime) {
        //current booking's turn
        console.log('turn for ' + username + ' to insert');
        return true;
    } else {
        //not current booking's turn yet
        return false;
    };
}

function handleBookingProcess(booking) {
    checkTimeslotFree(booking.startDateTime, booking.endDateTime, booking.location)
        .then(isSlotFree => {
            if (isSlotFree) {

                insertEvent(booking.bookingSummary, booking.startDateTime, booking.endDateTime,
                    booking.location, booking.status, booking.description, booking.username)
                    .then(results => {

                        bookingQueue.shift();
                        EE.emit('booked' + booking.username + booking.bookTime, { success: true, results: results });
                    });

            } else {

                bookingQueue.shift();
                EE.emit('booked' + booking.username + booking.bookTime, { success: false });
            }
        });
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
                .then(json => {
                    if (json != undefined && json.length > 0) {
                        statusList.push(false);
                        return false;
                    } else {
                        statusList.push(true);
                        return true;
                    }
                }).catch(err => {
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

    if (room == RoomList.queenC.id) {
        return checkJointRoomFree(startDateTimeStr, endDateTimeStr, room);
    } else {
        let calendarId = calendarIdList[room];
        return cal.checkBusyPeriod(calendarId, startDateTimeStr, endDateTimeStr)
            .then(function (eventsJson) {
                if (eventsJson != undefined && eventsJson.length > 0) {
                    return false;
                } else {
                    return true;
                }
            }).catch(err => {
                throw new Error("checkTimeslotFree: " + err);
            });
    }
};

export function deleteEvents(eventIdArray, roomId) {
    let calendarIdListToDelete = [];
    let eventList = [];
    if (RoomList.queenC.id === roomId) {
        for (let index in RoomList.queenC.children) {
            let childRoom = RoomList.queenC.children[index];
            calendarIdListToDelete.push(calendarIdList[childRoom]);
        }
    } else {
        calendarIdListToDelete.push(calendarIdList[roomId]);
    }
    for (let index in calendarIdListToDelete) {
        let calendarId = calendarIdListToDelete[index];
        eventList.push(cal.deleteEvent(calendarId, eventIdArray[index])
        );
    }
    return Promise.all(eventList).catch(err => {
        console.log('Error deleting Event' + err);
        throw new Error("deleteEvent: " + err);
    });
}
