//TelegramBot

require('./Date');
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env['TELEGRAM_TOKEN_TEST']);
console.log(process.env['TELEGRAM_TOKEN_TEST']);
let cal_app = require('./CalendarApp');
let botName;

slimbot.getMe().then(update => {
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
let activeUsers = {};

console.log('bot started on ' + new Date().getFormattedTime());

// cal_app.queueForInsert('bookingSummary', '2016-09-28T10:00:00+08:00', '2016-09-28T12:00:00+08:00', 'qc', 'confirmed', 'description', 'shekyh');

// cal_app.queueForInsert('bookingSummary2', '2016-09-28T10:00:00+08:00', '2016-09-28T11:00:00+08:00', 'q1', 'confirmed', 'description', 'edi');
// cal_app.queueForInsert('bookingSummary3', '2016-09-28T10:00:00+08:00', '2016-09-28T11:00:00+08:00', 'q1', 'confirmed', 'description', 'pax3')
// ;
// cal_app.queueForInsert('bookingSummary4', '2016-09-28T10:00:00+08:00', '2016-09-28T11:00:00+08:00', 'q2', 'confirmed', 'description', 'pax4');
// cal_app.listAvailableDurationForStartTime(new Date().addDays(0).setTime(16,00,0,0), 'fgd');
// // console.log(cal_app.listEmptySlotsInDay(new Date().setDateWithSimpleFormat('10/8/2016'), 'qc'));

// Register listeners
slimbot.on('message', message => {
  console.log('message');
  let isCommand = checkCommandList(message);
  console.log('isCommand' + isCommand);

  if (Object.keys(bookerQueue).length == 0) {
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
// End of listeners

function processCallBack(query) {
  var callback_data = JSON.parse(query.data);
  var daysInMonth = new Date().daysInMonth();

  if (callback_data.date == undefined) {
    promptTodayOrDateOption(callback_data.room, query, true);

  } else if (callback_data.date == 'pick_today') {
    promptTimeslotSelection(query, callback_data.room, new Date());

  } else if (callback_data.date == 'pick_date') {
    if (callback_data.month == undefined) {
      promptDateSelection(query, callback_data.room, new Date());
    } else {
      //TODO: show promptDateSelection with selected month
    }
  } else {
    //date selected
    if (callback_data.time == undefined) {
      promptTimeslotSelection(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date));

    } else if (callback_data.dur == undefined) {
      promptDurationSelection(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time);

    } else if (callback_data.description == undefined) {
      promptDescription(query, callback_data.room, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.time, callback_data.dur);

    }
  }
}

function checkCommandList(message) {
  var roomSelected;
  var optionalParams;
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

  } else if (message.text == '/booked' && message.chat.type == 'group') {
    var reply = 'Please check your bookings in a private chat with me 😉';
    slimbot.sendMessage(message.chat.id, reply);

  } else if (message.text == '/cancel') {
    console.log('/cancel last booking');
    terminateSession(message.chat.id);

  } else if (message.text == `/help@${botName}` || message.text == '/help') {
    var optionalParams = { parse_mode: 'Markdown' };
    slimbot.sendMessage(message.chat.id, `Type:\n\n*@${botName}* if you want to book a room;\n\n*/booked* if you want to check your bookings;\n\n*/cancel* if you want to cancel while booking halfway.\n\nThank you for using SweeZharBot™! If got problem please don't come and find Vivieane thank you velly much 😛`, optionalParams);

  } else if (message.chat.type == 'private') {
    var optionalParams = { parse_mode: 'Markdown' };

    if (message.text == '/start') {
      var reply = `Allo!💁 To get started, type:\n\n*@${botName}* to start booking from a list of rooms available;\n*/help* in a private chat - for more info on how to book a room;\n*/booked* in a private chat - for list of rooms you have booked;\n*/cancel* during a booking - to cancel the current booking session.\n\nThank you for using SweeZharBot™! If got problem please don't come and find Vivieane thank you velly much 😛`;
      slimbot.sendMessage(message.chat.id, reply, optionalParams);

    } else if (message.text == '/help') {
      slimbot.sendMessage(message.chat.id, `Hi there, let me guide you through the steps to booking a meeting room?\n\nStart searching for rooms to book by typing *@${botName}*. \n/booked in a private chat - for list of rooms you have booked or \n/cancel during a booking - to cancel the current booking session.`, optionalParams);

    } else if (message.text == '/booked') {

      let fullname = message.from.first_name + ' ' + message.from.last_name;
      let searchQuery = '@' + message.chat.username + ' (' + fullname + ')'
      checkUserBookings(message, searchQuery);

    } else {
      return false;
    }
  } else {
    return false;
  }
  return true;
}

function checkUserBookings(message, searchQuery) {
  let optionalParams = { parse_mode: 'Markdown' };
  cal_app.listBookedEventsByUser(new Date(), searchQuery)
    .then(
      (bookings) => {

        if (bookings == []) {
          let reply = 'You don\'t have any upcoming room bookings leh 😧. You sure you got book or not?';
          slimbot.sendMessage(message.chat.id, reply, optionalParams);

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
          slimbot.sendMessage(message.chat.id, reply, optionalParams);
        }
      });
}

function startSessionCountdown(userChatId, msgId, username) {
  let sessionLength = 1000 * 30;
  terminateSession(userChatId, 'This booking session has been cancelled. \nPlease refer to the latest booking message.');
  console.log('Booking session started at ' + new Date() + ' by @' + username);

  let timer = setTimeout(
    function() {
      console.log('Session expired for : ' + username);

      let msg = "Ehh you took too long to book lah. I wait until fed up! 😡😡😡\n\nTry booking again -____-";
      expireSession(userChatId, msgId, username, msg);
    }, sessionLength);

  activeUsers[userChatId] = { userChatId: userChatId, msgId: msgId, username: username, timer: timer };
}

function expireSession(userChatId, msgId, username, msg) {
  if (userChatId != undefined && msgId != undefined) {
    slimbot.editMessageText(userChatId, msgId, msg);
  }
  clearUncompletedBookings(userChatId);
}

function terminateSession(userChatId, msg) {
  if (activeUsers[userChatId] == undefined) {
    return;
  }

  let sess = activeUsers[userChatId];
  console.log('Session cancelled by @' + sess.username);
  clearTimeout(sess.timer);
  delete activeUsers[userChatId];

  let defaultMsg = '😢 I just cancelled your booking... you want to try again?';
  if (msg == undefined) {
    msg = defaultMsg;
  }
  expireSession(userChatId, sess.msgId, sess.username, msg);
}

function closeSession(userChatId) {
  if (activeUsers[userChatId] == undefined) {
    return;
  }

  let sess = activeUsers[userChatId];
  clearTimeout(sess.timer);
  delete activeUsers[userChatId];
  clearUncompletedBookings(userChatId);
}

function clearUncompletedBookings(userChatId) {
  console.log('clear uncomplete booking in queue: (length: ' + Object.keys(bookerQueue).length + ' )');
  if (bookerQueue[userChatId] != undefined) {
    delete bookerQueue[userChatId];
  }
}

//Step 1 - Today or Date
function promptTodayOrDateOption(roomSelectedId, query, hasPrevMsg) {
  console.log('/' + roomSelectedId);
  var optionalParams = getTodayOrDateOptions(roomSelectedId);
  var msg = replyBuilder(roomlist[roomSelectedId]);
  if (hasPrevMsg == true) {
    slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
  } else {
    slimbot.sendMessage(query.chat.id, msg, optionalParams).then(message => {
      startSessionCountdown(message.result.chat.id, message.result.message_id, message.result.chat.username);
    });
  }
}

function getTodayOrDateOptions(roomSelected) {
  return {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: 'Today', callback_data: JSON.stringify({ date: 'pick_today', room: roomSelected }) },
          { text: 'Pick a date', callback_data: JSON.stringify({ date: 'pick_date', room: roomSelected }) }
        ]
      ]
    })
  };
}

