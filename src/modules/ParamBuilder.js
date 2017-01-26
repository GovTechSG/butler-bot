export function getTodayOrDateOptions(roomSelectedId) {
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
};

export function getDateSelection(room) {
    return {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: constructDateOptions(new Date(), room)
    })
  };
};

export function getTimeslots(jsonArr, room, startDate){
    return {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: constructTimeslotOptions(jsonArr, room, startDate)
    })};
};

export function getDuration(jsonArr, room, startDate, startTime){
     return {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: constructDurationOptions(jsonArr, room, startDate, startTime)
        })
      };
};

export function getBackButton(room, startDate, startTime, duration){
  return {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: constructBackOption(room, startDate, startTime, duration)
    })
  };
};

function constructBackOption(room, date, startTime, duration) {
  let row = [];
  let back = [{
    text: '<< Back',
    callback_data: JSON.stringify({ room: room, date: date.getSimpleDate(), time: startTime })
  }];
  row.push(back);
  return row;
}

function constructTimeslotOptions(availTimeJSON, room, date) {
  const btnInRow = 2;
  let count = 0;
  let row = [],
    items = [];

  for (let i in availTimeJSON) {
    let obj = {
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
  let back = [{
    text: '<<Back',
    callback_data: JSON.stringify({ room: room })
  }];
  row.push(back);
  return row;
}

function constructDurationOptions(durationJSON, room, date, startTime) {
  const btnInRow = 4;
  let count = 0;
  let row = [];
  let items = [];

  for (let i in durationJSON) {
    let obj = {
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
  let back = [{
    text: '<< Back',
    callback_data: JSON.stringify({ date: date.getSimpleDate(), room: room })
  }];
  row.push(back);
  return row;
}

function constructDateOptions(date, room) {
  const btnInRow = 5;
  let count = 0;
  let days = date.daysInMonth();
  let daysLeft = days - date.getCurrentDay() + 1;
  let btnArr = [],
    row = [];

  for (let i = 1; i <= daysLeft; i++) {
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
  let back = [{
    text: '<<Back',
    callback_data: JSON.stringify({ room: room })
  }];
  btnArr.push(back);
  return btnArr;
}
