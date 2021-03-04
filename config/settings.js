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
		'ko': { 'command': '/book_cc', 'text': '[L7] Kopi-O' },
		'kc': { 'command': '/book_kp', 'text': '[L7] Kopi-C' },
		'hl': { 'command': '/book_kg', 'text': '[L7] Horlick' },
		'ml': { 'command': '/book_ml', 'text': '[L7] Milo (Boardroom)' },
		'fg': { 'command': '/book_fg', 'text': '[L8] FGD' },
		'dr': { 'command': '/book_dr', 'text': '[L8] Drone' },
		'bb': { 'command': '/book_bb', 'text': '[L8] Bumblebee' },
		'q1': { 'command': '/book_q1', 'text': '[L8] Queen (Video)' },
		'q2': { 'command': '/book_q2', 'text': '[L8] Queen (Projector)' },
		'qc': { 'command': '/book_qc', 'text': '[L8] Queen (Combined)' },
		'tt': { 'command': '/book_tt', 'text': '[L9] Tutu Kueh' },
		'mc': { 'command': '/book_mc', 'text': '[L9] Muah Chee' },
		'ak': { 'command': '/book_ak', 'text': '[L9] Ang Ku Kueh' },
		'sk': { 'command': '/book_sk', 'text': '[L9] Soon Kueh' },
		'zk': { 'command': '/book_zk', 'text': '[L9] Zui Kueh' }
	},
	roomsListing: { // used for insert, reading & displaying event room info
		'primary': { name: 'Open Space [Level 8]', id: 'primary' },
		'th': { name: 'Teh [Level 7] (4 pax)', id: 'th' },
		'ko': { name: 'Kopi-O [Level 7] (4 pax)', id: 'ko' },
		'kc': { name: 'Kopi-C [Level 7] (4 pax)', id: 'kc' },
		'hl': { name: 'Horlick [Level 7] (6 pax)', id: 'hl' },
		'ml': { name: 'Milo [Level 7] (Boardroom)', id: 'ml' },
		'fg': { name: 'Focus Group Room [Level 8] (12 pax)', id: 'fg', colour: 5 },
		'q1': { name: 'Queen (Video) [Level 8] (8 pax)', id: 'q1', colour: 6 },
		'q2': { name: 'Queen (Projector) [Level 8] (8 pax)', id: 'q2', colour: 10 },
		'qc': { name: 'Queen (Combined) [Level 8] (16 pax)', id: 'qc', children: ['q1', 'q2'], colour: 11 },
		'dr': { name: 'Drone [Level 8] (8 pax)', id: 'dr', colour: 7 },
		'bb': { name: 'Bumblebee [Level 8] (6 pax)', id: 'bb', colour: 3 },
		'tt': { name: 'Tutu Kueh [Level 9] (8 pax)', id: 'tt' },
		'mc': { name: 'Muah Chee [Level 9] (6 pax)', id: 'mc' },
		'ak': { name: 'Ang Ku Kueh [Level 9] (12 pax)', id: 'ak' },
		'sk': { name: 'Soon Kueh [Level 9] (8 pax)', id: 'sk' },
		'zk': { name: 'Zui Kueh [Level 9] (8 pax)', id: 'zk' }
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
