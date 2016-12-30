//TelegramBot
require('./Date');
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env['TELEGRAM_BOT_TOKEN']);
const paramBuilder = require('./OptParamBuilder');
const sessionMgr = require('./SessionManagement');
const replyBuilder = require('./ReplyBuilder');
const Text = require('./Messages');
const EventEmitter = require('eventemitter3');
let Emitter = new EventEmitter();
let cal_app = require('./CalendarApp');
let botName;

slimbot.getMe().then(update => {
  console.log(update);
  botName = update.result.username;
});

let roomlist = {
  'q1': 'Queen 1',
  'q2': 'Queen 2',
  'qc': 'Queen (Combined)',
  'dr': 'Drone',
  'fg': 'Focus Group Discussion Room'
};

let bookerQueue = {};

console.log('bot started on ' + new Date().getFormattedTime());
// debug cal_app
// cal_app.queueForInsert('bookingSummary', '2016-09-28T10:00:00+08:00', '2016-09-28T12:00:00+08:00', 'qc', 'confirmed', 'description', 'shekyh');
// cal_app.queueForInsert('bookingSummary2', '2016-09-28T10:00:00+08:00', '2016-09-28T11:00:00+08:00', 'q1', 'confirmed', 'description', 'edi');
// cal_app.queueForInsert('bookingSummary3', '2016-09-28T10:00:00+08:00', '2016-09-28T11:00:00+08:00', 'q1', 'confirmed', 'description', 'pax3');
// cal_app.queueForInsert('bookingSummary4', '2016-09-28T10:00:00+08:00', '2016-09-28T11:00:00+08:00', 'q2', 'confirmed', 'description', 'pax4');
// cal_app.listAvailableDurationForStartTime(new Date().addDays(0).setTime(16,00,0,0), 'fgd');
// // console.log(cal_app.listEmptySlotsInDay(new Date().setDateWithSimpleFormat('10/8/2016'), 'qc'));

// Register listeners
slimbot.on('message', message => {
  console.log('message');
  let isCommand = checkCommandList(message);
  console.log('isCommand' + isCommand);

  if (Object.keys(bookerQueue).length === 0) {
    return;
  }

  if (!isCommand) {
    completeBooking(message);
  }
});

slimbot.on('inline_query', query => {
  // do something with @bot inline query
  console.log('inline: ');
  var results = JSON.stringify([{
    'type': 'article',
    'id': 'help',
    'title': 'How to book ah?',
    'input_message_content': {
      'message_text': '/help',
      'disable_web_page_preview': true
    }
  }, {
    'type': 'article',
    'id': 'qc',
    'title': 'Queen (Combined)',
    'input_message_content': {
      'message_text': '/book_queen_combined',
      'disable_web_page_preview': true
    }
  }, {
    'type': 'article',
    'id': 'q1',
    'title': 'Queen 1',
    'input_message_content': {
      'message_text': '/book_queen_1',
      'disable_web_page_preview': true
    }
  }, {
    'type': 'article',
    'id': 'q2',
    'title': 'Queen 2',
    'input_message_content': {
      'message_text': '/book_queen_2',
      'disable_web_page_preview': true
    }
  }, {
    'type': 'article',
    'id': 'dr',
    'title': 'Drone',
    'input_message_content': {
      'message_text': '/book_drone',
      'disable_web_page_preview': true
    }
  }, {
    'type': 'article',
    'id': 'fg',
    'title': 'Focus Group Room',
    'input_message_content': {
      'message_text': '/book_fgd',
      'disable_web_page_preview': true
    }
  }]);

  slimbot.answerInlineQuery(query.id, results).then(resp => {
    console.log('answerInlineQuery');
    // console.log(results);
    // console.log(resp);
  });
});

slimbot.on('chosen_inline_result', query => {
  //whenever any inline query option is selected
  console.log('chosenanswerInlineQuery');
});

slimbot.on('callback_query', query => {
  console.log('callback');
  processCallBack(query);
});

//SessionManager listener
sessionMgr.setupEventEmitter(Emitter);

Emitter.on("sessionStateChange", function(event) {
  slimbot.editMessageText(event.userChatId, event.msgId, event.msg);
});

Emitter.on("clearUserSession", function(event) {
  clearUncompletedBookings(event.userChatId);
});
// End of listeners

function clearUserSessionInfo(userChatId) {
  console.log('clear user session data for user: ' + userChatId + '(no of uncompleted bookings: ' + Object.keys(bookerQueue).length + ' )');
  if (bookerQueue[userChatId] !== undefined) {
    delete bookerQueue[userChatId];
  }
}

function processCallBack(query) {
  let callback_data = JSON.parse(query.data);
  let daysInMonth = new Date().daysInMonth();

  if (callback_data.date === undefined) {
    promptTodayOrDateOption(callback_data.room, query, true);

  } else if (callback_data.date == 'pick_today') {
    promptTimeslotSelection(query, callback_data.room, new Date());

  } else if (callback_data.date == 'pick_date') {
    if (callback_data.month === undefined) {
      promptDateSelection(query, callback_data.room, new Date());
    } else {
      //TODO: show promptDateSelection with selected month
    }
  } else {
    //date selected
    if (callback_data.time === undefined) {
      promptTimeslotSelection(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date));

    } else if (callback_data.dur === undefined) {
      promptDurationSelection(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time);

    } else if (callback_data.description === undefined) {
      promptDescription(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time, callback_data.dur);

    }
  }
}

