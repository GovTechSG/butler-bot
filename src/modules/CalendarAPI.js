const Promise = require('bluebird');
const requestWithJWT = Promise.promisify(require('google-oauth-jwt').requestWithJWT());
const qs = require('querystring');

class CalendarAPI {

  constructor(config) {
    this._USERID = config.userId;
    this._JWT = {
      email: config.serviceAcctId,
      keyFile: config.keyFile,
      scopes: ['https://www.googleapis.com/auth/calendar']
    };
    this._TIMEZONE = "UTC+08:00";
  }

  _request(params) {
    // todo: need better validation
    if (params === undefined) {
      throw new Error('Missing argument; query terms needed');
    }

    let options = {
      url: 'https://www.googleapis.com/calendar/v3/calendars/' + this._USERID + '/events',
      jwt: this._JWT,
      qs: params,
      useQuerystring: true
    };
    return requestWithJWT(options);
  }

  /**
   * Returns a promise that list all events on calendar during selected period.
   *
   * @param {string} startDateTime (optional) - start datetime of event in 2016-04-29T14:00:00+08:00 format
   * @param {string} endDateTime (optional) - end datetime of event in 2016-04-29T18:00:00+08:00 format
   */
  listEvents(startDateTime, endDateTime, query) {
    let params;
    if (startDateTime !== undefined && endDateTime !== undefined) {
      params = { timeMin: startDateTime, timeMax: endDateTime, q: query };
    }

    return this._request(params).then(resp => {

        if (resp.statusCode !== 200) {
          throw new Error(resp.statusCode + ':\n' + resp.body);
        };
        let body = JSON.parse(resp.body);
        return body.items;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   * Insert an event on the user's primary calendar. Returns promise of details of booking
   *
   * @param {string} bookingSummary - Name to be specified in calendar event summary
   * @param {string} startDateTime - start datetime of event in 2016-04-29T14:00:00+08:00 format
   * @param {string} endDateTime - end datetime of event in 2016-04-29T18:00:00+08:00 format
   * @param {string} location - Location description of event
   * @param {string} status - event status - confirmed, tentative, cancelled; tentative for all queuing
   */
  insertEvent(bookingSummary, startDateTime, endDateTime, location, status, description, colour) {
    let event = {
      "start": {
        "dateTime": startDateTime
      },
      "end": {
        "dateTime": endDateTime
      },
      "location": location,
      "summary": bookingSummary,
      "status": status,
      "description": description,
      "colorId": colour,
    };

    let options = {
      method: 'POST',
      url: 'https://www.googleapis.com/calendar/v3/calendars/' + this._USERID + '/events',
      json: true,
      body: event,
      jwt: this._JWT
    };

    return requestWithJWT(options).then(resp => {

        if (resp.statusCode !== 200) {
          throw new Error(resp.statusCode + ':\n' + resp.body);
        };
        return resp;

      })
      .catch(err => {
        throw err;
      });
  }

  deleteEvent(eventId) {
    if (eventId === undefined) {
      throw new Error('Missing argument; need to pass in eventId');
    }

    return requestWithJWT({
        method: 'DELETE',
        url: 'https://www.googleapis.com/calendar/v3/calendars/' + this._USERID + '/events/' + eventId,
        jwt: this._JWT
      }).then(resp => {

        if (resp.statusCode !== 204) {
          throw new Error(resp.statusCode + ':\n' + resp.body);
        }
        return resp;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   * Checks if queried calendar slot is busy during selected period.
   * Returns promise of list of events at specified slot.
   *
   * @param {string} startDateTime - start datetime of event in 2016-04-29T14:00:00+08:00 format
   * @param {string} endDateTime - end datetime of event in 2016-04-29T18:00:00+08:00 format
   */
  checkTimeslotBusy(startDateTime, endDateTime) {
    let event = {
      "timeMin": startDateTime,
      "timeMax": endDateTime,
      "timeZone": this._TIMEZONE,
      "items": [{ "id": this._USERID }]
    };

    let options = {
      method: 'POST',
      url: 'https://www.googleapis.com/calendar/v3/freeBusy',
      json: true,
      body: event,
      jwt: this._JWT
    };

    return requestWithJWT(options).then(resp => {
        return resp.body.calendars[this._USERID].busy;
      })
      .catch(err => {
        throw err;
      });
    }
}

module.exports = CalendarAPI;