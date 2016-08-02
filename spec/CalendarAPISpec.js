const Bluebird = require('bluebird');
const mockery = require('mockery');
let CalendarAPI;
let calendar;

describe('Calendar API', () => {

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    mockery.registerMock('request-promise', options => {
      let response = {
        statusCode: 200,
        body: '{ result: test }',
        options: options
      }
      return Bluebird.resolve(response);
    });

    CalendarAPI = require('../src/modules/CalendarAPI');
    calendar = new CalendarAPI('../src/config/settings');
  });

  afterEach(() => {
    mockery.disable();
    mockery.deregisterAll();
  })

  describe('Core', () => {
    describe('Instantiating', () => {
      it('should throw an error if credentials are not supplied', () => {
        expect(() => { let cal = new CalendarAPI(); }).toThrow();
      });
    });

    describe('_request', () => {
      it('should throw an error if params not supplied as argument', () => {
        expect(() => { calendar._request(); }).toThrow();
      });

      it('should return a promise', (done) => {
        expect(typeof calendar._request({}).then === 'function').toEqual(true);
        done();
      });
    });

    describe('post', () => {
      it('should throw an error if params not supplied as argument', () => {
        expect(() => { calendar._post(); }).toThrow();
      });
    });
  });
});