function promptDateSelection(query, room, startDate) {
  var msg = 'You have selected:\n' + '*' + roomlist[room] + '*' + '\n\nPlease select a date in ' + new Date().getCurrentMonthNamed() + ':';
  var optionalParams = {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: constructDateOptions(new Date(), room)
    })
  };

  slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
}

function constructDateOptions(date, room) {
  const btnInRow = 5;
  var count = 0;
  var days = date.daysInMonth();
  var daysLeft = days - date.getCurrentDay() + 1;
  var btnArr = [],
    row = [];

  for (var i = 1; i <= daysLeft; i++) {
    row.push({
      text: (date.getCurrentDay()) + '',
      callback_data: JSON.stringify({ date: date.getSimpleDate(), room: room })
    });
    date = date.addDays(1);
    count++;
    if (count > btnInRow) {
      btnArr.push(row);
      row = [];
      count = 0;
    }
    if (i == daysLeft) {
      btnArr.push(row);
    }
  }

  //TODO: next month & prev month button
  var back = [{
    text: '<<Back',
    callback_data: JSON.stringify({ room: room })
  }];
  btnArr.push(back);
  return btnArr;
}

//Step 2 - Timeslot
function promptTimeslotSelection(query, room, startDate) {
  var startDateStr = startDate.getISO8601DateWithDefinedTime(8, 0, 0, 0);

  cal_app.listEmptySlotsInDay(startDateStr, room)
    .then(jsonArr => {
      var msg = replyBuilder(roomlist[room], startDate);
      var optionalParams = {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: constructTimeslotOptions(jsonArr, room, startDate)
        })
      };
      slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
    })
    .catch(err => {
      console.log('Error promptTimeslotSelection: ' + JSON.stringify(err));
      slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'Oops sorry ah, I think something spoil aledi.. you don\'t mind try again later ok? 😅');
      throw new Error('Error promptTimeslotSelection: ' + JSON.stringify(err));
    });
}

