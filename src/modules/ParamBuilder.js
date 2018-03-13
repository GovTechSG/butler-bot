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

export function getTimeslots(jsonArr, room, startDate) {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: constructTimeslotOptions(jsonArr, room, startDate)
		})
	};
};

export function getDuration(jsonArr, room, startDate, startTime) {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: constructDurationOptions(jsonArr, room, startDate, startTime)
		})
	};
};

export function getBackButton(room, startDate, startTime, duration) {
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

export function constructTimeslotOptions(availTimeJSON, room, date) {
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
};

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
	const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const btnInRow = 7;
	let count = 1;
	let days = 28;
	let btnArr = [], row = [];
	date = date.addDays(1);

	for (let i = 0; i < weekdays.length; i++) {
		row.push({
			text: weekdays[i] + '',
			callback_data: ' '
		});
		count++;
		if (count > btnInRow) {
			btnArr.push(row);
			row = [];
			count = 1;
		}
	}

	for (let i = 0; i < date.getDay(); i++) {
		row.push({
			text: ' ',
			callback_data: ' '
		});
		count++;
		days--;
	}

	for (let i = 1; i <= days; i++) {
		row.push({
			text: (date.getCurrentDay()) + '',
			callback_data: JSON.stringify({ date: date.getSimpleDate(), room: room })
		});
		date = date.addDays(1);
		count++;
		if (count > btnInRow) {
			btnArr.push(row);
			row = [];
			count = 1;
		}
		if (i == days) {
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

export function constructRoomOptions(roomConfig) {
	let btnInRow = 2;
	let count = 1;
	let btnArr = [];
	let row = [];

	for (let key in roomConfig) {
		if (roomConfig.hasOwnProperty(key)) {
			row.push(
				{
					text: roomConfig[key].text,
					callback_data: JSON.stringify({ room: key })
				}
			);
			count++;
			if (count > btnInRow) {
				btnArr.push(row);
				row = [];
				count = 1;
			}
		}
	}
	if (count > 1) {
		btnArr.push(row);
	}
	return btnArr;
}

export function approveRegistree(userId) {
	return [
		[{ text: 'User', callback_data: JSON.stringify({ action: 'manage_users', role: 'user', userId }) },
		{ text: 'Admin', callback_data: JSON.stringify({ action: 'manage_users', role: 'admin', userId }) }]
	];
}
