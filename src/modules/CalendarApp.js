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
  queen1: 'q1',
  queen2: 'q2',
  queenC: 'qc',
  drone: 'dr',
  fgd: 'fg'
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

function setupTimeArray() {
  let timeslotDict = {};
  //setup array in 30min slots from 8am-9pm
  const numOfSlots = 26;
  let timeStart = new Date("2016-05-24T08:00:00+08:00");
  for (let i = 0; i < numOfSlots; i++) {
    let startTime = timeStart.getFormattedTime();
    timeslotDict[getTimeslotName(timeStart)] = startTime;
  }
  return timeslotDict;
}

function getTimeslotName(startTime) {
  let timeslot = startTime.getFormattedTime();
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

exports.listBookedEventsByUser = function(startDateTime, endDateTime, user, room) {
  let bookedEventsArray = [];
  let calendarId = calendarIdList[room];
  return cal.listEvents(calendarId, startDateTime, endDateTime, user)
    .then(json => {
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

exports.listBookedEventsByRoom = function(startDateTime, endDateTime, query) {
  let bookedEventsArray = [];
  let calendarId = calendarIdList[query];
  return cal.listEvents(calendarId, startDateTime, endDateTime, query)
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

exports.handleListingForTwoCalendars = function(date, endDate, room) {

  return Promise.join(
    this.listBookedEventsByRoom(date, endDate, RoomList.queen1)
    .then(jsonArr => {
      console.log('q1: ' + date + ' ' + endDate);
      console.log(jsonArr);
      return jsonArr;
    }),

    this.listBookedEventsByRoom(date, endDate, RoomList.queen2)
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

}

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
exports.listEmptySlotsInDay = function(date, room) {
  let endDate = new Date(date).addDays(1).getISO8601TimeStamp();
  date = new Date(date).getISO8601TimeStamp();

  console.log('listEmptySlotsInDay: ' + room);

  if (room == RoomList.queenC) {
    return this.handleListingForTwoCalendars(date, endDate, room)
      .then(timeslotObj => {

        let timeArr = setupTimeArray();
        filterBusyTimeslots(timeArr, timeslotObj);
        console.log(timeArr);
        return timeArr;
      });

  } else {
    let calendarId = calendarIdList[room];

    return this.listBookedEventsByRoom(date, endDate, room)
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

exports.listAvailableDurationForStartTime = function(startDatetime, room) {

  let endDate = new Date(startDatetime).getISO8601DateWithDefinedTime(21, 0, 0, 0);
  let startTimestamp = new Date(startDatetime).getISO8601TimeStamp();
  let calendarId = calendarIdList[room];

  console.log('listAvailableDurationForStartTime: ' + room);
  if (room == RoomList.queenC) {
    return this.handleListingForTwoCalendars(startTimestamp, endDate, room)
      .then(timeslotObj => {
        return filterDurationSlots(timeslotObj, startTimestamp);
      });
  } else {
    return this.listBookedEventsByRoom(startTimestamp, endDate, room)
      .then(jsonArr => {

        return filterDurationSlots(jsonArr, startTimestamp);

      })
      .catch(err => {
        throw new Error("listAvailableDurationForStartTime: " + err);
      });
  }
};

function filterDurationSlots(roomBusyTimeslot, startDatetime) {
  console.log('filterDuration');
  console.log(roomBusyTimeslot);

  let maxDurationBlocksAllowed = 8;
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
  let closestEventBlocksAway = 99;

  if (roomBusyTimeslot.length == 0) {
    return durOptions;
  }

  for (event in roomBusyTimeslot) {
    let setOf30minsBlocks = new Date(startDatetime).getMinuteDiff(new Date(roomBusyTimeslot[event].start.dateTime)) / 30;
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

exports.insertEvent = function(bookingSummary, startDateTime, endDateTime, location, status, description) {
  console.log('insert: ' + location);
  if (location === RoomList.queenC) {
    //insert into both q1&q2
    let eventRoom1 = {
      'bookingSummary': bookingSummary,
      'startDateTime': startDateTime,
      'endDateTime': endDateTime,
      'location': RoomList.queen1,
      'status': status,
      'description': description
    };
    let eventRoom2 = {
      'bookingSummary': bookingSummary,
      'startDateTime': startDateTime,
      'endDateTime': endDateTime,
      'location': RoomList.queen2,
      'status': status,
      'description': description
    };
    return this.insertEventForCombinedRoom(eventRoom1, eventRoom2)
      .catch(err => {
        throw new Error("insertEvent: " + err);
      });
  } else {
    let calendarId = calendarIdList[location];
    console.log('before insert: ' + calendarId);

    return cal.insertEvent(calendarId, bookingSummary, startDateTime, endDateTime, location, status, description, this.getColourForRoom(location))
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