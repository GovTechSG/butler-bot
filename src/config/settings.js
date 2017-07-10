import dotenv from 'dotenv';

dotenv.load();
const SESSION_LENGTH = 1000 * 60 * 3;
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
	roomsListing: {
		'fg': { name: 'Focus Group Room' },
		'q1': { name: 'Queen (Video)' },
		'q2': { name: 'Queen (Projector)' },
		'qc': { name: 'Queen (Combined)', children: ['q1', 'q2'] },
		'dr': { name: 'Drone' },
		'bb': { name: 'Bumblebee' }
	}
};


export { CONFIG as default, ROOM_CONFIG, SESSION_LENGTH };
