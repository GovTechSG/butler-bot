const TelegramBot = require('telegraf');
const Promise = require('bluebird');
const rp = require('request-promise');

class ButlerBot extends TelegramBot {
  constructor(token) {
    super(token);
    this._config = {
      token: token,
      telegram_filepath: 'https://api.telegram.org/file/bot'
    };
  }

  encodeBase64(response) {
    var string = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(response.body).toString('base64');
    return string;
  }

  init() {
    super.hears('/start', function * () {
      this.reply('Hello!');
    });

    super.on('inline_query', function * () {
      let results = [{
        'type': 'article',
        'id': 'queen_room_1',
        'title': 'Queen Room 1',
        'input_message_content': {
          'message_text': '/book_queen_1',
          'disable_web_page_preview': true
        }
      },
      {
        'type': 'article',
        'id': 'queen_room_2',
        'title': 'Queen Room 2',
        'input_message_content': {
          'message_text': '/book_queen_2',
          'disable_web_page_preview': true
        }
      },
      {
        'type': 'article',
        'id': 'drone_room',
        'title': 'Drone Room',
        'input_message_content': {
          'message_text': '/book_drone',
          'disable_web_page_preview': true
        }
      },
      {
        'type': 'article',
        'id': 'fgd_room',
        'title': 'Focus Group Discussion Room',
        'input_message_content': {
          'message_text': '/book_fgd',
          'disable_web_page_preview': true
        }
      }]
      this.answerInlineQuery(results);
    });

    super.hears('/book_queen_1', function * () {
      let options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Today', callback_data: 'pick_today' },
            { text: 'Pick a date', callback_data: 'pick_date' }
          ]]
        }
      };
      this.reply('Booking a timeslot for *Queen Room 1*\n\nPlease choose a date:', options);
    })

    super.hears('/book_queen_2', function * () {
      let options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Today', callback_data: 'pick_today' },
            { text: 'Pick a date', callback_data: 'pick_date' }
          ]]
        }
      };
      this.reply('Booking a timeslot for *Queen Room 2*\n\nPlease choose a date:', options);
    })

    super.hears('/book_queen_combined', function * () {
      let options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Today', callback_data: 'pick_today' },
            { text: 'Pick a date', callback_data: 'pick_date' }
          ]]
        }
      };
      this.reply('Booking a timeslot for *Queen Room Combined*\n\nPlease choose a date:', options);
    })

    super.hears('/book_drone', function * () {
      let options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Today', callback_data: 'pick_today' },
            { text: 'Pick a date', callback_data: 'pick_date' }
          ]]
        }
      };
      this.reply('Booking a timeslot for *Drone Room*\n\nPlease choose a date:', options);
    })

    super.hears('/book_fgd', function * () {
      let options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Today', callback_data: 'pick_today' },
            { text: 'Pick a date', callback_data: 'pick_date' }
          ]]
        }
      };
      this.reply('Booking a timeslot for *Focus Group Discussion Room*\n\nPlease choose a date:', options);
    })

    super.on('callback_query', function * () {
      let data = this.callbackQuery.data;
      let options = {};
      if (data === 'pick_today') {
        options = {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '8:00am - 9:00am', callback_data: 'pick_time' }],
              [{ text: '9:00am - 10:00am', callback_data: 'pick_time' }],
              [{ text: '10:00am - 11:00am', callback_data: 'pick_time' }],
              [{ text: '11:00am - 12:00pm', callback_data: 'pick_time' }],
              [{ text: '12:00pm - 1:00pm', callback_data: 'pick_time' }],
              [{ text: '1:00pm - 2:00pm', callback_data: 'pick_time' }],
              [{ text: '2:00pm - 3:00pm', callback_data: 'pick_time' }],
              [{ text: '3:00pm - 4:00pm', callback_data: 'pick_time' }],
              [{ text: '4:00pm - 5:00pm', callback_data: 'pick_time' }],
              [{ text: '5:00pm - 6:00pm', callback_data: 'pick_time' }],
            ]
          }
        };
        this.reply('You have choosing a timeslot for *today*', options);
      } else if (data === 'pick_date') {
        options = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '1', callback_data: 'pick_date_calendar' },
              { text: '2', callback_data: 'pick_date_calendar' },
              { text: '3', callback_data: 'pick_date_calendar' },
              { text: '4', callback_data: 'pick_date_calendar' },
              { text: '5', callback_data: 'pick_date_calendar' }],
              [{ text: '6', callback_data: 'pick_date_calendar' },
              { text: '7', callback_data: 'pick_date_calendar' },
              { text: '8', callback_data: 'pick_date_calendar' },
              { text: '9', callback_data: 'pick_date_calendar' },
              { text: '10', callback_data: 'pick_date_calendar' }],
              [{ text: '11', callback_data: 'pick_date_calendar' },
              { text: '12', callback_data: 'pick_date_calendar' },
              { text: '13', callback_data: 'pick_date_calendar' },
              { text: '14', callback_data: 'pick_date_calendar' },
              { text: '15', callback_data: 'pick_date_calendar' }],
              [{ text: '16', callback_data: 'pick_date_calendar' },
              { text: '17', callback_data: 'pick_date_calendar' },
              { text: '18', callback_data: 'pick_date_calendar' },
              { text: '19', callback_data: 'pick_date_calendar' },
              { text: '20', callback_data: 'pick_date_calendar' }],
              [{ text: '21', callback_data: 'pick_date_calendar' },
              { text: '22', callback_data: 'pick_date_calendar' },
              { text: '23', callback_data: 'pick_date_calendar' },
              { text: '24', callback_data: 'pick_date_calendar' },
              { text: '25', callback_data: 'pick_date_calendar' }],
              [{ text: '26', callback_data: 'pick_date_calendar' },
              { text: '27', callback_data: 'pick_date_calendar' },
              { text: '28', callback_data: 'pick_date_calendar' },
              { text: '29', callback_data: 'pick_date_calendar' },
              { text: '30', callback_data: 'pick_date_calendar' }],
              [{ text: 'Previous Month', callback_data: 'previous_month' },
              { text: 'Next Month', callback_data: 'next_month' }]
            ]
          }
        };
        this.reply('You have chosen the time...', options);
      } else if (data === 'pick_time') {
        this.answerCallbackQuery('Done! Your booking is confirmed');
        this.reply('View your booking here:\n\n<url>');
      };
    })

    super.startPolling();
  }
}

module.exports = ButlerBot;