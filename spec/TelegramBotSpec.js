import chai, { expect } from "chai";
import { spy, stub } from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
import Promise from 'bluebird';

const mockery = require('mockery');
let butlerBot;
let cal_app = {};
let reply_builder = {};

describe('Telegram Bot', () => {

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    mockery.registerMock('../data/users', {

    });
    mockery.registerMock('ioredis', () => {
      return {
        on: (name, callback) => {}
      };
    });

    cal_app = {
      listEmptySlotsInDay: stub().returns(Promise.resolve([]))
    };
    reply_builder = {
      informNoTimeslot: stub().returns('no_room')
    };
    mockery.registerMock('./CalendarApp', cal_app);
    mockery.registerMock('./ReplyBuilder', reply_builder);
    mockery.registerMock('./SessionManagement', {
      extendSession: spy(),
      setupEventEmitter: spy()
    });

    butlerBot = require('../src/modules/TelegramBot').slimbot;
  });

  afterEach(() => {
    mockery.disable();
    mockery.deregisterAll();
  });

  describe('#promptTimeslotSelection', () => {
    let query;

    beforeEach(() => {
      query = {
        data: '{"date": "pick_today", "room": "bee"}',
        message: {
          chat: {
            id: 1
          }
        }
      };
    });

    it('should call calendar app with startDate and room', () => {
      butlerBot.emit('callback_query', query);

      expect(cal_app.listEmptySlotsInDay).to.have.been
      .calledWith(new Date().getISO8601TimeStamp(), 'bee');
    });

  });
});
