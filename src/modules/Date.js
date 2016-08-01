//date.js - custom functions for date object

Date.prototype.setDateWithSimpleFormat = function(dateString){
    //dateString to be in dd/mm/yyyy
    var ary = dateString.split('/');
    this.setDate(ary[0]);
    this.setMonth(ary[1] - 1);
    this.setYear(ary[2]);
    this.setHours(0,0,0,0);
    return this;
};

Date.prototype.addDays = function(d) {
    this.setDate(this.getDate() + d);
    return this;
};
Date.prototype.addMinutes = function(h) {
    this.setMinutes(this.getMinutes() + h);
    return this;
};
Date.prototype.getFormatedTime = function() {
    var timeFormatOptions = { hour: "2-digit", minute: "2-digit" };
    return this.toLocaleTimeString("en-us", timeFormatOptions);
};

Date.prototype.getFormattedDate = function() {
    var timeFormatOptions = { year: "numeric", month: "long",
    day: "numeric"};
        return this.toLocaleString("en-us", timeFormatOptions);
};

Date.prototype.getFormattedDateTime = function() {
        return this.getSimpleDate() + ', ' +this.getFormatedTime();
};

Date.prototype.getISO8601TimeStamp = function(date){
    var pad = function(amount, width) {
        var padding = "";
        while (padding.length < width - 1 && amount < Math.pow(10, width - padding.length - 1))
            padding += "0";
        return padding + amount.toString();
    }
    date = date ? date : this;
    var offset = date.getTimezoneOffset();
    return pad(date.getFullYear(), 4) + "-" + 
    pad(date.getMonth() + 1, 2) + "-" + pad(date.getDate(), 2) + 
    "T" + pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2) + ":" + 
    pad(date.getSeconds(), 2) + (offset > 0 ? "-" : "+") + 
    pad(Math.floor(Math.abs(offset) / 60), 2) + ":" + pad(Math.abs(offset) % 60, 2);

};

Date.prototype.getISO8601DateWithDefinedTime = function(hour,min,sec,ms){
    this.setHours(hour,min,sec,ms);
    return this.getISO8601TimeStamp(this);
};

Date.prototype.getISO8601DateWithDefinedTimeString = function(timeStr){
    //08:30 AM
    var tmp = timeStr.split(' ');
    var timeAry = tmp[0].split(':');

    if (tmp[1] == 'PM' && timeAry[0] < 12){
        timeAry[0] = 12 + parseInt(timeAry[0]);
    }
    this.setHours(timeAry[0],timeAry[1],0,0);
    return this.getISO8601TimeStamp(this);
};

Date.prototype.getCurrentMonthNamed = function() {
    var timeFormatOptions = { month: "long"};
    return this.toLocaleString("en-us", timeFormatOptions);
};

Date.prototype.getSimpleDate = function() {
    return this.getDate() + "/" + (this.getMonth() + 1) + "/" + this.getFullYear();
};

Date.prototype.getCurrentDay = function(){
    return this.getDate();
};
 
Date.prototype.daysInMonth= function(){ 
    var d= new Date(this.getFullYear(), this.getMonth()+1, 0);
    return d.getDate();
};
