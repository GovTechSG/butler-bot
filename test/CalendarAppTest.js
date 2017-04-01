import dotenv from 'dotenv';
dotenv.load();
let cal_app = require('../src/modules/CalendarApp');

let chai = require('chai');
let expect = chai.expect;

describe('CalendarApp', () => {

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
			for (var key in roomNames) {
				if (roomNames.hasOwnProperty(key)) {
					let expectedResult = roomNames[key];
					let result = cal_app.getRoomNameFromId(key);
					expect(result).to.eql(expectedResult);
				}
			}
		});
	});

	describe('setupTimeArray', () => {
		it('should return 8am - 830pm list of timeslots when setupTimeArray called with 1200am', () => {
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
			let result = cal_app.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return 830pm when setupTimeArray called with 830pm', () => {
			let expectedResult = {
				'8:30 PM': '8:30 PM'
			};
			let result = cal_app.setupTimeArray(new Date().setTime(20, 30, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return {} when setupTimeArray called with 831pm', () => {
			let expectedResult = {};
			let result = cal_app.setupTimeArray(new Date().setTime(20, 31, 0, 0));
			expect(result).to.eql(expectedResult);
		});

		it('should return {} when setupTimeArray called with 1159pm', () => {
			let expectedResult = {};
			let result = cal_app.setupTimeArray(new Date().setTime(23, 59, 0, 0));
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
			let fullTimeSlot = cal_app.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			let result = cal_app.filterBusyTimeslots(fullTimeSlot, events);
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
			let fullTimeSlot = cal_app.setupTimeArray(new Date().setTime(0, 0, 0, 0));
			let result = cal_app.filterBusyTimeslots(fullTimeSlot, events);
			expect(result).to.eql(expectedResult);
		});
	});

});

