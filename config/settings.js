import dotenv from 'dotenv';
import roomOptionsForBooking from './roomsForBooking.json';
import roomsForListing from './roomsForListing.json';

dotenv.load();
const CONFIG = {
    keyFile: require.resolve(process.env.GOOGLE_KEYFILE_PATH),
    serviceAcctId: process.env.SERVICE_ACCT_ID,
    calendarUrl: process.env.CALENDAR_URL,
    calendarId: JSON.parse(process.env.CALENDAR_ID),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
};
const ROOM_CONFIG = {
    roomsOpenForBooking: roomOptionsForBooking,
    roomsListing: roomsForListing // used for insert, reading & displaying event room info
};
const SESSION_LENGTH = 1000 * 60 * 3;
const BOOKING_DURATION_OPTIONS = {		// for displaying selected duration options during booking
    1: '30 mins',
    2: '1 hour',
    3: '1.5 hours',
    4: '2 hours',
    5: '2.5 hours',
    6: '3 hours',
    7: '3.5 hours',
    8: '4 hours'
};

export { CONFIG as default, ROOM_CONFIG, SESSION_LENGTH, BOOKING_DURATION_OPTIONS };
