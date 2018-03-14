import { expect } from 'chai';

require('../src/modules/Date');

describe('Date', () => {
	describe('setDateWithSimpleFormat', () => {
		it('should return 30/1/2017 as Date with "30/1/2017" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017');
			let expectedResult = new Date(2017, 0, 30, 0, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
	});

	describe('setDateWithGoogleRecurEventISO8601Format', () => {
		it('should return 30/1/2017 10:00:00 AM (+08:00) as Date with "20170130T020000Z" as input', () => {
			let date = new Date().setDateWithGoogleRecurEventISO8601Format('20170130T020000Z');
			let expectedResult = new Date().setDateWithSimpleFormat('30/1/2017').setTime(10, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
	});

	describe('setTime', () => {
		it('should return 23:59:59:00hr as Time with "(23, 59, 59, 0)" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017').setTime(23, 59, 59, 0);
			let expectedResult = new Date(2017, 0, 30, 23, 59, 59, 0);
			expect(date).to.eql(expectedResult);
		});
	});

	describe('getDayNameInWeek', () => {
		it('should return SA as dayName with with 30/1/2017 as input', () => {
			let date = new Date().setDateWithSimpleFormat('18/3/2017');
			let expectedResult = 'SA';
			expect(date.getDayNameInWeek()).to.eql(expectedResult);
		});
	});

	describe('getNumOfDaysDiffInWeekForDayNames', () => {
		it('should return correct weekday order with startDate as SA', () => {
			let startDate = new Date().setDateWithSimpleFormat('18/3/2017');
			let expectedResult = {
				SU: 1, MO: 2, TU: 3, WE: 4, TH: 5, FR: 6, SA: 0
			};
			let result = startDate.getNumOfDaysDiffInWeekForDayNames();
			expect(result).to.eql(expectedResult);
		});

		it('should return correct weekday order with startDate as MO', () => {
			let startDate = new Date().setDateWithSimpleFormat('20/3/2017');
			let expectedResult = {
				SU: 6, MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5
			};
			let result = startDate.getNumOfDaysDiffInWeekForDayNames();
			expect(result).to.eql(expectedResult);
		});
	});

	describe('getFormattedDate', () => {
		it('should return "30 January, 2017" as Date format with "30/1/2017" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017');
			let expectedResult = 'January 30, 2017';
			expect(date.getFormattedDate()).to.eql(expectedResult);
		});
	});

	describe('getFormattedTime', () => {
		it('should return "10:01 AM" as Date format with "10:01" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017').setTime(10, 1, 0, 0);
			let expectedResult = '10:01 AM';
			expect(date.getFormattedTime()).to.eql(expectedResult);
		});
	});

	describe('getISO8601TimeStamp', () => {
		it('should return "2017-01-30T10:01:02+08:00" as Date format with "30/1/2017, 10:01:02" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017').setTime(10, 1, 2, 0);
			let expectedResult = '2017-01-30T10:01:02+08:00';
			expect(date.getISO8601TimeStamp()).to.eql(expectedResult);
		});
	});

	describe('getISO8601DateWithDefinedTime', () => {
		it('should return "2017-01-30T10:01:02+08:00" as Date format with "30/1/2017, 10:01:02" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017');
			let isoDateStr = date.getISO8601DateWithDefinedTime(10, 1, 2, 0);
			let expectedResult = '2017-01-30T10:01:02+08:00';
			expect(isoDateStr).to.eql(expectedResult);
		});
	});

	describe('getISO8601DateWithDefinedTimeString', () => {
		it('should return "2017-01-30T10:01:02+08:00" as Date format with "30/1/2017, 10:01 AM" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017');
			let isoDateStr = date.getISO8601DateWithDefinedTimeString('10:01 AM');
			let expectedResult = '2017-01-30T10:01:00+08:00';
			expect(isoDateStr).to.eql(expectedResult);
		});
		it('should return "2017-01-30T10:01:02+08:00" as Date format with "30/1/2017, 10:01 PM" as input', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017');
			let isoDateStr = date.getISO8601DateWithDefinedTimeString('10:01 PM');
			let expectedResult = '2017-01-30T22:01:00+08:00';
			expect(isoDateStr).to.eql(expectedResult);
		});
	});

	describe('rounddownToNearestHalfHour', () => {
		it('should return 2:00hr with 2:00hr as input', () => {
			let date = new Date().setTime(2, 0, 0, 0).rounddownToNearestHalfHour();
			let expectedResult = new Date().setTime(2, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
		it('should return 2:30hr with 2:30hr as input', () => {
			let date = new Date().setTime(2, 30, 0, 0).rounddownToNearestHalfHour();
			let expectedResult = new Date().setTime(2, 30, 0, 0);
			expect(date).to.eql(expectedResult);
		});
		it('should return 2:00hr with 2:29hr as input', () => {
			let date = new Date().setTime(2, 29, 0, 0).rounddownToNearestHalfHour();
			let expectedResult = new Date().setTime(2, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
		it('should return 1:30hr with 1:59hr as input', () => {
			let date = new Date().setTime(1, 59, 0, 0).rounddownToNearestHalfHour();
			let expectedResult = new Date().setTime(1, 30, 0, 0);
			expect(date).to.eql(expectedResult);
		});
	});

	describe('roundupToNearestHalfHour', () => {
		it('should return 1:30hr with 1:30hr as input', () => {
			let date = new Date().setTime(1, 30, 0, 0).roundupToNearestHalfHour();
			let expectedResult = new Date().setTime(1, 30, 0, 0);
			expect(date).to.eql(expectedResult);
		});
		it('should return 2:00hr with 2:00hr as input', () => {
			let date = new Date().setTime(2, 0, 0, 0).roundupToNearestHalfHour();
			let expectedResult = new Date().setTime(2, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
		it('should return 2:00hr with 1:31hr as input', () => {
			let date = new Date().setTime(1, 31, 0, 0).roundupToNearestHalfHour();
			let expectedResult = new Date().setTime(2, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
		it('should return 2:00hr with 1:59hr as input', () => {
			let date = new Date().setTime(1, 59, 0, 0).roundupToNearestHalfHour();
			let expectedResult = new Date().setTime(2, 0, 0, 0);
			expect(date).to.eql(expectedResult);
		});
	});

	describe('getCurrentMonthNamed', () => {
		it('should return January for date 30/1/2017', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017');
			let expectedResult = 'January';
			expect(date.getCurrentMonthNamed()).to.eql(expectedResult);
		});

	});

	describe('getMinuteDiff', () => {
		it('should return 1 as diff between 10:01 and 10:00', () => {
			let date = new Date().setDateWithSimpleFormat('30/1/2017').setTime(10, 0, 0, 0);
			let compareDate = new Date().setDateWithSimpleFormat('30/1/2017').setTime(10, 1, 0, 0);

			let expectedResult = 1;
			expect(date.getMinuteDiff(compareDate)).to.eql(expectedResult);
		});

	});
});
