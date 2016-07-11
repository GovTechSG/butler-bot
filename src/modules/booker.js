//Test slimbot

require('./date.js');
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env['TELEGRAM_TOKEN']);
console.log(process.env['TELEGRAM_TOKEN']);
 
// Register listeners 

console.log('bot started on ' + new Date()); 
console.log('daysInMonth: ' + new Date().daysInMonth(new Date('0/1/2016')));
 
slimbot.on('message', message => {
	console.log(message);
	checkCommandList(message);
	
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
		console.log('answer');
		console.log(results);
	  console.log(resp);
	});
});

slimbot.on('chosen_inline_result', query => {

});


slimbot.on('callback_query', query => {
	console.log('callback');

	console.log(query);


	var msg = 'You have selected: ';
	if (query.data == 'pick_today'){
		msg += ' Today (' + new Date().getSimpleDate() + ')';

	} else if (query.data == 'pick_date') {
		msg = 'Please select a date in ' + new Date().getCurrentMonth();
	}else{
		//list out avail time
	}

	var optionalParams = {
	  parse_mode: 'Markdown',
	  reply_markup: JSON.stringify({
	   	inline_keyboard: [[
	      { text: '1', callback_data: '{type:true,date:1-2-2015}' },
	      { text: '2', callback_data: '2' }
	    ],
	    [
	      { text: '3', callback_data: '3' },
	      { text: '4', callback_data: '4' }
	    ]]
	  })
	};
	slimbot.editMessageText(query.message.chat.id, query.message.message_id, msg, optionalParams);
	//
});


function checkCommandList(message){ 

	var optionalParams = {
	  parse_mode: 'Markdown',
	  reply_markup: JSON.stringify({
	   	inline_keyboard: [[
	      { text: 'Today', callback_data: 'pick_today' },
	      { text: 'Pick a date', callback_data: 'pick_date' }
	    ]]
	  })
	};

	if (message.text == '/book_fgd'){ 
		slimbot.sendMessage(message.chat.id,'When would you like to book the *Focus Group Discussion Room*?',optionalParams).then(message =>{
			console.log('sent msg'); 
		});
	}else if (message.text == '/book_queen_1'){
		slimbot.sendMessage(message.chat.id,'When would you like to book the Queen Room 1?',optionalParams);
	}else if (message.text == '/book_queen_2'){
		slimbot.sendMessage(message.chat.id,'When would you like to book the Queen Room 2?',optionalParams);
	}else if (message.text == '/book_queen_combined'){
		slimbot.sendMessage(message.chat.id,'When would you like to book the Queen Room (Combined)?',optionalParams);
	}else if (message.text == '/book_drone'){
		slimbot.sendMessage(message.chat.id,'When would you like to book the Drone Room?',optionalParams);
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

 
// Call API 
 
slimbot.startPolling();