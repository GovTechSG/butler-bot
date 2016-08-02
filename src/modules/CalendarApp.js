//cal-app.js - booking app specific calendar logic
const CONFIG = require('../config/settings');
const CALENDAR_URL = require('../config/settings').calendarUrl;
const CalendarAPI = require('./CalendarAPI');
let cal = new CalendarAPI(CONFIG);
require('./Date');

let colourDict = { "fgd": 1, "drone": 2, "queen-1": 3, "queen-2": 4, "queen-c": 5 };
let timeslotDict = {};
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
  //setup array in 30min slots from 8am-9pm
  const numOfSlots = 26;
  let timeStart = new Date("2016-05-24T08:00:00+08:00");
  for (let i = 0; i < numOfSlots; i++) {
    let startTime = timeStart.getFormatedTime();
    timeslotDict[getTimeslotName(timeStart)] = startTime;
  }
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

exports.getDurationOptionNameWithId = function(option_id){
  return durationOptions[option_id];
};

exports.getColourForRoom = function (roomname) {
  return colourDict[roomname];
};

exports.listBookedEvent = function(startDateTime, endDateTime, query) {
  console.log('cal-app:listBookedEvent');
  let bookedEventsArray = [];

  return cal.listEvents(startDateTime, endDateTime, query)
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

//assumes booking for max length of a day
exports.listEmptySlotsInDay = function(date, query) {
    setupTimeArray();
    let endDate = new Date(date).addDays(1).getISO8601TimeStamp();
    date = new Date(date).getISO8601TimeStamp();

    return this.listBookedEvent(date, endDate, query)
      .then(jsonArr => {
        for (event in jsonArr) {
          let startTime = new Date(jsonArr[event].start.dateTime);
          let endTime = new Date(jsonArr[event].end.dateTime);
          let count = countSlotsWithinTimeframe(startTime, endTime);
          for (let x = 0; x < count; x++) {
            delete timeslotDict[getTimeslotName(startTime)];
          }
        }
        return timeslotDict;
      })
      .catch(err => {
        throw new Error("listEmptySlotsInDay error: " + err);
      });
};

exports.listAvailableDurationForStartTime = function(startDatetime, query) {

    const maxDurationBlocksAllowed = 8;
    let endDate = new Date(startDatetime).getISO8601DateWithDefinedTime(21, 0, 0, 0);
    let startTimestamp = new Date(startDatetime).getISO8601TimeStamp();

    console.log('listAvailableDurationForStartTime: ' + query);
    return this.listBookedEvent(startTimestamp, endDate, query)
      .then(jsonArr => {
        console.log(jsonArr);
        let durOptions = durationOptions;
        let closestEventBlocksAway = 99;

        for (event in jsonArr) {
          let setOf30minsBlocks = new Date(startDatetime).getMinuteDiff(new Date(jsonArr[event].start.dateTime)) / 30;
          if (setOf30minsBlocks < closestEventBlocksAway) {
            closestEventBlocksAway = setOf30minsBlocks;
          }
        }

        console.log('closestEventBlocksAway = ' + closestEventBlocksAway);
        if (closestEventBlocksAway > maxDurationBlocksAllowed) {
          closestEventBlocksAway = maxDurationBlocksAllowed;
        }

        for (let x = maxDurationBlocksAllowed; x > closestEventBlocksAway; x--) {
          delete durOptions[x];
        }
        console.log(durOptions);
        return durOptions;

      })
      .catch(err => {
        throw new Error("listAvailableDurationForStartTime: " + err);
      });
};

exports.insertEvent = function(bookingSummary, startDateTime, endDateTime, location, status, description) {

    return cal.insertEvent(bookingSummary, startDateTime, endDateTime, location, status, description, this.getColourForRoom(location))
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
};

exports.deleteEvent = function(eventId) {
    return cal.deleteEvent(eventId);
};