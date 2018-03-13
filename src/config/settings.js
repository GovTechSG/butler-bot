import dotenv from 'dotenv';

dotenv.load();
const CONFIG = {
	keyFile: require.resolve(process.env.GOOGLE_KEYFILE_PATH),
	serviceAcctId: process.env.SERVICE_ACCT_ID,
	calendarUrl: process.env.CALENDAR_URL,
	calendarId: JSON.parse(process.env.CALENDAR_ID),
	telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
};
const ROOM_CONFIG = {
	roomsOpenForBooking: {
		'th': { 'command': '/book_th', 'text': '[L7] Teh' },
		'fg': { 'command': '/book_fg', 'text': '[L8] FGD' },
		'ko': { 'command': '/book_cc', 'text': '[L7] Kopi-O' },
		'kg': { 'command': '/book_kg', 'text': '[L8] King' },
		'kc': { 'command': '/book_kp', 'text': '[L7] Kopi-C' },
		'dr': { 'command': '/book_dr', 'text': '[L8] Drone' },
		'hl': { 'command': '/book_kg', 'text': '[L7] Horlick' },
		'bb': { 'command': '/book_bb', 'text': '[L8] Bumblebee' },
		'ml': { 'command': '/book_ml', 'text': '[L7] Milo (Boardroom)' },
		'q1': { 'command': '/book_q1', 'text': '[L8] Queen (Video)' },
		'qc': { 'command': '/book_qc', 'text': '[L8] Queen (Combined)' },
		'q2': { 'command': '/book_q2', 'text': '[L8] Queen (Projector)' }
	},
	roomsListing: {						// used for insert, reading & displaying event room info
		'th': { name: 'Teh [Level 7]', id: 'th' },
		'ko': { name: 'Kopi-O [Level 7]', id: 'ko' },
		'kc': { name: 'Kopi-C [Level 7]', id: 'kc' },
		'hl': { name: 'Horlick [Level 7]', id: 'hl' },
		'ml': { name: 'Milo (Boardroom) [Level 7]', id: 'ml' },
		'primary': { name: 'Open Space [Level 8]', id: 'primary' },
		'fg': { name: 'Focus Group Room [Level 8]', id: 'fg', colour: 5 },
		'q1': { name: 'Queen (Video) [Level 8]', id: 'q1', colour: 6 },
		'q2': { name: 'Queen (Projector) [Level 8]', id: 'q2', colour: 10 },
		'qc': { name: 'Queen (Combined) [Level 8]', id: 'qc', children: ['q1', 'q2'], colour: 11 },
		'dr': { name: 'Drone [Level 8]', id: 'dr', colour: 7 },
		'bb': { name: 'Bumblebee [Level 8]', id: 'bb', colour: 3 },
		'kg': { name: 'King [Level 8]', id: 'kg' }
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
