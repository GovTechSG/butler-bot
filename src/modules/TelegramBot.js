//Test slimbot

require('./Date');
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env['TELEGRAM_TOKEN_2']);
console.log(process.env['TELEGRAM_TOKEN_2']);
var cal_app = require('./CalendarApp');

 var startListeningForInputs = false;
 var bookerQueue = {};
// Register listeners

console.log('bot started on ' + new Date().getFormattedDateTime());

slimbot.on('message', message => {
	console.log(message);
	checkCommandList(message);
	if (startListeningForInputs){
		completeBooking(message);
	}

});

slimbot.on('inline_query', query => {
  // do something with query
  console.log('inline: ');
  console.log(query);
  var results = JSON.stringify([{
  	'type': 'article',
  	'id': 'help',
  	'title': 'Hey Butler! How do I book a room?',
  	'input_message_content': {
  		'message_text': '/help',
  		'disable_web_page_preview': true
  	}
   },
   {
  	'type': 'article',
  	'id': 'queen-combined',
  	'title': 'Queen (Combined)',
  	'input_message_content': {
  		'message_text': '/book_queen_combined',
  		'disable_web_page_preview': true
  	}
  },
  {
  	'type': 'article',
  	'id': 'queen-1',
  	'title': 'Queen 1',
  	'input_message_content': {
  		'message_text': '/book_queen_1',
  		'disable_web_page_preview': true
  	}
  },
  {
  	'type': 'article',
  	'id': 'queen-2',
  	'title': 'Queen 2',
  	'input_message_content': {
  		'message_text': '/book_queen_2',
  		'disable_web_page_preview': true
  	}
  },
  {
  	'type': 'article',
  	'id': 'drone',
  	'title': 'Drone',
  	'input_message_content': {
  		'message_text': '/book_drone',
  		'disable_web_page_preview': true
  	}
  },
  {
  	'type': 'article',
  	'id': 'fgd',
  	'title': 'Focus Group Room',
  	'input_message_content': {
  		'message_text': '/book_fgd',
  		'disable_web_page_preview': true
  	}
  }
  ]);

slimbot.answerInlineQuery(query.id, results).then(resp => {
		console.log('answerInlineQuery');
		console.log(results);
	  console.log(resp);
	});
});

slimbot.on('chosen_inline_result', query => {
	console.log('chosenanswerInlineQuery');
});


slimbot.on('callback_query', query => {

	console.log('callback');
	console.log(query);
	var callback_data = JSON.parse(query.data);


	var daysInMonth = new Date().daysInMonth();
	if (callback_data.date == 'pick_today'){
		replyTimeslotOptions(query, new Date(), callback_data.room);
	} else if (callback_data.date == 'pick_date') {
		replyDateOptions(query, new Date(), callback_data.room);
	}else{
		//date selected
		if (callback_data.date != undefined && callback_data.time == undefined){

 			console.log('selected date: ' + new Date().setDateWithSimpleFormat(callback_data.date).getSimpleDate());
			//list out avail time
			replyTimeslotOptions(query, new Date().setDateWithSimpleFormat(callback_data.date), callback_data.room);
		}else{

			if (callback_data.description == undefined){
				var bot_id;
				var msg = 'You have selected: \n' + callback_data.room + ' @ ' + callback_data.date + ' ' + callback_data.time + '\n';
				slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg + 'Please describe what you are booking the room for?')
					.then(message => {
	  					console.log(message);
	  					bot_id = message.result.chat.id;
		  				startListeningForInputs = true;
						bookerQueue[query.from.id] = {id: bot_id, msgid: query.message.message_id, name: query.from.username, date: callback_data.date, room: callback_data.room, time:callback_data.time};
						console.log(bookerQueue);
					});

			}else{
				slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'Done! Your room is booked :)');
			}

		}
	}
});


function clearUncompletedBookings(msg){
	console.log('current booking queue: ' + Object.keys(bookerQueue).length);
	if (bookerQueue[msg.from.id] != undefined){
		delete bookerQueue[msg.from.id];
	}
}

function completeBooking(query){
console.log('completebooking');
	if (bookerQueue[query.from.id] != undefined){
		var booking = bookerQueue[query.from.id];
		var summary = query.text;
		var fullname = query.from.first_name + ' ' + query.from.last_name ;

		insertBookingIntoCalendar(booking.id, booking.msgid, summary, new Date().setDateWithSimpleFormat(booking.date), booking.time, booking.room, booking.name, fullname);
		delete bookerQueue[query.from.id];
		if (Object.keys(bookerQueue).length == 0){
			startListeningForInputs = false;
		}
	}
}

function insertBookingIntoCalendar(userid, msgid, description, startDate, timeslot, room, username, fullname){
	var bookingSummary = '[' + room + '] ' + description + ' by @' + username + ' (' + fullname + ')';
	console.log(bookingSummary);
	var startTime = startDate.getISO8601DateWithDefinedTimeString(timeslot);
	var endTime = startDate.addMinutes(30).getISO8601TimeStamp();
	console.log(startTime);
	console.log(endTime);
	console.log(userid);
	console.log(msgid);;

	cal_app.insertEvent(bookingSummary, startTime, endTime, room, "confirmed", "booked via butler")
        .then(function(json) {
            //success
            console.log(json);
            slimbot.editMessageText(userid, msgid, 'Done! Your room booking is confirmed!');
            var msg = 'Booking Summary: \n' + json.summary + '\nStart: ' + new Date(json.start).getFormattedDateTime() + '\nEnd: ' + new Date(json.end).getFormattedDateTime();

			slimbot.sendMessage(userid, msg).then(message => {
				msg = 'Check out this link for the overall room booking schedules: ' + json.htmlLink;
				slimbot.sendMessage(userid, msg);
			});

        }, function(err) {
            //failed
            console.log('Error insertEvent: ' + JSON.stringify(err));
            slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'Oh dear, something went wrong while booking your room. Sorry, Please try again!');
        });
}

