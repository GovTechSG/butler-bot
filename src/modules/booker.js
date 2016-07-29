//Test slimbot

require('./date.js');
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env['TELEGRAM_TOKEN']);
console.log(process.env['TELEGRAM_TOKEN']);
var cal_app = require('./cal-app.js');
 
 var startListeningForInputs = false;
 var bookerQueue = {};
// Register listeners 

console.log('bot started on ' + new Date().getFormattedDate());

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
	var msg = 'You have selected: ';
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
				slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'May I ask what you are booking the room for?');	
				startListeningForInputs = true;
				bookerQueue[query.from.id] = {id: query.from.id, name: query.from.username, date: callback_data.date, room: callback_data.room, time:callback_data.time};
				console.log({id: query.from.id, name: query.from.username, date: callback_data.date, room: callback_data.room, time:callback_data.time});
				console.log(bookerQueue);
			}else{
				slimbot.editMessageText(query.message.chat.id, query.message.message_id, 'Done! Your room is booked :)');		
			}
			
		}
	}
});

function handleRoomBooking(query, date, room, startTime){
	  cal_app.insertEvent("Chapter Meeting", "2016-05-27T14:00:00+08:00", "2016-05-27T17:00:00+08:00", "drone", "confirmed", "")
        .then(function(json) {
            //success
            console.log(json);
        }, function(err) {
            //failed
            console.log('Error insertEvent: ' + JSON.stringify(err));
        });
}

function completeBooking(query){

	if (bookerQueue[query.from.id] != undefined){
		var booking = bookerQueue[query.from.id];
		//TODO: complete booking
		console.log(booking);
	}
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
	console.log(btnArr);
	return btnArr;
}

function replyTimeslotOptions(query, startDate, room){
	var startDateStr = startDate.getISO8601DateWithDefinedTime(8,0,0,0); 
	console.log('startDateStr: ' + startDateStr); 

	cal_app.listEmptySlotsInDay(startDateStr, room)
        .then(function(jsonArr) {
        	console.log('listed');

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

	if (message.text == '/book_fgd'){ 
		roomSelected = 'fgd';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Focus Group Discussion Room*?',optionalParams).then(message =>{
			console.log('sent msg'); 
		});
	}else if (message.text == '/book_queen_1'){
		roomSelected = 'queen-1';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Queen Room 1*?',optionalParams);

	}else if (message.text == '/book_queen_2'){
		roomSelected = 'queen-2';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Queen Room 2*?',optionalParams);

	}else if (message.text == '/book_queen_combined'){
		roomSelected = 'queen-combined';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Queen Room (Combined)*?',optionalParams);
		
	}else if (message.text == '/book_drone'){
		roomSelected = 'drone';
		optionalParams = getDateSelectionOptions(roomSelected);
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Drone Room*?',optionalParams);
		
	}else if (message.text == '/help' || message.text == '/help@hive_butler_bot'){
		var optionalParams = { parse_mode: 'Markdown' };
		slimbot.sendMessage(message.chat.id,'Hi there, let me guide you through the steps to booking a meeting room?');
		slimbot.sendMessage(message.chat.id,'Start searching for rooms to book by typing *@hive_butler_bot*',optionalParams);

	}else if (message.chat.type == 'private') {
		var reply = 'Hi there! Try /help command for more info on how to book a room. ';
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
 
// Call API 
 
slimbot.startPolling();