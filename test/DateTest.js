let chai = require('chai');
let expect = chai.expect;

describe('Date', () => {
    let dateExtension = require('../src/modules/Date');
    describe('setDateWithSimpleFormat', () => {
        it('should return 30/1/2017 as Date with "30/1/2017" as input', () => {
            let date = new Date().setDateWithSimpleFormat('30/1/2017');
            let expectedResult = new Date(2017, 0, 30, 0, 0, 0, 0);
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
});