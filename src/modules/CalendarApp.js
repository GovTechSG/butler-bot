//cal-app.js - booking app specific calendar logic
const CALENDAR_URL = require('../config/settings').calendarUrl;
const CONFIG = require('../config/settings');
const CalendarAPI = require('./CalendarAPI');
let cal = new CalendarAPI(CONFIG);
let calendarIdList = CONFIG.calendarId;
require('./Date');
const Promise = require('bluebird');

let colourDict = { "fg": 1, "dr": 2, "q1": 3, "q2": 4, "qc": 5 };
let RoomList = {
  queen1: { id: 'q1', name: 'Queen 1' },
  queen2: { id: 'q2', name: 'Queen 2' },
  queenC: { id: 'qc', name: 'Queen (Combined)' },
  drone: { id: 'dr', name: 'Drone' },
  fgd: { id: 'fg', name: 'Focus Group Discussion Room' }
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

function getRoomNameFromId(id) {
  for (let index in RoomList) {
    if (RoomList[index].id == id) {
      return RoomList[index].name;
    }
  }
}

function setupTimeArray() {
  let timeslotDict = {};
  //setup array in 30min slots from 8am-9pm
  const numOfSlots = 26;
  let timeStart = new Date("2016-05-24T08:00:00+08:00");
  for (let i = 0; i < numOfSlots; i++) {
    let startTime = timeStart.getFormatedTime();
    timeslotDict[getTimeslotName(timeStart)] = startTime;
  }
  return timeslotDict;
}

function getTimeslotName(startTime) {
  let timeslot = startTime.getFormatedTime();
  startTime = startTime.addMinutes(30);
  return timeslot;
}

function countSlotsWithinTimeframe(startTime, endTime) {
  let timeDiff = endTime.getTime() - startTime.getTime();
  return Math.round(timeDiff / (30 * 60 * 1000));
}

exports.getDurationOptionNameWithId = function(option_id) {
  return durationOptions[option_id];
};

exports.getColourForRoom = function(roomname) {
  return colourDict[roomname];
};

exports.listBookedEventsByUser = function(startDateTime, user) {
  let promiseList = [];
  let bookedEventsArray = [];
  let endDateTime = startDateTime;
  startDateTime = startDateTime.getISO8601TimeStamp();
  endDateTime = endDateTime.addDays(365).getISO8601TimeStamp();

  for (let room in calendarIdList) {
    let calendarId = calendarIdList[room];
    console.log(calendarId + ' ' + startDateTime + ' ' + endDateTime + ' ');

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
            status: json[i].status
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

          if (evnt.location == RoomList.queen1.id) {
            evnt.location = RoomList.queenC.name;
          } else {
            delete bookedEventsArray[key];
          }
        }
      }
      return bookedEventsArray;
    });
};

exports.listBookedEventsByRoom = function(startDateTime, endDateTime, query) {
  console.log('listBookedEventsByRoom: ' + query);
  let bookedEventsArray = [];
  let calendarId = calendarIdList[query];
  let roomName = getRoomNameFromId(query);

  return cal.listEvents(calendarId, startDateTime, endDateTime, roomName)
    .then(json => {
      // console.log('listevent: ' + calendarId + ' ' + startDateTime + ' ' + endDateTime + ' ' + query);

      for (let i = 0; i < json.length; i++) {
        let event = {
          id: json[i].id,
          summary: json[i].summary,
          location: json[i].location,
          start: json[i].start,
          end: json[i].end,
          status: json[i].status
        };
        bookedEventsArray.push(event);
      };
      return bookedEventsArray;

    }).catch(err => {
      throw err;
    });
};

