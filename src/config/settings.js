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
		// used for reading & displaying event room info
		'primary': { name: 'Open Space', id: 'primary' },
		'fg': { name: 'Focus Group Room', id: 'fg' },
		'q1': { name: 'Queen (Video)', id: 'q1' },
		'q2': { name: 'Queen (Projector)', id: 'q2' },
		'qc': { name: 'Queen (Combined)', id: 'qc', children: ['q1', 'q2'] },
		'dr': { name: 'Drone', id: 'dr' },
		'bb': { name: 'Bumblebee', id: 'bb' }
	}
};


export { CONFIG as default, ROOM_CONFIG, SESSION_LENGTH };
