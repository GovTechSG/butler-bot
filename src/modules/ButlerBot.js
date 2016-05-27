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
    })

    super.startPolling();
  }
}

module.exports = ButlerBot;