exports.handleListingForTwoCalendars = function(date, endDate, roomId) {

  return Promise.join(
    this.listBookedEventsByRoom(date, endDate, RoomList.queen1.id)
    .then(jsonArr => {
      console.log('q1: ' + date + ' ' + endDate);
      console.log(jsonArr);
      return jsonArr;
    }),

    this.listBookedEventsByRoom(date, endDate, RoomList.queen2.id)
    .then(jsonArr => {
      console.log('q2: ' + date + ' ' + endDate);
      console.log(jsonArr);
      return jsonArr;
    }),

    (timeslotQueen1, timeslotQueen2) => {
      console.log('----------------');
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
    console.log('busy: ' + count + ' slots @ ' + startTime);
    for (let x = 0; x < count; x++) {
      delete timeslotDict[getTimeslotName(startTime)];
    }
  }
  return timeslotDict;
}

//assumes booking for max length of a day
exports.listEmptySlotsInDay = function(date, roomId) {
  let endDate = new Date(date).addDays(1).getISO8601TimeStamp();
  date = new Date(date).getISO8601TimeStamp();

  console.log('listEmptySlotsInDay: ' + getRoomNameFromId(roomId));

  if (roomId == RoomList.queenC.id) {

    console.log('searching qc: ');
    return this.handleListingForTwoCalendars(date, endDate, roomId)
      .then(timeslotObj => {

        let timeArr = setupTimeArray();
        filterBusyTimeslots(timeArr, timeslotObj);
        console.log(timeArr);
        return timeArr;
      })
      .catch(err => {
        throw new Error("listEmptySlotsInDay error: " + err);
      });

  } else {
    let calendarId = calendarIdList[roomId];
    return this.listBookedEventsByRoom(date, endDate, roomId)
      .then(jsonArr => {

        let timeArr = setupTimeArray();
        filterBusyTimeslots(timeArr, jsonArr);
        return timeArr;
      })
      .catch(err => {
        throw new Error("listEmptySlotsInDay error: " + err);
      });
  }
};

exports.listAvailableDurationForStartTime = function(startDatetimeStr, roomId) {
  const listAvailableTime = 21; //Check available time up to 9 pm
  let startTimestamp = new Date(startDatetimeStr).getISO8601TimeStamp();
  let endTimestamp = new Date(startDatetimeStr).getISO8601DateWithDefinedTime(listAvailableTime, 0, 0, 0);
  let calendarId = calendarIdList[roomId];

  if (roomId == RoomList.queenC.id) {
    return this.handleListingForTwoCalendars(startTimestamp, endTimestamp, roomId)
      .then(timeslotObj => {

        return filterDurationSlots(timeslotObj, startTimestamp);
      })
      .catch(err => {
        throw new Error("listAvailableDurationForStartTime: " + err);
      });
  } else {
    return this.listBookedEventsByRoom(startTimestamp, endTimestamp, roomId)
      .then(jsonArr => {

        return filterDurationSlots(jsonArr, startTimestamp);
      })
      .catch(err => {
        throw new Error("listAvailableDurationForStartTime: " + err);
      });
  }
};

function filterDurationSlots(roomBusyTimeslot, startDatetimeStr) {
  console.log('filterDuration');
  console.log(roomBusyTimeslot);

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

  for (event in roomBusyTimeslot) {
    let setOf30minsBlocks = new Date(startDatetimeStr).getMinuteDiff(new Date(roomBusyTimeslot[event].start.dateTime)) / 30;
    if (setOf30minsBlocks < closestEventBlocksAway) {
      closestEventBlocksAway = setOf30minsBlocks;
    }
  }

  console.log('closestEventBlocksAway = ' + closestEventBlocksAway);
  if (closestEventBlocksAway > maxDurationBlocksAllowed) {
    closestEventBlocksAway = maxDurationBlocksAllowed;
  }

  for (let x = maxDurationBlocksAllowed; x > closestEventBlocksAway; x--) {
    if (durOptions[x] !== undefined) {
      delete durOptions[x];
    }
  }
  console.log(durOptions);
  return durOptions;
}

exports.insertEventForCombinedRoom = function(room1Details, room2Details) {
  return Promise.join(
      this.insertEvent(room1Details.bookingSummary, room1Details.startDateTime, room1Details.endDateTime,
        room1Details.location, room1Details.status, room1Details.description)
      .then(results => {
        return results;
      }),
      this.insertEvent(room2Details.bookingSummary, room2Details.startDateTime, room2Details.endDateTime,
        room2Details.location, room2Details.status, room2Details.description)
      .then(results => {
        return results;
      }),
      (resultsRoom1, resultsRoom2) => {
        let results = {
          'summary': resultsRoom1.summary,
          'location': resultsRoom1.location + '&' + resultsRoom2.location,
          'status': resultsRoom1.status,
          'htmlLink': CALENDAR_URL,
          'start': new Date(resultsRoom1.start),
          'end': new Date(resultsRoom1.end),
          'created': new Date(resultsRoom1.created).getISO8601TimeStamp()
        };
        return results;
      })
    .catch(err => {
      throw new Error("insertEventForCombinedRoom: " + err);
    });
}

exports.insertEvent = function(bookingSummary, startDateTimeStr, endDateTimeStr, location, status, description) {
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
    return this.insertEventForCombinedRoom(eventRoom1, eventRoom2)
      .catch(err => {
        throw new Error("insertEvent: " + err);
      });

  } else {

    let calendarId = calendarIdList[location];
    let room = getRoomNameFromId(location);
    return cal.insertEvent(calendarId, bookingSummary, startDateTimeStr, endDateTimeStr, room, status, description, this.getColourForRoom(location))
      .then(resp => {

        let json = resp.body;
        let results = {
          'summary': json.summary,
          'location': json.location,
          'status': json.status,
          'htmlLink': CALENDAR_URL,
          'start': json.start.dateTime,
          'end': json.end.dateTime,
          'created': new Date(json.created).getISO8601TimeStamp()
        };

        return results;
      })
      .catch(err => {
        throw new Error("insertEvent: " + err);
      });
  }
};

exports.deleteEvent = function(eventId, room) {
  let calendarId = calendarIdList[room];
  return cal.deleteEvent(calendarId, eventId);
};