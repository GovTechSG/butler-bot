const ButlerBot = require('./modules/ButlerBot');
const butlerBot = new ButlerBot(process.env['TELEGRAM_TOKEN_2']);

butlerBot.init();