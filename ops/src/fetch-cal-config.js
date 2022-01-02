const fs = require('fs');
const CalendarAPI = require('node-google-calendar');
const config = require('./config');
const { sortCalendar } = require('./utils');

const calApi = new CalendarAPI(config);
const CONFIG_OUTPUT_FILE_LOCATION = './generated/calendar-config.json';

// This script fetches all calendars from gcal account and generates config file for szb

function parseCalList(calList) {
    let configList = [];
    calList.items.forEach((cal) => {
        const metadata = JSON.parse(cal.description);
        const location = cal.summary.split('] ')[0].replace(/[\[\]]/g, '');
        const displayName = cal.summary.split('] ')[1].trim();
        const shortId = metadata.shortId ? metadata.shortId : '';
        const capacity = metadata.capacity ? metadata.capacity : '';
        const colorId = cal.colorId ? cal.colorId : '';
        const notForBooking = metadata.NotForBooking ? metadata.NotForBooking : false;
        const calConfig = {
            calendarId: cal.id,
            displayName,
            shortId,
            location,
            capacity,
            colorId,
            availableForBooking: !notForBooking
        };
        configList.push(calConfig);
    });
    return configList;
}

function fetchCalendarConfig() {
    console.log('[Fetch Calendar Config]');
    const calList = calApi.CalendarList.list({ maxResults: 100, showHidden: true })
        .then((resp) => {
            const configList = parseCalList(resp);
            configList.sort(sortCalendar);

            console.log('Writing cal config output', CONFIG_OUTPUT_FILE_LOCATION);
            fs.writeFileSync(CONFIG_OUTPUT_FILE_LOCATION, JSON.stringify(configList));
        }).catch((err) => {
            console.log(err.message);
        });
}

fetchCalendarConfig();
