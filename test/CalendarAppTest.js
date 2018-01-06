import { expect } from 'chai';
import sinon from 'sinon';

import CalendarAPI from 'node-google-calendar';
import * as CalendarApp from '../src/modules/CalendarApp';
import CONFIG, { ROOM_CONFIG } from '../src/config/settings';

describe('CalendarApp', () => {
	let mockEvent = {
		kind: 'calendar#event',
		etag: '\"0000000000000000\"',
		id: '12345',
		status: 'confirmed',
		htmlLink: 'https://www.google.com/calendar/event?eid=12345',
		created: '2017-01-01T00:00:00.000Z',
		updated: '2017-01-01T00:00:00.722Z',
		description: 'booked via butler',
		summary: 'event summary',
		location: '',
		colorId: '1',
		creator: { email: '..@gmail.com' },
		organizer: { email: '..@gmail.com', displayName: 'Roomname', self: true },
		start: { dateTime: '2017-07-01T00:30:00+08:00' },
		end: { dateTime: '2017-07-01T01:00:00+08:00' },
		iCalUID: '12345@google.com',
		sequence: 0,
		reminders: { useDefault: true }
	};

	describe('checkWithinWeek', () => {
		it('should return correct days till upcoming occurrence from startdate given future-start events', () => {
			let today = new Date().setDateWithSimpleFormat('1/4/2017').setTime(6, 30, 0, 0);	// SA
			let eventStart = new Date(today).addDays(+2);	// SU
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(10, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(12, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '2',
				byday: 'MO,TU,TH,FR'
			};

			let recurrenceInWeek = testEvent.byday.split(',');
			let dayDiffInWeek = eventStart.getNumOfDaysDiffInWeekForDayNames();
			let result = CalendarApp.checkWithinWeek(eventStart, today, recurrenceInWeek, dayDiffInWeek);
			let expectedResult = 0;
			expect(result).to.eql(expectedResult);
		});
		it('should return correct days till upcoming occurrence from startdate given events across weeks', () => {
			let today = new Date().setDateWithSimpleFormat('1/4/2017').setTime(6, 30, 0, 0);	// SA
			let eventStart = new Date(today).addDays(-2);	// TH
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(10, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(12, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '2',
				byday: 'MO,TU,TH,FR'
			};

			let recurrenceInWeek = testEvent.byday.split(',');
			let dayDiffInWeek = eventStart.getNumOfDaysDiffInWeekForDayNames();
			let result = CalendarApp.checkWithinWeek(eventStart, today, recurrenceInWeek, dayDiffInWeek);
			let expectedResult = 4;
			expect(result).to.eql(expectedResult);
		});
		it('should return -1 given no events within the week can be found to start after today', () => {
			let today = new Date().setDateWithSimpleFormat('3/4/2017').setTime(6, 30, 0, 0);	// TU
			let eventStart = new Date(today).addDays(-7);	// TH
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(10, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(12, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '2',
				byday: 'MO,TU,TH,FR'
			};

			let recurrenceInWeek = testEvent.byday.split(',');
			let dayDiffInWeek = eventStart.getNumOfDaysDiffInWeekForDayNames();
			let result = CalendarApp.checkWithinWeek(eventStart, today, recurrenceInWeek, dayDiffInWeek);
			let expectedResult = -1;
			expect(result).to.eql(expectedResult);
		});
	});

	describe('calculateUpcomingRecurrence', () => {
		// json[i].recurrence : [ 'RRULE:FREQ=WEEKLY;BYDAY=SA' ]
		// [ 'RRULE:FREQ=WEEKLY;COUNT=2;BYDAY=SA' ]
		// 'RRULE:FREQ=WEEKLY;UNTIL=20170506T020000Z;BYDAY=SA' ]
		// [ 'RRULE:FREQ=WEEKLY;UNTIL=20170506T020000Z;BYDAY=SU,MO,TU,WE,TH,FR,SA' ]
		// [ 'RRULE:FREQ=WEEKLY;UNTIL=20170429T020000Z;INTERVAL=2;BYDAY=SA' ]
		// RRULE:FREQ=WEEKLY;COUNT=2;INTERVAL=2;BYDAY=SA

		it('should return correct start/enddate for event recurring daily', () => {
			let today = new Date().setDateWithSimpleFormat('1/4/2017').setTime(16, 30, 0, 0);
			let eventStart = new Date(today).addDays(-1);
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'DAILY',
				count: '5'
			};
			let expectedResultStart = new Date(today).setTime(17, 0, 0, 0);
			let expectedResultEnd = new Date(today).setTime(18, 0, 0, 0);
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);
			expect(startDate).to.eql(expectedResultStart);
			expect(endDate).to.eql(expectedResultEnd);
		});
		it('should return correct start/enddate for event recurring every 3 days', () => {
			let today = new Date().setDateWithSimpleFormat('1/4/2017').setTime(17, 30, 0, 0);
			let eventStart = new Date(today).addDays(-1);
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'DAILY',
				interval: '3'
			};
			let expectedResultStart = new Date().setDateWithSimpleFormat('3/4/2017').setTime(17, 0, 0, 0);
			let expectedResultEnd = new Date(today).setDateWithSimpleFormat('3/4/2017').setTime(18, 0, 0, 0);
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);

			expect(startDate).to.eql(expectedResultStart);
			expect(endDate).to.eql(expectedResultEnd);
		});
		it('should return correct start/enddate for event recurring once every 2 weeks', () => {
			let today = new Date().setDateWithSimpleFormat('1/4/2017').setTime(17, 0, 0, 0);
			let eventStart = new Date(today).addDays(-14);
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '2',
				interval: '2',
				byday: 'SA'
			};
			let expectedResultStart = new Date(today).setTime(17, 0, 0, 0);
			let expectedResultEnd = new Date(today).setTime(18, 0, 0, 0);
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);
			expect(startDate).to.eql(expectedResultStart);
			expect(endDate).to.eql(expectedResultEnd);
		});
		it('should return correct start/enddate for event recurring 4 times every week', () => {
			let today = new Date().setDateWithSimpleFormat('3/4/2017').setTime(17, 20, 0, 0);	// MO
			let eventStart = new Date().setDateWithSimpleFormat('17/3/2017');					// FR
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '3',
				byday: 'MO,TU,TH,FR'
			};
			let expectedResultStart = new Date().setDateWithSimpleFormat('04/04/2017').setTime(17, 0, 0, 0);	// TU
			let expectedResultEnd = new Date().setDateWithSimpleFormat('04/04/2017').setTime(18, 0, 0, 0);
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);
			expect(startDate).to.eql(expectedResultStart);
			expect(endDate).to.eql(expectedResultEnd);
		});
		it('should return correct start/enddate for recurring event ending on until date', () => {
			let today = new Date().setDateWithSimpleFormat('1/4/2017').setTime(21, 20, 0, 0);	// SA
			let eventStart = new Date().setDateWithSimpleFormat('18/3/2017');					// SA
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				interval: '2',
				until: '20170415T090000Z',
				byday: 'SA'
			};
			let expectedResultStart = new Date().setDateWithSimpleFormat('15/04/2017').setTime(17, 0, 0, 0);	// SA
			let expectedResultEnd = new Date().setDateWithSimpleFormat('15/04/2017').setTime(18, 0, 0, 0);
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);
			expect(startDate).to.eql(expectedResultStart);
			expect(endDate).to.eql(expectedResultEnd);
		});
		it('should return {} as start/enddate for recurring events that exceeded recur count', () => {
			let today = new Date().setDateWithSimpleFormat('3/4/2017').setTime(17, 20, 0, 0);	// MO
			let eventStart = new Date().setDateWithSimpleFormat('17/3/2017');					// FR
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '2',
				byday: 'MO,TU,TH,FR'
			};
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);
			expect(startDate).to.eql(undefined);
			expect(endDate).to.eql(undefined);
		});
		it('should return {} as start/enddate for recurring events that exceeded until date', () => {
			let today = new Date().setDateWithSimpleFormat('3/4/2017').setTime(17, 20, 0, 0);	// MO
			let eventStart = new Date().setDateWithSimpleFormat('17/3/2017');					// FR
			let testEvent = {
				start: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(17, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: eventStart.getISO8601DateWithDefinedTime(18, 0, 0, 0),
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				until: '20170401T020000Z',
				byday: 'MO,TU,TH,FR'
			};
			let { startDate, endDate } = CalendarApp.calculateUpcomingRecurrence(testEvent, today);
			expect(startDate).to.eql(undefined);
			expect(endDate).to.eql(undefined);
		});
	});

	describe('parseRecurrenceEvent', () => {
		it('should return obj with correct recurrence details when called with event that repeats every 3 weeks twice', () => {
			let expectedResult = {
				start: {
					dateTime: '2017-03-18T17:00:00+08:00',
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: '2017-03-18T18:00:00+08:00',
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				count: '2',
				interval: '3',
				byday: 'SA'
			};
			let recurEventForTest = {
				start:
					{
						dateTime: '2017-03-18T17:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-03-18T18:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				recurrence: ['RRULE:FREQ=WEEKLY;COUNT=2;INTERVAL=3;BYDAY=SA']
			};
			let result = CalendarApp.parseRecurrenceEvent(recurEventForTest);
			expect(result).to.eql(expectedResult);
		});

		it('should return obj with correct recurrence details when called event that repeats multiple days per week', () => {
			let expectedResult = {
				start: {
					dateTime: '2017-03-18T17:00:00+08:00',
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: '2017-03-18T18:00:00+08:00',
					timeZone: 'Asia/Singapore'
				},
				freq: 'WEEKLY',
				byday: 'SU,MO,TU,WE,TH,FR,SA',
				until: '20170506T020000Z'
			};
			let recurEventForTest = {
				start:
					{
						dateTime: '2017-03-18T17:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-03-18T18:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				recurrence: ['RRULE:FREQ=WEEKLY;UNTIL=20170506T020000Z;BYDAY=SU,MO,TU,WE,TH,FR,SA']
			};
			let result = CalendarApp.parseRecurrenceEvent(recurEventForTest);
			expect(result).to.eql(expectedResult);
		});
	});

	describe('getRoomNameFromId', () => {
		beforeEach(() => {
			let CalAPI = new CalendarAPI(CONFIG);
			CalendarApp.init(CalAPI, CONFIG, ROOM_CONFIG.roomsListing);
		});
		it('should return correct roomnames for all room ids', () => {
			let roomNames = {
				'fg': 'Focus Group Room',
				'q1': 'Queen (Video)',
				'q2': 'Queen (Projector)',
				'qc': 'Queen (Combined)',
				'dr': 'Drone',
				'bb': 'Bumblebee'
			};
			for (let key in roomNames) {
				if (roomNames.hasOwnProperty(key)) {
					let expectedResult = roomNames[key];
					let result = CalendarApp.getRoomNameFromId(key);
					expect(result).to.eql(expectedResult);
				}
			}
		});
	});

	describe('setupTimeArray', () => {
		it('should return full 8am - 830pm list of timeslots when setupTimeArray called at 1200am', () => {
			let expectedResult = {
				'8:00 AM': '8:00 AM', '8:30 AM': '8:30 AM',
				'9:00 AM': '9:00 AM', '9:30 AM': '9:30 AM',
				'10:00 AM': '10:00 AM', '10:30 AM': '10:30 AM',
				'11:00 AM': '11:00 AM', '11:30 AM': '11:30 AM',
				'12:00 PM': '12:00 PM', '12:30 PM': '12:30 PM',
				'1:00 PM': '1:00 PM', '1:30 PM': '1:30 PM',
				'2:00 PM': '2:00 PM', '2:30 PM': '2:30 PM',
				'3:00 PM': '3:00 PM', '3:30 PM': '3:30 PM',
				'4:00 PM': '4:00 PM', '4:30 PM': '4:30 PM',
				'5:00 PM': '5:00 PM', '5:30 PM': '5:30 PM',
				'6:00 PM': '6:00 PM', '6:30 PM': '6:30 PM',
				'7:00 PM': '7:00 PM', '7:30 PM': '7:30 PM',
				'8:00 PM': '8:00 PM', '8:30 PM': '8:30 PM'
			};
			let result = CalendarApp.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return last slot of the day (830pm) when setupTimeArray called at 830pm', () => {
			let expectedResult = {
				'8:30 PM': '8:30 PM'
			};
			let result = CalendarApp.setupTimeArray(new Date().setTime(20, 30, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return {} when setupTimeArray called at 831pm', () => {
			let expectedResult = {};
			let result = CalendarApp.setupTimeArray(new Date().setTime(20, 31, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return {} when setupTimeArray called at 1159pm', () => {
			let expectedResult = {};
			let result = CalendarApp.setupTimeArray(new Date().setTime(23, 59, 0, 0));
			expect(result).to.eql(expectedResult);
		});
	});

	describe('filterBusyTimeslots', () => {
		it('should return correct timeslots & ignore error event when called with error event ', () => {
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start: {
					dateTime: '2017-04-06T17:00:00+08:00',
					timeZone: 'Asia/Singapore'
				},
				end: {
					dateTime: '2017-04-06T17:30:00+08:00',
					timeZone: 'Asia/Singapore'
				},
				status: 'confirmed'
			}, {
				id: '799u03hc0a9tkqhm5dfo5n4a00_20170412T060000Z',
				summary: undefined,
				location: undefined,
				start: undefined,
				end: undefined,
				status: 'cancelled'
			}];

			let expectedResult = {
				'8:00 AM': '8:00 AM', '8:30 AM': '8:30 AM',
				'9:00 AM': '9:00 AM', '9:30 AM': '9:30 AM',
				'10:00 AM': '10:00 AM', '10:30 AM': '10:30 AM',
				'11:00 AM': '11:00 AM', '11:30 AM': '11:30 AM',
				'12:00 PM': '12:00 PM', '12:30 PM': '12:30 PM',
				'1:00 PM': '1:00 PM', '1:30 PM': '1:30 PM',
				'2:00 PM': '2:00 PM', '2:30 PM': '2:30 PM',
				'3:00 PM': '3:00 PM', '3:30 PM': '3:30 PM',
				'4:00 PM': '4:00 PM', '4:30 PM': '4:30 PM',
				'5:30 PM': '5:30 PM',
				'6:00 PM': '6:00 PM', '6:30 PM': '6:30 PM',
				'7:00 PM': '7:00 PM', '7:30 PM': '7:30 PM',
				'8:00 PM': '8:00 PM', '8:30 PM': '8:30 PM'
			};
			let fullTimeSlot = CalendarApp.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			let result = CalendarApp.filterBusyTimeslots(fullTimeSlot, events);
			expect(result).to.eql(expectedResult);
		});

		it('should return all except 5pm slot timeslots when called with event from 5-530pm', () => {
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start:
					{
						dateTime: '2017-04-06T17:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-06T17:30:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			}];

			let expectedResult = {
				'8:00 AM': '8:00 AM', '8:30 AM': '8:30 AM',
				'9:00 AM': '9:00 AM', '9:30 AM': '9:30 AM',
				'10:00 AM': '10:00 AM', '10:30 AM': '10:30 AM',
				'11:00 AM': '11:00 AM', '11:30 AM': '11:30 AM',
				'12:00 PM': '12:00 PM', '12:30 PM': '12:30 PM',
				'1:00 PM': '1:00 PM', '1:30 PM': '1:30 PM',
				'2:00 PM': '2:00 PM', '2:30 PM': '2:30 PM',
				'3:00 PM': '3:00 PM', '3:30 PM': '3:30 PM',
				'4:00 PM': '4:00 PM', '4:30 PM': '4:30 PM',
				'5:30 PM': '5:30 PM',
				'6:00 PM': '6:00 PM', '6:30 PM': '6:30 PM',
				'7:00 PM': '7:00 PM', '7:30 PM': '7:30 PM',
				'8:00 PM': '8:00 PM', '8:30 PM': '8:30 PM'
			};
			let fullTimeSlot = CalendarApp.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			let result = CalendarApp.filterBusyTimeslots(fullTimeSlot, events);
			expect(result).to.eql(expectedResult);
		});

		it('should return all except 5 & 530pm timeslots when called with events from 5-530pm & 530-6pm', () => {
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start:
					{
						dateTime: '2017-04-06T17:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-06T17:30:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			},
			{
				id: '5smgnk4u2kvldkullhs29be48g',
				summary: 'Event',
				location: 'Focus Group Room ',
				start:
					{
						dateTime: '2017-04-05T17:30:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-05T18:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			}];

			let expectedResult = {
				'8:00 AM': '8:00 AM', '8:30 AM': '8:30 AM',
				'9:00 AM': '9:00 AM', '9:30 AM': '9:30 AM',
				'10:00 AM': '10:00 AM', '10:30 AM': '10:30 AM',
				'11:00 AM': '11:00 AM', '11:30 AM': '11:30 AM',
				'12:00 PM': '12:00 PM', '12:30 PM': '12:30 PM',
				'1:00 PM': '1:00 PM', '1:30 PM': '1:30 PM',
				'2:00 PM': '2:00 PM', '2:30 PM': '2:30 PM',
				'3:00 PM': '3:00 PM', '3:30 PM': '3:30 PM',
				'4:00 PM': '4:00 PM', '4:30 PM': '4:30 PM',
				'6:00 PM': '6:00 PM', '6:30 PM': '6:30 PM',
				'7:00 PM': '7:00 PM', '7:30 PM': '7:30 PM',
				'8:00 PM': '8:00 PM', '8:30 PM': '8:30 PM'
			};
			let fullTimeSlot = CalendarApp.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			let result = CalendarApp.filterBusyTimeslots(fullTimeSlot, events);
			expect(result).to.eql(expectedResult);
		});
	});

	describe('filterDurationSlots', () => {
		it('should return only 30min duration option given an upcoming event 30 mins away', () => {
			let expectedResult = { '1': '30 mins' };
			let testStartTime = new Date().setDateWithSimpleFormat('06/04/2017').setTime(9, 30, 0, 0)
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start:
					{
						dateTime: '2017-04-06T10:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-06T12:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			}];

			let result = CalendarApp.filterDurationSlots(events, testStartTime);
			expect(result).to.eql(expectedResult);
		});

		it('should return the maximum 4hr duration options given an upcoming event 5 hours away', () => {
			let expectedResult = {
				'1': '30 mins', '2': '1 hour',
				'3': '1.5 hours', '4': '2 hours',
				'5': '2.5 hours', '6': '3 hours',
				'7': '3.5 hours', '8': '4 hours'
			};
			let testStartTime = new Date().setDateWithSimpleFormat('06/04/2017').setTime(12, 0, 0, 0)
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start:
					{
						dateTime: '2017-04-06T17::00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-06T18:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			}];

			let result = CalendarApp.filterDurationSlots(events, testStartTime);
			expect(result).to.eql(expectedResult);
		});

		it('should return {} given an upcoming event 29 mins away', () => {
			let expectedResult = {};
			let testStartTime = new Date().setDateWithSimpleFormat('06/04/2017').setTime(9, 31, 0, 0)
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start:
					{
						dateTime: '2017-04-06T10:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-06T12:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			}];

			let result = CalendarApp.filterDurationSlots(events, testStartTime);
			expect(result).to.eql(expectedResult);
		});

		it('should ignore unexpected event given an erroneous event in roomBusyTimeslot list', () => {
			let expectedResult = { '1': '30 mins', '2': '1 hour' };
			let testStartTime = new Date().setDateWithSimpleFormat('06/04/2017').setTime(9, 0, 0, 0)
			let events = [{
				id: '7j1f3ngpff65k8v8ta67lumi1g',
				summary: 'event',
				location: 'Drone Room',
				start:
					{
						dateTime: '2017-04-06T10:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				end:
					{
						dateTime: '2017-04-06T12:00:00+08:00',
						timeZone: 'Asia/Singapore'
					},
				status: 'confirmed'
			}, {
				id: 'error-event',
				summary: 'error-event',
				location: 'Drone Room',
				start: undefined,
				end: undefined,
				status: 'cancelled'
			}];

			let result = CalendarApp.filterDurationSlots(events, testStartTime);
			expect(result).to.eql(expectedResult);
		});
	});

	describe('listBookedEventsByRoom', () => {
		it('should return array of booked events info for non-recurring single room events', () => {
			let testInput = {
				startDateTime: '2017-07-01T00:00:00+08:00',
				endDateTime: '2017-07-02T00:00:00+08:00',
				roomId: 'fg'
			};

			let expectedReturnedEvent = {
				id: mockEvent.id,
				summary: mockEvent.summary,
				status: mockEvent.status,
				location: mockEvent.location,
				start: { dateTime: mockEvent.start.dateTime },
				end: { dateTime: mockEvent.end.dateTime }
			};
			let expectedResult = [expectedReturnedEvent, expectedReturnedEvent];

			let mockResponse = [mockEvent, mockEvent];
			let mockCalendarAPI = {
				listEvents: sinon.stub().resolves(mockResponse)
			};
			CalendarApp.init(mockCalendarAPI, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listBookedEventsByRoom(testInput.startDateTime, testInput.endDateTime, testInput.roomId)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});

		it('should return array of booked events info for recurring single room events', () => {
			let testInput = {
				startDateTime: '2017-07-22T00:00:00+08:00',
				endDateTime: '2017-07-23T00:00:00+08:00',
				roomId: 'fg'
			};

			let mockRecurringEvent = {
				kind: mockEvent.kind,
				id: mockEvent.id,
				status: mockEvent.status,
				created: mockEvent.created,
				updated: mockEvent.updated,
				description: mockEvent.description,
				summary: mockEvent.summary,
				location: testInput.room,
				colorId: mockEvent.colorId,
				start: { dateTime: mockEvent.start.dateTime },
				end: { dateTime: mockEvent.end.dateTime },
				recurrence: ['RRULE:FREQ=WEEKLY;COUNT=4;BYDAY=SA']
			};
			let mockResponse = [mockRecurringEvent, mockRecurringEvent];
			let mockCalendarAPI = {
				listEvents: sinon.stub().resolves(mockResponse)
			};
			CalendarApp.init(mockCalendarAPI, CONFIG, ROOM_CONFIG.roomsListing);

			let expectedReturnedEvent = {
				id: mockRecurringEvent.id,
				summary: mockRecurringEvent.summary,
				status: mockRecurringEvent.status,
				location: mockRecurringEvent.location,
				start: { dateTime: new Date(mockRecurringEvent.start.dateTime).addDays(21).getISO8601TimeStamp() },
				end: { dateTime: new Date(mockRecurringEvent.end.dateTime).addDays(21).getISO8601TimeStamp() }
			};
			let expectedResult = [expectedReturnedEvent, expectedReturnedEvent];

			return CalendarApp.listBookedEventsByRoom(testInput.startDateTime, testInput.endDateTime, testInput.roomId, testInput.today)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});

		it('should return array of booked non-cancelled events info', () => {
			let testInput = {
				startDateTime: '2017-07-01T00:00:00+08:00',
				endDateTime: '2017-07-02T00:00:00+08:00',
				roomId: 'fg'
			};

			let expectedReturnedEvent = {
				id: mockEvent.id,
				summary: mockEvent.summary,
				status: mockEvent.status,
				location: mockEvent.location,
				start: { dateTime: mockEvent.start.dateTime },
				end: { dateTime: mockEvent.end.dateTime }
			};
			let cancelledEvent = {
				id: mockEvent.id,
				summary: mockEvent.summary,
				status: 'cancelled',
				location: mockEvent.location,
				start: { dateTime: mockEvent.start.dateTime },
				end: { dateTime: mockEvent.end.dateTime }
			};
			let expectedResult = [expectedReturnedEvent];

			let mockResponse = [mockEvent, cancelledEvent];
			let mockCalendarAPI = {
				listEvents: sinon.stub().resolves(mockResponse)
			};
			CalendarApp.init(mockCalendarAPI, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listBookedEventsByRoom(testInput.startDateTime, testInput.endDateTime, testInput.roomId)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
	});

	describe('listEmptySlotsInDay', () => {
		let stub;
		afterEach(() => {
			stub.restore();
		});

		it('should return all except 8-11am timeslots available given 2 single room events (8-9am & 9-11am)', () => {
			let testInput = {
				datetime: '2017-07-01T08:00:00+08:00',
				roomId: 'fg'
			};

			let expectedResult = {
				'11:00 AM': '11:00 AM',
				'11:30 AM': '11:30 AM',
				'12:00 PM': '12:00 PM',
				'12:30 PM': '12:30 PM',
				'1:00 PM': '1:00 PM',
				'1:30 PM': '1:30 PM',
				'2:00 PM': '2:00 PM',
				'2:30 PM': '2:30 PM',
				'3:00 PM': '3:00 PM',
				'3:30 PM': '3:30 PM',
				'4:00 PM': '4:00 PM',
				'4:30 PM': '4:30 PM',
				'5:00 PM': '5:00 PM',
				'5:30 PM': '5:30 PM',
				'6:00 PM': '6:00 PM',
				'6:30 PM': '6:30 PM',
				'7:00 PM': '7:00 PM',
				'7:30 PM': '7:30 PM',
				'8:00 PM': '8:00 PM',
				'8:30 PM': '8:30 PM'
			};

			let respStub = [{
				id: 'id1',
				summary: 'Booked by a',
				location: 'Focus Group Room',
				start: { dateTime: '2017-07-01T08:00:00+08:00' },
				end: { dateTime: '2017-07-01T09:00:00+08:00' },
				status: 'confirmed'
			}, {
				id: 'rtv8bon6il3hcq85u51i45qjmk',
				summary: 'Booked by b',
				location: 'Focus Group Room ',
				start: { dateTime: '2017-07-01T09:00:00+08:00' },
				end: { dateTime: '2017-07-01T11:00:00+08:00' },
				status: 'confirmed'
			}];

			stub = sinon.stub(CalendarApp, 'listBookedEventsByRoom').resolves(respStub);
			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listEmptySlotsInDay(testInput.datetime, testInput.roomId)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});

		it('should return all except 8am-12pm timeslots available given 4 combined room events (8-9am, 10-11am & 9-10am, 11-12pm)', () => {
			let testInput = {
				datetime: '2017-07-01T08:00:00+08:00',
				roomId: 'qc'
			};

			let expectedResult = {
				'12:00 PM': '12:00 PM',
				'12:30 PM': '12:30 PM',
				'1:00 PM': '1:00 PM',
				'1:30 PM': '1:30 PM',
				'2:00 PM': '2:00 PM',
				'2:30 PM': '2:30 PM',
				'3:00 PM': '3:00 PM',
				'3:30 PM': '3:30 PM',
				'4:00 PM': '4:00 PM',
				'4:30 PM': '4:30 PM',
				'5:00 PM': '5:00 PM',
				'5:30 PM': '5:30 PM',
				'6:00 PM': '6:00 PM',
				'6:30 PM': '6:30 PM',
				'7:00 PM': '7:00 PM',
				'7:30 PM': '7:30 PM',
				'8:00 PM': '8:00 PM',
				'8:30 PM': '8:30 PM'
			};

			let respStubQ1 = [{
				id: 'id1',
				summary: 'Booked by a',
				location: 'Queen (Video)',
				start: { dateTime: '2017-07-01T08:00:00+08:00' },
				end: { dateTime: '2017-07-01T09:00:00+08:00' },
				status: 'confirmed'
			}, {
				id: 'id2',
				summary: 'Booked by b',
				location: 'Queen (Video)',
				start: { dateTime: '2017-07-01T10:00:00+08:00' },
				end: { dateTime: '2017-07-01T11:00:00+08:00' },
				status: 'confirmed'
			}];

			let respStubQ2 = [{
				id: 'id3',
				summary: 'Booked by c',
				location: 'Queen (Projector)',
				start: { dateTime: '2017-07-01T09:00:00+08:00' },
				end: { dateTime: '2017-07-01T10:00:00+08:00' },
				status: 'confirmed'
			}, {
				id: 'id4',
				summary: 'Booked by d',
				location: 'Queen (Projector)',
				start: { dateTime: '2017-07-01T11:00:00+08:00' },
				end: { dateTime: '2017-07-01T12:00:00+08:00' },
				status: 'confirmed'
			}];

			stub = sinon.stub(CalendarApp, 'listBookedEventsByRoom');
			stub.onFirstCall().resolves(respStubQ1);
			stub.onSecondCall().resolves(respStubQ2);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listEmptySlotsInDay(testInput.datetime, testInput.roomId)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});

		it('should return {} given missing datetime when listEmptySlotsInDay', () => {
			let testInput = {
				datetime: '',
				roomId: 'q1'
			};

			let expectedResult = {};

			let respStubQ1 = [{
				id: 'id1',
				summary: 'Booked by a',
				location: 'Queen (Video)',
				start: { dateTime: '2017-06-19T08:00:00+08:00' },
				end: { dateTime: '2017-06-19T09:00:00+08:00' },
				status: 'confirmed'
			}, {
				id: 'id2',
				summary: 'Booked by b',
				location: 'Queen (Video)',
				start: { dateTime: '2017-06-19T10:00:00+08:00' },
				end: { dateTime: '2017-06-19T11:30:00+08:00' },
				status: 'confirmed'
			}];

			let respStubQ2 = [{
				id: 'id3',
				summary: 'Booked by c',
				location: 'Queen (Projector)',
				start: { dateTime: '2017-06-19T09:00:00+08:00' },
				end: { dateTime: '2017-06-19T10:00:00+08:00' },
				status: 'confirmed'
			}, {
				id: 'id4',
				summary: 'Booked by d',
				location: 'Queen (Projector)',
				start: { dateTime: '2017-06-19T11:30:00+08:00' },
				end: { dateTime: '2017-06-19T12:00:00+08:00' },
				status: 'confirmed'
			}];

			stub = sinon.stub(CalendarApp, 'listBookedEventsByRoom');
			stub.onFirstCall().resolves(respStubQ1);
			stub.onSecondCall().resolves(respStubQ2);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listEmptySlotsInDay(testInput.datetime, testInput.roomId)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
	});

	describe('insertEvent', () => {
		let stub;
		afterEach(() => {
			stub.restore();
		});
		it('should return correct subset of event details from response when insert into single room q1 success', () => {
			let testInput = {
				eventIdCreated: 'eventid',
				bookingSummary: 'bookingSummary',
				startdate: '2017-06-17T08:00:00+08:00',
				enddate: '2017-06-17T10:00:00+08:00',
				room: 'q1',
				status: '',
				description: 'booked by butler',
				colour: 1,
				username: 'user',
				createdTime: new Date().getISO8601TimeStamp()
			};

			let expectedResult = {
				id: testInput.eventIdCreated,
				summary: `${testInput.bookingSummary} by @${testInput.username}`,
				location: CalendarApp.getRoomNameFromId(testInput.room),
				status: 'confirmed',
				htmlLink: CONFIG.calendarUrl,
				start: testInput.startdate,
				end: testInput.enddate,
				created: testInput.createdTime
			};

			let mockAPIResp = {
				body: {
					id: testInput.eventIdCreated,
					summary: `${testInput.bookingSummary} by @${testInput.username}`,
					location: CalendarApp.getRoomNameFromId(testInput.room),
					status: 'confirmed',
					htmlLink: 'somegcaleventurl',
					start: {
						dateTime: testInput.startdate
					},
					end: {
						dateTime: testInput.enddate
					},
					created: testInput.createdTime,
					colorId: testInput.colour,
					description: testInput.description,
					creator: { email: CONFIG.serviceAcctId },
					organizer: {
						email: CONFIG.calendarId[testInput.room],
						displayName: CalendarApp.getRoomNameFromId(testInput.room),
						self: true
					}
				}
			};

			stub = sinon.stub(CalendarAPI.prototype, 'insertEvent').resolves(mockAPIResp);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.insertEvent(testInput.bookingSummary, testInput.startdate, testInput.enddate, testInput.room, testInput.status, testInput.description, testInput.username)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});

		it('should return correct subset of event details from response when insert into combined room qc success', () => {
			let testInput = {
				bookingSummary: 'bookingSummary qc',
				startdate: '2017-06-17T08:00:00+08:00',
				enddate: '2017-06-17T10:00:00+08:00',
				room: 'qc',
				status: '',
				description: 'booked by butler',
				colour: 1,
				username: 'user',
				createdTime: new Date().getISO8601TimeStamp(),
				combinedRoomDisplayName: CalendarApp.getRoomNameFromId('qc')
			};
			let mockAPIRespR2 = {
				body: {
					id: 'event2Id',
					summary: `${testInput.bookingSummary} by @${testInput.username}`,
					location: testInput.combinedRoomDisplayName,
					status: 'confirmed',
					htmlLink: 'somegcaleventurl',
					start: { dateTime: testInput.startdate },
					end: { dateTime: testInput.enddate },
					created: testInput.createdTime,
					description: testInput.description
				}
			};
			let mockAPIRespR1 = {
				body: {
					id: 'event1Id',
					summary: `${testInput.bookingSummary} by @${testInput.username}`,
					location: testInput.combinedRoomDisplayName,
					status: 'confirmed',
					htmlLink: 'somegcaleventurl',
					start: { dateTime: testInput.startdate },
					end: { dateTime: testInput.enddate },
					created: testInput.createdTime,
					description: `booked via butler@${mockAPIRespR2.body.id}`
				}
			};
			let expectedResult = {
				summary: `${testInput.bookingSummary} by @${testInput.username}`,
				location: CalendarApp.getRoomNameFromId(testInput.room),
				status: 'confirmed',
				htmlLink: CONFIG.calendarUrl,
				start: testInput.startdate,
				end: testInput.enddate,
				created: testInput.createdTime
			};
			stub = sinon.stub(CalendarAPI.prototype, 'insertEvent');
			stub.onFirstCall().resolves(mockAPIRespR2);
			stub.onSecondCall().resolves(mockAPIRespR1);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.insertEvent(testInput.bookingSummary, testInput.startdate, testInput.enddate, testInput.room, testInput.status, testInput.description, testInput.username)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
	});

	describe('deleteEvents', () => {
		let stub;
		afterEach(() => {
			stub.restore();
		});
		it('should return array of successful deleted object when deleting single room event in room q1', () => {
			let testInput = { eventId: 'eventid', room: 'q1' };
			let expectedResult = [{ statusCode: 204, message: 'Event delete success' }];

			let mockAPIResp = { statusCode: 204, message: 'Event delete success' };
			stub = sinon.stub(CalendarAPI.prototype, 'deleteEvent').resolves(mockAPIResp);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.deleteEvents([testInput.eventId], testInput.room)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});

		it('should return promise with error when deleting single event in room q1 returns error', () => {
			let testInput = { eventId: 'eventid', room: 'q1' };
			let mockAPIResp = {
				error: {
					errors: [{ domain: 'global', reason: 'notFound', message: 'Not Found' }],
					code: 404,
					message: 'Not Found'
				}
			};
			let expectedError = new Error('deleteEvents: ' + mockAPIResp);

			stub = sinon.stub(CalendarAPI.prototype, 'deleteEvent').rejects(mockAPIResp);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.deleteEvents([testInput.eventId], testInput.room)
				.catch((err) => {
					expect(err.message).to.eql(expectedError.message);
				});
		});

		it('should return array of successful deleted objects when deleting combined room event in qc', () => {
			let testInput = { event1Id: 'event1id', event2Id: 'event2id', room: 'qc' };
			let expectedResult = [
				{ statusCode: 204, message: 'Event delete success' },
				{ statusCode: 204, message: 'Event delete success' }
			];

			let mockAPIResp = { statusCode: 204, message: 'Event delete success' };
			stub = sinon.stub(CalendarAPI.prototype, 'deleteEvent').resolves(mockAPIResp);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.deleteEvents([testInput.event1Id, testInput.event2Id], testInput.room)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
	});

	describe('listBookedEventsByUser', () => {
		let stub;
		afterEach(() => {
			stub.restore();
		});

		it('should return array of correct aggregate of single room non-recurring events from searching through all calendars', () => {
			let testInput = { startDateTime: new Date('2017-06-17T08:00:00+08:00'), user: 'user' };
			let expectedResult = [{
				id: mockEvent.id,
				summary: mockEvent.summary,
				location: mockEvent.location,
				start: mockEvent.start,
				end: mockEvent.end,
				status: mockEvent.status,
				description: mockEvent.description,
				room: 'primary',	// first calendar on the list
				isByMe: mockEvent.description.indexOf('booked via butler') !== -1,
				recurrent: mockEvent.recurrent
			}, {
				id: mockEvent.id,
				summary: mockEvent.summary,
				location: mockEvent.location,
				start: mockEvent.start,
				end: mockEvent.end,
				status: mockEvent.status,
				description: mockEvent.description,
				room: 'fg',	// second calendar on the list
				isByMe: mockEvent.description.indexOf('booked via butler') !== -1,
				recurrent: mockEvent.recurrent
			}];

			let mockResponse = [mockEvent];

			stub = sinon.stub(CalendarAPI.prototype, 'listEvents');
			stub.onFirstCall().resolves(mockResponse);
			stub.onSecondCall().resolves(mockResponse);
			stub.resolves([]);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listBookedEventsByUser(testInput.startDateTime, testInput.user)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
		it('should return array of correct aggregate of combined room non-recurring events from searching through all calendars', () => {
			let testInput = { startDateTime: new Date('2017-06-17T08:00:00+08:00'), user: 'user' };
			let mockCombinedEvents = [{
				kind: 'calendar#event',
				etag: '0000000000000000',
				id: 'event1',
				status: 'confirmed',
				htmlLink: 'https://www.google.com/calendar/event?eid=12345',
				created: '2017-01-01T00:00:00.000Z',
				updated: '2017-01-01T00:00:00.722Z',
				description: 'booked via butler',
				summary: 'event summary',
				location: ROOM_CONFIG.roomsListing.qc.name,
				colorId: '1',
				creator: { email: '..@gmail.com' },
				organizer: { email: '..@gmail.com', displayName: 'Roomname', self: true },
				start: { dateTime: '2017-07-01T00:30:00+08:00' },
				end: { dateTime: '2017-07-01T01:00:00+08:00' },
				iCalUID: '12345@google.com',
				sequence: 0,
				reminders: { useDefault: true }
			}, {
				kind: 'calendar#event',
				etag: '\"0000000000000000\"',
				id: 'event2',
				status: 'confirmed',
				htmlLink: 'https://www.google.com/calendar/event?eid=12345',
				created: '2017-01-01T00:00:00.000Z',
				updated: '2017-01-01T00:00:00.722Z',
				description: 'booked via butler@event1',
				summary: 'event summary',
				location: ROOM_CONFIG.roomsListing.qc.name,
				colorId: '1',
				creator: { email: '..@gmail.com' },
				organizer: { email: '..@gmail.com', displayName: 'Roomname', self: true },
				start: { dateTime: '2017-07-01T00:30:00+08:00' },
				end: { dateTime: '2017-07-01T01:00:00+08:00' },
				iCalUID: '12345@google.com',
				sequence: 0,
				reminders: { useDefault: true }
			}];

			let expectedResult = [, {									// q2 event will be deleted as part of merging combined room events
				id: mockCombinedEvents[1].id,
				summary: mockCombinedEvents[1].summary,
				location: mockCombinedEvents[1].location,
				start: mockCombinedEvents[1].start,
				end: mockCombinedEvents[1].end,
				status: mockCombinedEvents[1].status,
				description: mockCombinedEvents[1].description,
				room: ROOM_CONFIG.roomsListing.qc.id,						// the room id shown for combined events will be for qc
				isByMe: mockCombinedEvents[1].description.indexOf('booked via butler') !== -1,
				recurrent: mockCombinedEvents[1].recurrent
			}];

			stub = sinon.stub(CalendarAPI.prototype, 'listEvents');
			stub.resolves([]);
			stub.onCall(2).resolves([mockCombinedEvents[0]]);
			stub.onCall(3).resolves([mockCombinedEvents[1]]);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			return CalendarApp.listBookedEventsByUser(testInput.startDateTime, testInput.user)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
		it('should return array of correct aggregate of single room recurring events from searching through all calendars', () => {
			let testInput = { startDateTime: new Date('2017-07-22T00:00:00+08:00'), user: 'user', room: 'fgd' };

			let mockRecurringEvent = {
				kind: mockEvent.kind,
				id: mockEvent.id,
				status: mockEvent.status,
				created: mockEvent.created,
				updated: mockEvent.updated,
				description: mockEvent.description,
				summary: mockEvent.summary,
				location: testInput.room,
				colorId: mockEvent.colorId,
				start: { dateTime: mockEvent.start.dateTime },
				end: { dateTime: mockEvent.end.dateTime },
				recurrence: ['RRULE:FREQ=WEEKLY;COUNT=4;BYDAY=SA']
			};
			let mockResponse = [mockRecurringEvent];

			stub = sinon.stub(CalendarAPI.prototype, 'listEvents');
			stub.onFirstCall().resolves(mockResponse);
			stub.resolves([]);

			let calApiInstance = new CalendarAPI(CONFIG);
			CalendarApp.init(calApiInstance, CONFIG, ROOM_CONFIG.roomsListing);

			let expectedResult = [{
				id: mockRecurringEvent.id,
				summary: mockRecurringEvent.summary,
				location: mockRecurringEvent.location,
				start: { dateTime: new Date(mockRecurringEvent.start.dateTime).addDays(21).getISO8601TimeStamp() },
				end: { dateTime: new Date(mockRecurringEvent.end.dateTime).addDays(21).getISO8601TimeStamp() },
				status: mockRecurringEvent.status,
				description: mockRecurringEvent.description,
				room: 'primary',
				isByMe: mockRecurringEvent.description.indexOf('booked via butler') !== -1,
				recurrent: ' (Recurring)'
			}];

			return CalendarApp.listBookedEventsByUser(testInput.startDateTime, testInput.user)
				.then((promisedResult) => {
					expect(promisedResult).to.eql(expectedResult);
				});
		});
	});
});
