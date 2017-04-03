import dotenv from 'dotenv';
dotenv.load();
let CalendarApp = require('../src/modules/CalendarApp');

let chai = require('chai');
let expect = chai.expect;

describe('CalendarApp', () => {

	describe('checkWithinWeek', () => {
		it('should return correct days till upcoming occurrence from startdate for future-start events', () => {
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
		it('should return correct days till upcoming occurrence from startdate for events across weeks', () => {
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
		it('should return -1 when no events within the week can be found to start after today', () => {
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
			console.log('expect: ' + expectedResultStart.getFormattedDateTime() + ' to be ' + startDate.getFormattedDateTime());
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

			console.log('expect: ' + expectedResultStart.getFormattedDateTime() + ' to be ' + startDate.getFormattedDateTime());
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
		it('should return correct roomnames for all room ids', () => {
			let roomNames = {
				'q1': 'Queen (Video)',
				'q2': 'Queen (Projector)',
				'qc': 'Queen (Combined)',
				'dr': 'Drone',
				'fg': 'Focus Group Discussion',
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
		it('should return 8am - 830pm list of timeslots when setupTimeArray called at 1200am', () => {
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

		it('should return 830pm when setupTimeArray called at 830pm', () => {
			let expectedResult = {
				'8:30 PM': '8:30 PM'
			};
			let result = CalendarApp.setupTimeArray(new Date().setTime(20, 30, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return empty obj when setupTimeArray called at 831pm', () => {
			let expectedResult = {};
			let result = CalendarApp.setupTimeArray(new Date().setTime(20, 31, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return empty obj when setupTimeArray called at 1159pm', () => {
			let expectedResult = {};
			let result = CalendarApp.setupTimeArray(new Date().setTime(23, 59, 0, 0));
			expect(result).to.eql(expectedResult);
		});
	});

	describe('filterBusyTimeslots', () => {
		it('should return timeslots (8am - 830pm except 5pm slot) when setupTimeArray called with event from 5-530pm', () => {
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

		it('should return timeslots (8am - 830pm except 5pm-6pm slot) when setupTimeArray called with events from 5-530pm & 530-6pm', () => {
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

	// xdescribe('insertEvent', () => {
	// 	it('should return event details when insert into q1 success', () => {
	// 		let callback = sinon.stub(cal, 'insertEvent');
	// 		callback.withArgs('bookingSummary', '2017-04-02T14:00:00+08:00', '2017-04-02T15:00:00+08:00', 'q1', '', 'booked by butler', '@shekyh').returns(1);

	// 		let fullTimeSlot = CalendarApp.setupTimeArray(new Date().setTime(0, 0, 0, 0));
	// 		let result = CalendarApp.filterBusyTimeslots(fullTimeSlot, events);
	// 		expect(result).to.eql(expectedResult);
	// 	});
	// });
});

