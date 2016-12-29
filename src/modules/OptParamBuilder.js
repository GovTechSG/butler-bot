exports.getTodayOrDateOptions = function(roomSelectedId) {
  return {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: 'Today', callback_data: JSON.stringify({ date: 'pick_today', room: roomSelectedId }) },
          { text: 'Pick a date', callback_data: JSON.stringify({ date: 'pick_date', room: roomSelectedId }) }
        ]
      ]
    })
  };
}

exports.getDateSelection = function(room) {
    return {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: constructDateOptions(new Date(), room)
    })
  };
}

exports.getTimeslots = function(jsonArr, room, startDate){
    return {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: constructTimeslotOptions(jsonArr, room, startDate)
    })};
}

exports.getDuration = function(jsonArr, room, startDate, startTime){
     return {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: constructDurationOptions(jsonArr, room, startDate, startTime)
        })
      };
}

exports.getBackButton = function(room, startDate, startTime, duration){
return   {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: constructBackOption(room, startDate, startTime, duration)
    })
  }
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