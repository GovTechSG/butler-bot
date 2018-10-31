//date.js - custom extended functions for date object
//TODO: change from extending to wrapper class

Date.prototype.setDateWithSimpleFormat = function (dateString) {
	//dateString to be in dd/mm/yyyy
	let ary = dateString.split('/');
	return new Date(ary[2], ary[1] - 1, ary[0], 0, 0, 0, 0);
};

Date.prototype.setDateWithGoogleRecurEventISO8601Format = function (dateString) {
	let year = dateString.slice(0, 4);
	let month = dateString.slice(4, 6);
	let day = dateString.slice(6, 8);
	let time = dateString.split('T')[1];
	time = `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4)}`;
	this.setDateWithSimpleFormat(`${day}/${month}/${year}`);
	let newDate = new Date(`${year}-${month}-${day}T${time}`);
	this.setTime(newDate.getHours(), newDate.getMinutes(), newDate.getSeconds(), newDate.getMilliseconds());
	return this;
};

Date.prototype.setTime = function (hr, min, sec, ms) {
	this.setHours(hr, min, sec, ms);
	return this;
};

Date.prototype.addDays = function (d) {
	this.setDate(this.getDate() + d);
	return this;
};

Date.prototype.addMinutes = function (h) {
	this.setMinutes(this.getMinutes() + h);
	return this;
};

Date.prototype.rounddownToNearestHalfHour = function () {
	let currentMin = this.getMinutes();
	if (currentMin === 0) {
		return this;
	} else if (currentMin < 30) {
		this.setMinutes(0);
	} else if (currentMin <= 59) {
		this.setMinutes(30);
	}
	return this;
};

Date.prototype.roundupToNearestHalfHour = function () {
	let currentMin = this.getMinutes();
	if (currentMin === 0) {
		return this;
	} else if (currentMin <= 30) {
		this.setMinutes(30);
	} else if (currentMin <= 59) {
		this.setMinutes(currentMin + (60 - currentMin));
	}
	return this;
};

Date.prototype.isDateToday = function () {
	let today = new Date().getSimpleDate();
	return today === this.getSimpleDate();
};

Date.prototype.getFormattedTime = function () {
	let timeFormatOptions = { hour: '2-digit', minute: '2-digit' };
	return this.toLocaleTimeString('en-us', timeFormatOptions);
};

Date.prototype.getFormattedDate = function () {
	let timeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
	return this.toLocaleString('en-us', timeFormatOptions);
};

Date.prototype.getFormattedDateTime = function () {
	return this.getFormattedDate() + ', ' + this.getFormattedTime();
};

Date.prototype.getISO8601TimeStamp = function (date) {
	let pad = function (amount, width) {
		let padding = '';
		while (padding.length < width - 1 && amount < Math.pow(10, width - padding.length - 1)) {
			padding += '0';
		}
		return padding + amount.toString();
	};
	date = date ? date : this;
	let offset = date.getTimezoneOffset();
	return pad(date.getFullYear(), 4) + '-' +
		pad(date.getMonth() + 1, 2) + '-' + pad(date.getDate(), 2) +
		'T' + pad(date.getHours(), 2) + ':' + pad(date.getMinutes(), 2) + ':' +
		pad(date.getSeconds(), 2) + (offset > 0 ? '-' : '+') +
		pad(Math.floor(Math.abs(offset) / 60), 2) + ':' + pad(Math.abs(offset) % 60, 2);
};

Date.prototype.getISO8601DateWithDefinedTime = function (hour, min, sec, ms) {
	this.setHours(hour, min, sec, ms);
	return this.getISO8601TimeStamp(this);
};

Date.prototype.getISO8601DateWithDefinedTimeString = function (timeStr) {
	// e.g 08:30 AM
	var tmp = timeStr.split(' ');
	var timeAry = tmp[0].split(':');

	if (tmp[1] === 'PM' && timeAry[0] < 12) {
		timeAry[0] = 12 + parseInt(timeAry[0]);
	}
	this.setHours(timeAry[0], timeAry[1], 0, 0);
	return this.getISO8601TimeStamp(this);
};

Date.prototype.getCurrentMonthNamed = function () {
	let timeFormatOptions = { month: 'long' };
	return this.toLocaleString('en-us', timeFormatOptions);
};

Date.prototype.getSimpleDate = function () {
	return this.getDate() + '/' + (this.getMonth() + 1) + '/' + this.getFullYear();
};

Date.prototype.getCurrentDay = function () {
	return this.getDate();
};

Date.prototype.daysInMonth = function () {
	let d = new Date(this.getFullYear(), this.getMonth() + 1, 0);
	return d.getDate();
};

Date.prototype.getMinuteDiff = function (timeCompared) {
	var timeDiff = Math.abs(timeCompared.getTime() - this.getTime());
	var minDiff = Math.ceil(timeDiff / 60000);
	return minDiff;
};

Date.prototype.getDayNameInWeek = function () {
	let weekdayNames = {
		0: 'SU',
		1: 'MO',
		2: 'TU',
		3: 'WE',
		4: 'TH',
		5: 'FR',
		6: 'SA'
	};
	return weekdayNames[this.getDay()];
};

Date.prototype.getNumOfDaysDiffInWeekForDayNames = function () {
	let weekdayNames = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
	let today = new Date(this);

	weekdayNames[today.getDayNameInWeek()] = 0;
	for (let i = 1; i < Object.keys(weekdayNames).length; i++) {
		let date = today.addDays(1);
		weekdayNames[date.getDayNameInWeek()] = i;
	}
	return weekdayNames;
};