function checkCommandList(message) {
  let roomSelected,
      optionalParams;
  console.log(message);

  if (message.text == '/book_fgd') {
    roomSelected = 'fg';
    promptTodayOrDateOption(roomSelected, message);

  } else if (message.text == '/book_queen_1') {
    roomSelected = 'q1';
    promptTodayOrDateOption(roomSelected, message);

  } else if (message.text == '/book_queen_2') {
    roomSelected = 'q2';
    promptTodayOrDateOption(roomSelected, message);

  } else if (message.text == '/book_queen_combined') {
    roomSelected = 'qc';
    promptTodayOrDateOption(roomSelected, message);

  } else if (message.text == '/book_drone') {
    roomSelected = 'dr';
    promptTodayOrDateOption(roomSelected, message);
  }
    else if (message.text == '/book') {
    let optionalParams = {
      parse_mode: 'markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [[
          { text: 'Focus Group Room', callback_data: JSON.stringify({ room: 'fg' }) },
          { text: 'Drone Room', callback_data: JSON.stringify({ room: 'dr' }) }
        ],[
          { text: 'Queen Room 1', callback_data: JSON.stringify({ room: 'q1' }) },
          { text: 'Queen Room 2', callback_data: JSON.stringify({ room: 'q2' }) }
        ],[
          { text: 'Queen Room Combined', callback_data: JSON.stringify({ room: 'qc' }) }
        ]
        ]
      })
    };
    slimbot.sendMessage(message.chat.id, Text.book, optionalParams);
  } else if (message.text == '/booked' && message.chat.type == 'group') {
    slimbot.sendMessage(message.chat.id, Text.private);

  } else if (message.text == '/exit') {
    console.log('/exit current booking');
    sessionMgr.terminateSession(message.chat.id);

  } else if (message.text == `/help@${botName}` || message.text == '/help') {
    slimbot.sendMessage(message.chat.id, Text.help, { parse_mode: 'Markdown' });

  } else if (message.chat.type == 'private') {
    if (message.text == '/start') {
      slimbot.sendMessage(message.chat.id, Text.start, { parse_mode: 'Markdown' });

    } else if (message.text == '/help') {
      slimbot.sendMessage(message.chat.id, Text.help, { parse_mode: 'Markdown' });

    } else if (message.text == '/booked') {
      let fullname = message.from.first_name + ' ' + message.from.last_name;
      let searchQuery = '@' + message.chat.username + ' (' + fullname + ')';
      checkUserBookings(message, searchQuery);

    } else {
      return false;
    }
  } else {
    return false;
  }
  return true;
}

//booked command
function checkUserBookings(message, searchQuery) {
  cal_app.listBookedEventsByUser(new Date(), searchQuery)
  .then(bookings => {
    if (!bookings.length) {
      slimbot.sendMessage(message.chat.id, Text.noBooking, { parse_mode: 'Markdown' });
    } else {
      let count = 0;
      let msg = '';
      console.log(bookings);
      for (let key in bookings) {
        count++;
        let booking = bookings[key];
        msg += '-------------------------------\n';
        let details = booking.summary.split(' by ');

        msg += bookingsReplyBuilder(count, details[0], booking.location, booking.start.dateTime, booking.end.dateTime, details[1]);
        msg += '/deleteBooking@' + booking.id + '\n';
        msg = msg.replace("_", "-"); //escape _ cuz markdown cant handle it
      }
      var reply = 'You have the following bookings scheduled: \n' + msg;
      slimbot.sendMessage(message.chat.id, reply, { parse_mode: 'Markdown' });
    }
  });
}

//Step 1 - Today or Date
function promptTodayOrDateOption(roomSelectedId, query, hasPrevMsg) {
  console.log('/' + roomSelectedId);
  let optionalParams = paramBuilder.getTodayOrDateOptions(roomSelectedId);
  let msg = replyBuilder.askForDate(roomlist[roomSelectedId]);
  if (hasPrevMsg) {
    slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
  } else {
    slimbot.sendMessage(query.chat.id, msg, optionalParams)
    .then(message => {
      sessionMgr.startSessionCountdown(message.result.chat.id, message.result.message_id, message.result.chat.username);
    });
  }
}

function promptDateSelection(query, room, startDate) {
  let msg = 'You have selected:\n' + '*' + roomlist[room] + '*' + '\n\nPlease select a date in ' + new Date().getCurrentMonthNamed() + ':';

  slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, paramBuilder.getDateSelection(room));
}

