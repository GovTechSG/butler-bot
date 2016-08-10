const Bluebird = require('bluebird');
const mockery = require('mockery');
let telegramBot;

describe('Telegram Bot', () => {

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

    telegramBot = require('../src/modules/TelegramBot');
  });

  afterEach(() => {
    mockery.disable();
    mockery.deregisterAll();
  });

  describe('Core', () => {

    beforeEach(() => {
      let message = {
        text: 'mock data',
        chat: {
          type: 'private'
        }
      };
      let checkCommandList = () => {};
      checkCommandList = jasmine.createSpy('checkCommandList');
    });

    it('should call checkCommandList() when messages are received', (message) => {
      telegramBot.emit('message', message);
      expect(checkCommandList).toHaveBeenCalled();
    });
  });
});