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

    super.startPolling();
  }
}

module.exports = ButlerBot;