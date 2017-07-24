import dotenv from 'dotenv';

dotenv.load();
const CONFIG = {
	keyFile: require.resolve(process.env.GOOGLE_KEYFILE_PATH),
	userId: process.env.USER_ID,
	serviceAcctId: process.env.SERVICE_ACCT_ID,
	calendarUrl: process.env.CALENDAR_URL,
	calendarId: JSON.parse(process.env.CALENDAR_ID),
	telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
};
const ROOM_CONFIG = {
	roomsOpenForBooking: {
		'fg': { 'command': '/book_fgd', 'text': 'Focus Group Room' },
		'qc': { 'command': '/book_queen_combined', 'text': 'Queen Room Combined' },
		'q1': { 'command': '/book_queen_video', 'text': 'Queen (Video)' },
		'q2': { 'command': '/book_queen_projector', 'text': 'Queen (Projector)' }
	},
	roomsListing: {						// used for insert, reading & displaying event room info
		'primary': { name: 'Open Space', id: 'primary' },
		'fg': { name: 'Focus Group Room', id: 'fg', colour: 5 },
		'q1': { name: 'Queen (Video)', id: 'q1', colour: 6 },
		'q2': { name: 'Queen (Projector)', id: 'q2', colour: 10 },
		'qc': { name: 'Queen (Combined)', id: 'qc', children: ['q1', 'q2'], colour: 11 },
		'dr': { name: 'Drone', id: 'dr', colour: 7 },
		'bb': { name: 'Bumblebee', id: 'bb', colour: 3 }
	}
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