function replyDateOptions(query, startDate, room){
	var msg = 'Please select a date in ' + new Date().getCurrentMonthNamed();
	var optionalParams = {
	  parse_mode: 'Markdown',
	  reply_markup: JSON.stringify({
	   	inline_keyboard: constructDateOptions(new Date(), room)
	  })
	};

	slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
}

function constructDateOptions(date, room){
	const btnInRow = 5;
	var days = date.daysInMonth();
	var daysLeft = days - date.getCurrentDay() + 1;
	var count =0;
	var btnArr = [];
	var row = [];
	for (var i =1; i<= daysLeft ; i++){
		row.push({ text: (date.getCurrentDay()) + '',
			callback_data: JSON.stringify({date: date.getSimpleDate() , room: room })
		});
		date = date.addDays(1);
		count++;
		if (count > btnInRow){
			btnArr.push(row);
			row = [];
			count = 0;
		}
		if (i == daysLeft){
			btnArr.push(row);
		}
	}
	return btnArr;
}

function replyTimeslotOptions(query, startDate, room){
	var startDateStr = startDate.getISO8601DateWithDefinedTime(8,0,0,0);
	console.log('startDateStr: ' + startDateStr);

	cal_app.listEmptySlotsInDay(startDateStr, room)
        .then(function(jsonArr) {

            var msg = 'Select a time from ';
            if (startDate.getSimpleDate() == new Date().getSimpleDate()){
            	msg += 'Today (' + startDate.getSimpleDate() + ')';
            }else{
            	msg += startDate.getFormattedDate();
            }

            var optionalParams = {
			  parse_mode: 'Markdown',
			  reply_markup: JSON.stringify({
			   	inline_keyboard: constructTimeslotOptions(jsonArr, startDate, room)
			  })
			};
			slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);

        }, function(err) {
            console.log('Error listEvent: ' + JSON.stringify(err));
			slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'Unfortunately I ran into some issues booking your room. Please try again.');
        });
}

function constructTimeslotOptions(availTimeJSON, date, room){
	const btnInRow = 2;
	var count = 0;
	var row = [];
	var items = [];

	for (var i in availTimeJSON){
		var obj = {	text: i+ '',
					callback_data: JSON.stringify({date: date.getSimpleDate() ,time: availTimeJSON[i] , room: room })
				};
		items.push(obj);
		count++;

		if (count >= btnInRow){
			row.push(items);
			items = [];
			count = 0;
		}
	}
	if (count > 0){
		row.push(items);
	}
	return row;
}



function checkCommandList(message){
	var roomSelected;
	var optionalParams;
	console.log(message);

	if (message.text == '/book_fgd'){
		roomSelected = 'fgd';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Focus Group Discussion Room*?',optionalParams).then(message =>{
			console.log('sent msg');
		});
		clearUncompletedBookings(message);

	}else if (message.text == '/book_queen_1'){
		roomSelected = 'queen-1';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Queen Room 1*?',optionalParams);
		clearUncompletedBookings(message);

	}else if (message.text == '/book_queen_2'){
		roomSelected = 'queen-2';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Queen Room 2*?',optionalParams);
		clearUncompletedBookings(message);

	}else if (message.text == '/book_queen_combined'){
		roomSelected = 'queen-combined';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Queen Room (Combined)*?',optionalParams);
		clearUncompletedBookings(message);

	}else if (message.text == '/book_drone'){
		roomSelected = 'drone';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Drone Room*?',optionalParams);
		clearUncompletedBookings(message);

	}else if (message.text == '/help' || message.text == '/help@hive_butler_bot'){
		var optionalParams = { parse_mode: 'Markdown' };
		slimbot.sendMessage(message.chat.id,'Hi there, let me guide you through the steps to booking a meeting room?');
		slimbot.sendMessage(message.chat.id,'Start searching for rooms to book by typing *@hive_butler_bot*',optionalParams);
		clearUncompletedBookings(message);

	}else if (message.chat.type == 'private') {
		var reply = 'Hi Sir/Mdm! Try /help command for more info on how to book a room. ';
		slimbot.sendMessage(message.chat.id, reply).then(message => {
	  		console.log(message);
		});
	}
}

function getDateSelectionOptions(roomSelected){
	return {
	  parse_mode: 'Markdown',
	  reply_markup: JSON.stringify({
	   	inline_keyboard: [[
	      { text: 'Today', callback_data: JSON.stringify({date: 'pick_today', room: roomSelected }) },
	      { text: 'Pick a date', callback_data:  JSON.stringify({date: 'pick_date', room: roomSelected }) }
	    ]]
	  })
	};
}

module.exports = slimbot;