function constructTimeslotOptions(availTimeJSON, room, date) {
  const btnInRow = 2;
  var count = 0;
  var row = [],
    items = [];

  for (var i in availTimeJSON) {
    var obj = {
      text: i + '',
      callback_data: JSON.stringify({ date: date.getSimpleDate(), time: availTimeJSON[i], room: room })
    };
    items.push(obj);
    count++;

    if (count >= btnInRow) {
      row.push(items);
      items = [];
      count = 0;
    }
  }
  if (count > 0) {
    row.push(items);
  }
  var back = [{
    text: '<<Back',
    callback_data: JSON.stringify({ room: room })
  }];
  row.push(back);
  return row;
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
      var msg = replyBuilder(roomlist[room], startDate, startTime);
      var optionalParams = {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: constructDurationOptions(jsonArr, room, startDate, startTime)
        })
      };
      slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);

    }, function(err) {
      console.log('Error promptDurationSelection: ' + JSON.stringify(err));
      slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'Oops sorry ah, I think something spoil aledi.. you don\'t mind try again later ok? 😅');
    });
}

function constructDurationOptions(durationJSON, room, date, startTime) {
  const btnInRow = 4;
  var count = 0;
  var row = [];
  var items = [];

  for (var i in durationJSON) {
    var obj = {
      text: durationJSON[i] + '',
      callback_data: JSON.stringify({ date: date.getSimpleDate(), time: startTime, dur: i, room: room })
    };
    items.push(obj);
    count++;

    if (count >= btnInRow) {
      row.push(items);
      items = [];
      count = 0;
    }
  }
  if (count > 0) {
    row.push(items);
  }
  var back = [{
    text: '<< Back',
    callback_data: JSON.stringify({ date: date.getSimpleDate(), room: room })
  }];
  row.push(back);
  return row;
}

