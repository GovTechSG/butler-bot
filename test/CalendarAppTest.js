import dotenv from 'dotenv';
dotenv.load();
let cal_app = require('../src/modules/CalendarApp');

let chai = require('chai');
let expect = chai.expect;
 
describe('CalendarApp', () => { 
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

});