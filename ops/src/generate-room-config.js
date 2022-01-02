const fs = require('fs');
const calConfig = require('../generated/calendar-config.json');
const { sortCalendar } = require('./utils');

const ROOM_OPTIONS_FOR_BOOKING_FILE_LOCATION = '../config/roomsForBooking.json';
const ROOM_CONFIG_FOR_LISTING_FILE_LOCATION = '../config/roomsForListing.json';
const CAL_ID_CONFIG_FILE_LOCATION = './generated/calendarId.json';

const virtualRooms = [
    {
        displayName: 'Queen (Combined)',
        shortId: 'qc',
        location: 'L8',
        children: ['q1', 'q2'],
        capacity: '16',
        colorId: '11',
        availableForBooking: true
    }
];

// This script generates require room / calendar config files for bot usage

function generateRoomOptionsForBooking(calList) {
    const roomOptionsForBooking = {};
    calList.forEach((cal) => {
        if (!cal.availableForBooking) {
            return;
        }
        roomOptionsForBooking[cal.shortId] = {
            text: `[${cal.location}] ${cal.displayName}`,
            command: `book_${cal.shortId}`
        };
    });
    return roomOptionsForBooking;
}

function generateRoomConfigForListing(calList) {
    const roomConfigForListing = {};
    calList.forEach((cal) => {
        const capacity = cal.capacity ? ` (${cal.capacity} pax)` : '';
        roomConfigForListing[cal.shortId] = {
            name: `[${cal.location}] ${cal.displayName}${capacity}`,
            id: cal.shortId,
            children: cal.children ? cal.children : undefined
        };
    });
    return roomConfigForListing;
}


function generateCalendarIdConfig(calList) {
    const calendarIdConfig = {};
    calList.forEach((cal) => {
        calendarIdConfig[cal.shortId] = cal.calendarId;
    });
    return calendarIdConfig;
}

function generateAndWriteConfig() {
    console.log('[Generate Room Config]');

    // maintain pri cal as 1st
    const primaryCal = calConfig.shift();
    const roomList = calConfig.concat(virtualRooms);
    roomList.sort(sortCalendar);
    roomList.unshift(primaryCal);

    const roomOptionsConfig = generateRoomOptionsForBooking(roomList);
    console.log('Writing room booking option config', ROOM_OPTIONS_FOR_BOOKING_FILE_LOCATION);
    fs.writeFileSync(ROOM_OPTIONS_FOR_BOOKING_FILE_LOCATION, JSON.stringify(roomOptionsConfig));

    const roomConfig = generateRoomConfigForListing(roomList);
    console.log('Writing room listing config', ROOM_CONFIG_FOR_LISTING_FILE_LOCATION);
    fs.writeFileSync(ROOM_CONFIG_FOR_LISTING_FILE_LOCATION, JSON.stringify(roomConfig));

    const calendarIdConfig = generateCalendarIdConfig(roomList);
    console.log('Writing calendarIdConfig', CAL_ID_CONFIG_FILE_LOCATION);
    fs.writeFileSync(CAL_ID_CONFIG_FILE_LOCATION, JSON.stringify(calendarIdConfig));
}

generateAndWriteConfig();