//Step 2 - Timeslot
function promptTimeslotSelection(query, room, startDate) {
  let startDateStr = startDate.getISO8601DateWithDefinedTime(8, 0, 0, 0);

  cal_app.listEmptySlotsInDay(startDateStr, room)
  .then(jsonArr => {
    console.log("json: " + jsonArr);
    let msg = replyBuilder.askForTime(roomlist[room], startDate);

    slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, paramBuilder.getTimeslots(jsonArr,room, startDate));
  })
  .catch(err => {
    console.log('Error promptTimeslotSelection: ' + JSON.stringify(err));
    slimbot.editMessageText(query.message.chat.id, query.message.message_id, Text.error);
    throw new Error('Error promptTimeslotSelection: ' + JSON.stringify(err));
  });
}

//Step 3 - Duration
function promptDurationSelection(query, room, startDate, startTime) {
  cal_app.listAvailableDurationForStartTime(startDate.getISO8601DateWithDefinedTimeString(startTime), room)
  .then(function(jsonArr) {
    console.log('promptDuration');
    //    if (Object.keys(jsonArr).length == 0){
    //    slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'I think someone just booked the timeslot following this. Please pick another starttime.');
    //        promptTimeslotSelection(query, startDate, room);
    // }
    let msg = replyBuilder.askForDuration(roomlist[room], startDate, startTime);
    slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, paramBuilder.getDuration(jsonArr, room, startDate, startTime));

  }, function(err) {
    console.log('Error promptDurationSelection: ' + JSON.stringify(err));
    slimbot.editMessageText(query.message.chat.id, query.message.message_id, Text.error);
  });
}

//Step 4 - Booking Description
function promptDescription(query, room, startDate, startTime, duration) {
  let msg = replyBuilder.askForDescription(roomlist[room], startDate, startTime, cal_app.getDurationOptionNameWithId(duration));
  // var msg = 'You have selected:\n*' + roomlist[room] + '* >> *' +
  //     startDate.getFormattedDate() + '* >> *' +
  //     startTime + '* >> \n*' +
  //     cal_app.getDurationOptionNameWithId(duration) + '*\nPlease enter below and describe what you are booking the room for?';

  slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, paramBuilder.getBackButton(room, startDate, startTime, duration))
    .then(message => {
      console.log(message);
      let bot_id = message.result.chat.id;
      bookerQueue[query.from.id] = {
        id: bot_id,
        chatType: query.message.chat.type,
        msgid: query.message.message_id,
        name: query.from.username,
        date: startDate.getSimpleDate(),
        room: room,
        time: startTime,
        dur: duration,
        lastUpdated: new Date()
      };
      console.log(bookerQueue);
    });
}

//Step 5 - Confirm Booking Complete
function completeBooking(query) {
  if (bookerQueue[query.from.id] === undefined) {
    return;
  }
  //TODO: input validation before sending to gcal. _ wouldnt work properly

  let booking = bookerQueue[query.from.id];

  if (booking.chatType == query.chat.type) {
    let summary = query.text;
    let fullname = query.from.first_name + ' ' + query.from.last_name;

    insertBookingIntoCalendar(booking.id, booking.msgid, summary, booking.room,
      new Date().setDateWithSimpleFormat(booking.date), booking.time, booking.dur, booking.name, fullname);
  }
}

function insertBookingIntoCalendar(userId, msgId, description, room, startDate, timeSlot, duration, userName, fullName) {
  let bookingSummary = '[' + roomlist[room] + '] ' + description + ' by @' + userName + ' (' + fullName + ')';
  console.log(bookingSummary);
  let startTime = startDate.getISO8601DateWithDefinedTimeString(timeSlot);
  for (let i = 0; i < duration; i++) {
    startDate.addMinutes(30);
  }
  let endTime = startDate.getISO8601TimeStamp();

  cal_app.queueForInsert(bookingSummary, startTime, endTime, room, "confirmed", "booked via butler", userName)
    .then(json => {
      slimbot.editMessageText(userId, msgId, Text.confirm);
      let msg = replyBuilder.bookingConfirmed(roomlist[room], startDate.getFormattedDate(), new Date(json.start).getFormattedTime(), new Date(json.end).getFormattedTime(), fullName, userName, description);

      slimbot.sendMessage(userId, msg, { parse_mode: 'Markdown' })
      .then(message => {
        msg = 'Check out this link for the overall room booking schedules: ' + json.htmlLink;
        slimbot.sendMessage(userId, msg);
      });
      sessionMgr.closeSession(userId);

    }).catch(err => {
      console.log('Error insertBookingIntoCalendar: ' + JSON.stringify(err));
      slimbot.editMessageText(userId, msgId, Text.tooLate);
      throw err;
    });
}

//Exit Booking
function replyCancelBookProcess(query) {
  slimbot.editMessageText(query.from.id, query.message.message_id, Text.canceled, optionalParams);
}

function bookingsReplyBuilder(number, summary, room, startDate, endDate, user) {
  let reply = `Booking ${number}:\nRoom: *${room}*\nDate: *${new Date(startDate).getFormattedDate()}*\nTime: *${new Date(startDate).getFormattedTime()} - ${new Date(endDate).getFormattedTime()}*\nBy: *${user}*\nDescription: ${summary}\n`;
  return reply;
}

module.exports = slimbot;