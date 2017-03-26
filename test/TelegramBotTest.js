const Bluebird = require('bluebird');
const mockery = require('mockery');
let telegramBot;

import dotenv from 'dotenv';
dotenv.load();

let chai = require('chai');
let expect = chai.expect;

describe('ParamBuilder', () => {
  let paramBuilder = require('../src/modules/ParamBuilder');
  describe('constructTimeslotOptions', () => {
    it('should return full list telegram keyboard paramOptions when allTimeslots available', () => {
      let expectedResult =
        [[{
          text: '8:00 AM',
          callback_data: '{"date":"18/4/2017","time":"8:00 AM","room":"bb"}'
        },
        {
          text: '8:30 AM',
          callback_data: '{"date":"18/4/2017","time":"8:30 AM","room":"bb"}'
        }],
        [{
          text: '9:00 AM',
          callback_data: '{"date":"18/4/2017","time":"9:00 AM","room":"bb"}'
        },
        {
          text: '9:30 AM',
          callback_data: '{"date":"18/4/2017","time":"9:30 AM","room":"bb"}'
        }],
        [{
          text: '10:00 AM',
          callback_data: '{"date":"18/4/2017","time":"10:00 AM","room":"bb"}'
        },
        {
          text: '10:30 AM',
          callback_data: '{"date":"18/4/2017","time":"10:30 AM","room":"bb"}'
        }],
        [{
          text: '11:00 AM',
          callback_data: '{"date":"18/4/2017","time":"11:00 AM","room":"bb"}'
        },
        {
          text: '11:30 AM',
          callback_data: '{"date":"18/4/2017","time":"11:30 AM","room":"bb"}'
        }],
        [{
          text: '12:00 PM',
          callback_data: '{"date":"18/4/2017","time":"12:00 PM","room":"bb"}'
        },
        {
          text: '12:30 PM',
          callback_data: '{"date":"18/4/2017","time":"12:30 PM","room":"bb"}'
        }],
        [{
          text: '1:00 PM',
          callback_data: '{"date":"18/4/2017","time":"1:00 PM","room":"bb"}'
        },
        {
          text: '1:30 PM',
          callback_data: '{"date":"18/4/2017","time":"1:30 PM","room":"bb"}'
        }],
        [{
          text: '2:00 PM',
          callback_data: '{"date":"18/4/2017","time":"2:00 PM","room":"bb"}'
        },
        {
          text: '2:30 PM',
          callback_data: '{"date":"18/4/2017","time":"2:30 PM","room":"bb"}'
        }],
        [{
          text: '3:00 PM',
          callback_data: '{"date":"18/4/2017","time":"3:00 PM","room":"bb"}'
        },
        {
          text: '3:30 PM',
          callback_data: '{"date":"18/4/2017","time":"3:30 PM","room":"bb"}'
        }],
        [{
          text: '4:00 PM',
          callback_data: '{"date":"18/4/2017","time":"4:00 PM","room":"bb"}'
        },
        {
          text: '4:30 PM',
          callback_data: '{"date":"18/4/2017","time":"4:30 PM","room":"bb"}'
        }],
        [{
          text: '5:00 PM',
          callback_data: '{"date":"18/4/2017","time":"5:00 PM","room":"bb"}'
        },
        {
          text: '5:30 PM',
          callback_data: '{"date":"18/4/2017","time":"5:30 PM","room":"bb"}'
        }],
        [{
          text: '6:00 PM',
          callback_data: '{"date":"18/4/2017","time":"6:00 PM","room":"bb"}'
        },
        {
          text: '6:30 PM',
          callback_data: '{"date":"18/4/2017","time":"6:30 PM","room":"bb"}'
        }],
        [{
          text: '7:00 PM',
          callback_data: '{"date":"18/4/2017","time":"7:00 PM","room":"bb"}'
        },
        {
          text: '7:30 PM',
          callback_data: '{"date":"18/4/2017","time":"7:30 PM","room":"bb"}'
        }],
        [{
          text: '8:00 PM',
          callback_data: '{"date":"18/4/2017","time":"8:00 PM","room":"bb"}'
        },
        {
          text: '8:30 PM',
          callback_data: '{"date":"18/4/2017","time":"8:30 PM","room":"bb"}'
        }],
        [{ text: '<<Back', callback_data: '{"room":"bb"}' }]];

      let availTimeslots = {
        '8:00 AM': '8:00 AM',
        '8:30 AM': '8:30 AM',
        '9:00 AM': '9:00 AM',
        '9:30 AM': '9:30 AM',
        '10:00 AM': '10:00 AM',
        '10:30 AM': '10:30 AM',
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
      let room = 'bb';
      let date = new Date().setDateWithSimpleFormat('18/4/2017');
      let result = paramBuilder.constructTimeslotOptions(availTimeslots, room, date);
      expect(result).to.eql(expectedResult);
    });

    it('should return all except 530pm - 630pm telegram keyboard paramOptions when allTimeslots except 530pm - 630pm available', () => {
      let expectedResult =
        [[{
          text: '8:00 AM',
          callback_data: '{"date":"18/4/2017","time":"8:00 AM","room":"fgd"}'
        },
        {
          text: '8:30 AM',
          callback_data: '{"date":"18/4/2017","time":"8:30 AM","room":"fgd"}'
        }],
        [{
          text: '9:00 AM',
          callback_data: '{"date":"18/4/2017","time":"9:00 AM","room":"fgd"}'
        },
        {
          text: '9:30 AM',
          callback_data: '{"date":"18/4/2017","time":"9:30 AM","room":"fgd"}'
        }],
        [{
          text: '10:00 AM',
          callback_data: '{"date":"18/4/2017","time":"10:00 AM","room":"fgd"}'
        },
        {
          text: '10:30 AM',
          callback_data: '{"date":"18/4/2017","time":"10:30 AM","room":"fgd"}'
        }],
        [{
          text: '11:00 AM',
          callback_data: '{"date":"18/4/2017","time":"11:00 AM","room":"fgd"}'
        },
        {
          text: '11:30 AM',
          callback_data: '{"date":"18/4/2017","time":"11:30 AM","room":"fgd"}'
        }],
        [{
          text: '12:00 PM',
          callback_data: '{"date":"18/4/2017","time":"12:00 PM","room":"fgd"}'
        },
        {
          text: '12:30 PM',
          callback_data: '{"date":"18/4/2017","time":"12:30 PM","room":"fgd"}'
        }],
        [{
          text: '1:00 PM',
          callback_data: '{"date":"18/4/2017","time":"1:00 PM","room":"fgd"}'
        },
        {
          text: '1:30 PM',
          callback_data: '{"date":"18/4/2017","time":"1:30 PM","room":"fgd"}'
        }],
        [{
          text: '2:00 PM',
          callback_data: '{"date":"18/4/2017","time":"2:00 PM","room":"fgd"}'
        },
        {
          text: '2:30 PM',
          callback_data: '{"date":"18/4/2017","time":"2:30 PM","room":"fgd"}'
        }],
        [{
          text: '3:00 PM',
          callback_data: '{"date":"18/4/2017","time":"3:00 PM","room":"fgd"}'
        },
        {
          text: '3:30 PM',
          callback_data: '{"date":"18/4/2017","time":"3:30 PM","room":"fgd"}'
        }],
        [{
          text: '4:00 PM',
          callback_data: '{"date":"18/4/2017","time":"4:00 PM","room":"fgd"}'
        },
        {
          text: '4:30 PM',
          callback_data: '{"date":"18/4/2017","time":"4:30 PM","room":"fgd"}'
        }],
        [{
          text: '5:00 PM',
          callback_data: '{"date":"18/4/2017","time":"5:00 PM","room":"fgd"}'
        },
        {
          text: '6:30 PM',
          callback_data: '{"date":"18/4/2017","time":"6:30 PM","room":"fgd"}'
        }],
        [{
          text: '7:00 PM',
          callback_data: '{"date":"18/4/2017","time":"7:00 PM","room":"fgd"}'
        },
        {
          text: '7:30 PM',
          callback_data: '{"date":"18/4/2017","time":"7:30 PM","room":"fgd"}'
        }],
        [{
          text: '8:00 PM',
          callback_data: '{"date":"18/4/2017","time":"8:00 PM","room":"fgd"}'
        },
        {
          text: '8:30 PM',
          callback_data: '{"date":"18/4/2017","time":"8:30 PM","room":"fgd"}'
        }],
        [{ text: '<<Back', callback_data: '{"room":"fgd"}' }]];

      let availTimeslots = {
        '8:00 AM': '8:00 AM',
        '8:30 AM': '8:30 AM',
        '9:00 AM': '9:00 AM',
        '9:30 AM': '9:30 AM',
        '10:00 AM': '10:00 AM',
        '10:30 AM': '10:30 AM',
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
        '6:30 PM': '6:30 PM',
        '7:00 PM': '7:00 PM',
        '7:30 PM': '7:30 PM',
        '8:00 PM': '8:00 PM',
        '8:30 PM': '8:30 PM'
      };
      let room = 'fgd';
      let date = new Date().setDateWithSimpleFormat('18/4/2017');
      let result = paramBuilder.constructTimeslotOptions(availTimeslots, room, date);
      expect(result).to.eql(expectedResult);
    });

     it('should return only back button as paramOptions when allTimeslots are not available', () => {
      let expectedResult =
        [[{ text: '<<Back', callback_data: '{"room":"fgd"}' }]];

      let availTimeslots = {};
      let room = 'fgd';
      let date = new Date().setDateWithSimpleFormat('18/4/2017');
      let result = paramBuilder.constructTimeslotOptions(availTimeslots, room, date);
      expect(result).to.eql(expectedResult);
    });
  });
});

xdescribe('Telegram Bot', () => {
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

  xdescribe('Core', () => {
    beforeEach(() => {
      let message = {
        text: 'mock data',
        chat: {
          type: 'private'
        }
      };
      let checkCommandList = () => { };
      checkCommandList = jasmine.createSpy('checkCommandList');
    });

    it('should call checkCommandList() when messages are received', (message) => {
      telegramBot.emit('message', message);
      expect(checkCommandList).toHaveBeenCalled();
    });
  });
});

xdescribe('TelegramBot', () => {
  // let telebot = require('../src/modules/TelegramBot');
  xdescribe('promptTimeslotSelection', () => {
    it('should return prompt message for timeslot selection with buttons as optionalParams', () => {
      //telebot.promptTimeslotSelection(query, room, startDate);

    });
  });
});

