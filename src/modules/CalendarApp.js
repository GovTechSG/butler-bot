//cal-app.js - booking app specific calendar logic

const CALENDAR_URL = require('../config/settings').calendarUrl;
var cal = require('./CalendarAPI');
require('./Date');

var colourDict = { "fgd": 1, "drone": 2, "queen-1": 3, "queen-2": 4, "queen-c": 5 };
var timeslotDict = {};
var durationOptions = {
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
    var timeStart = new Date("2016-05-24T08:00:00+08:00");
    for (var i = 0; i < numOfSlots; i++) {
        var startTime = timeStart.getFormatedTime();
        timeslotDict[getTimeslotName(timeStart)] = startTime;
    }
}

function getTimeslotName(startTime) {
    var timeslot = startTime.getFormatedTime();
    startTime = startTime.addMinutes(30);
    return timeslot;
}

function countSlotsWithinTimeframe(startTime, endTime) {
    var timeDiff = endTime.getTime() - startTime.getTime();
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
    var response = [];
    return new Promise(function(fulfill, reject) {
        cal.listEvents(startDateTime, endDateTime, query).then(function(json) {
            for (i = 0; i < json.length; i++) {
                var event = {
                    id: json[i].id,
                    summary: json[i].summary,
                    location: json[i].location,
                    start: json[i].start,
                    end: json[i].end,
                    status: json[i].status
                };
                response.push(event);
            }
            fulfill(response);
        }, function(json) {
            reject("listBookedEvent error : " + json);
        });
    });
};

//assumes booking for max length of a day
exports.listEmptySlotsInDay = function (date, query) {
    setupTimeArray();
    var endDate = new Date(date).addDays(1).getISO8601TimeStamp();
    date = new Date(date).getISO8601TimeStamp();

    return new Promise(function(fulfill, reject) {
        this.listBookedEvent(date, endDate, query).then(function(jsonArr) {

            for (event in jsonArr) {
                var startTime = new Date(jsonArr[event].start.dateTime);
                var endTime = new Date(jsonArr[event].end.dateTime);
                var count = countSlotsWithinTimeframe(startTime, endTime);
                for (var x = 0; x < count; x++) {
                    delete timeslotDict[getTimeslotName(startTime)];
                }
            }
            fulfill(timeslotDict);
        }, function(err) {
            reject("listEmptySlotsInDay error : " + err);
        });
    }.bind(this));
};

exports.listAvailableDurationForStartTime = function (startDatetime, query) {

    const maxDurationBlocksAllowed = 8;
    var endDate = new Date(startDatetime).getISO8601DateWithDefinedTime(21,0,0,0);
    var startTimestamp = new Date(startDatetime).getISO8601TimeStamp();


    return new Promise(function(fulfill, reject) {

        console.log('listAvailableDurationForStartTime: ' + query);
        this.listBookedEvent(startTimestamp, endDate, query).then(function(jsonArr) {
            console.log(jsonArr);
            var durOptions = durationOptions;
            var closestEventBlocksAway = 99;
            for (event in jsonArr) {
                var setOf30minsBlocks = new Date(startDatetime).getMinuteDiff(new Date(jsonArr[event].start.dateTime)) / 30;
                if (setOf30minsBlocks < closestEventBlocksAway) {
                    closestEventBlocksAway = setOf30minsBlocks;
                }
            }
            console.log('closestEventBlocksAway = ' + closestEventBlocksAway);
            if (closestEventBlocksAway > maxDurationBlocksAllowed) {
                closestEventBlocksAway = maxDurationBlocksAllowed;
            }
            for (var x = maxDurationBlocksAllowed; x > closestEventBlocksAway; x--) {
                delete durOptions[x];
            }
            console.log(durOptions);
            fulfill(durOptions);
        }, function(err) {
            reject("listAvailableDurationForStartTime error : " + err);
        });

    }.bind(this));
};

exports.insertEvent = function(bookingSummary, startDateTime, endDateTime, location, status, description) {
    return new Promise(function(fulfill, reject) {
        cal.insertEvent(bookingSummary, startDateTime, endDateTime,
            location, status, description, this.getColourForRoom(location)).then(function(json)  {
            var resp = {};
            resp['summary'] = json.summary;
            resp['location'] = json.location;
            resp['status'] = json.status;
            resp['htmlLink'] = CALENDAR_URL;
            resp['start'] = json.start.dateTime;
            resp['end'] = json.end.dateTime;
            resp['created'] = new Date(json.created).getISO8601TimeStamp();
            fulfill(resp);
        }, function(json) {
            reject("insertEvent error : " + json);
        });
    }.bind(this));
};

exports.deleteEvent = function(eventId){
    return cal.deleteEvent(eventId);
};