//Step 4 - Booking Description
function promptDescription(query, room, startDate, startTime, duration) {
  var msg = replyBuilder(roomlist[room], startDate, startTime, cal_app.getDurationOptionNameWithId(duration));
  // var msg = 'You have selected:\n*' + roomlist[room] + '* >> *' +
  //     startDate.getFormattedDate() + '* >> *' +
  //     startTime + '* >> \n*' +
  //     cal_app.getDurationOptionNameWithId(duration) + '*\nPlease enter below and describe what you are booking the room for?';

  var optionalParams = {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: constructBackOption(room, startDate, startTime, duration)
    })
  };
  var bot_id;

  slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams)
    .then(message => {
      console.log(message);
      bot_id = message.result.chat.id;
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

function constructBackOption(room, date, startTime, duration) {
  var row = [];
  var back = [{
    text: '<< Back',
    callback_data: JSON.stringify({ room: room, date: date.getSimpleDate(), time: startTime })
  }];
  row.push(back);
  return row;
}

//Step 5 - Confirm Booking Complete
function completeBooking(query) {
  if (bookerQueue[query.from.id] == undefined) {
    return;
  }
  //TODO: input validation before sending to gcal. _ wouldnt work properly

  var booking = bookerQueue[query.from.id];

  if (booking.chatType == query.chat.type) {
    var summary = query.text;
    var fullname = query.from.first_name + ' ' + query.from.last_name;

    insertBookingIntoCalendar(booking.id, booking.msgid, summary, booking.room,
      new Date().setDateWithSimpleFormat(booking.date), booking.time, booking.dur, booking.name, fullname);
  }
}

function insertBookingIntoCalendar(userid, msgid, description, room, startDate, timeslot, duration, username, fullname) {
  var bookingSummary = '[' + roomlist[room] + '] ' + description + ' by @' + username + ' (' + fullname + ')';
  console.log(bookingSummary);
  var startTime = startDate.getISO8601DateWithDefinedTimeString(timeslot);
  for (var i = 0; i < duration; i++) {
    startDate.addMinutes(30);
  }
  var endTime = startDate.getISO8601TimeStamp();

  cal_app.queueForInsert(bookingSummary, startTime, endTime, room, "confirmed", "booked via butler", username)
    .then(json => {

      slimbot.editMessageText(userid, msgid, 'Swee lah! Your room booking is confirmed! 👍🏻');

      var msg = `#Booking confirmed ✔️\n----------------------------\nRoom: *${roomlist[room]}*\nDate: *${startDate.getFormattedDate()}*\nTime: *${new Date(json.start).getFormattedTime()} - ${new Date(json.end).getFormattedTime()}*\nBy: *${fullname}* (@${username})\nDescription: ${description}`;
      var optionalParams = { parse_mode: 'Markdown' };

      slimbot.sendMessage(userid, msg, optionalParams).then(message => {
        msg = 'Check out this link for the overall room booking schedules: ' + json.htmlLink;
        slimbot.sendMessage(userid, msg);
      });
      closeSession(userid);

    }).catch(err => {
      console.log('Error insertBookingIntoCalendar: ' + JSON.stringify(err));
      slimbot.editMessageText(userid, msgid, 'Oh no 😱, I think your room kena snatched away by someone else. Maybe next time you try faster hand faster leg ok?');
      throw err;
    });
}

//Cancel Booking
function replyCancelBookProcess(query) {
  var msg = 'Canceled your booking process. To check your current bookings type /booked.'
  slimbot.editMessageText(query.from.id, query.message.message_id, msg, optionalParams);
}

function replyBuilder(room, date, time, duration) {
  let reply;

  if (arguments.length === 1) {
    reply = `Booking Details (_Step 1 of 4_)\n----------------------------------------\nRoom: *${room}*\n\nPlease select a date for this booking:`;
  } else if (arguments.length === 2) {
    let formattedDate = date.getFormattedDate();
    if (date.getSimpleDate() === new Date().getSimpleDate()) {
      formattedDate += ' (Today)';
    }
    reply = `Booking Details (_Step 2 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\n\nPlease select a time for this booking:`;
  } else if (arguments.length === 3) {
    let formattedDate = date.getFormattedDate();
    if (date.getSimpleDate() === new Date().getSimpleDate()) {
      formattedDate += ' (Today)';
    }
    reply = `Booking Details (_Step 3 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\nTime: *${time}*\n\nPlease select a duration for this booking:`;
  } else if (arguments.length === 4) {
    let formattedDate = date.getFormattedDate();
    if (date.getSimpleDate() === new Date().getSimpleDate()) {
      formattedDate += ' (Today)';
    }
    reply = `Booking Details (_Step 4 of 4_)\n----------------------------------------\nRoom: *${room}*\nDate: *${formattedDate}*\nTime: *${time}*\nDuration: *${duration}*\n\nPlease type a brief description for your booking:`;
  }

  return reply;
}

function bookingsReplyBuilder(number, summary, room, startDate, endDate, user) {
  let reply = `Booking ${number}:\nRoom: *${room}*\nDate: *${new Date(startDate).getFormattedDate()}*\nTime: *${new Date(startDate).getFormattedTime()} - ${new Date(endDate).getFormattedTime()}*\nBy: *${user}*\nDescription: ${summary}\n`;
  return reply;
}

module.exports = slimbot;