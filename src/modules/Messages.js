const MESSAGES = {
	start: `Allo!💁 To get started, type:\n\n*/help* in a private chat - for more info on how to book a room;\n*/any* book any available meeting room at a time of your choosing;\n*/book* to start booking from a list of rooms available;\n*/exit* terminate current booking process;\n*/booked* in a private chat - for list of rooms you have booked;\n*/delete* in a private chat - delete a booking;\n*/view* see all bookings in hive.\n\nThank you for using SweeZharBot™! If got problem please don't come and find Viviean thank you velly much 😛`,
	help: `Type:\n\n*/any* book any available meeting room at a time of your choosing;\n*/book* to start booking from a list of rooms available;\n*/exit* terminate current booking process;\n*/booked* in a private chat - for list of rooms you have booked;\n*/delete* in a private chat - delete a booking;\n*/view* see all bookings in hive.\n\nThank you for using SweeZharBot™! If got problem please don't come and find Viviean thank you velly much 😛`,
	unrecognisedCommands: `I don't understand your command, try using valid commands listed in /help menu.`,
	book: `Which room would you like to book?`,
	view: 'Check out this link for the overall room booking schedules: https://sgtravelbot.com',
	delete: `You have successfully deleted your booking`,
	deleteErr: `Oops, something went wrong while deleting your booking.`,
	deleteInstruction: `\nClick on the following command to delete your booking: \n`,
	listBooking: `You have the following bookings scheduled: \n`,
	noBooking: `You don\'t have any upcoming room bookings 😧. \n\nYou won't be able to see your bookings through /booked command if you've manually booked through the admins. \nIf so, try checking your booking with /view instead :)`,
	noBookingAfterDelete: `Okay, you\'ve got more no upcoming room bookings liao. `,
	error: `Oops sorry ah, I think something spoil aledi.. you don\'t mind try again later ok? 😅`,
	confirm: `Swee lah! Your room booking is confirmed! 👍🏻`,
	tooLate: `Oh no 😱, I think your room kena snatched away by someone else. Maybe next time you try faster hand faster leg ok?`,
	private: `Please check your bookings in a private chat with me 😉`,
	canceled: `Cancelled your booking process. To check your current bookings type /booked.`,
	session_expired: 'Ehh you took too long to book. I wait until fed up! 😡😡😡\n\nTry restarting your booking session with /book or /any again.',
	session_terminated: '😢 I just cancelled your booking... you want to try again?',
	session_outdated: 'This booking session has expired. \nPlease refer to the latest booking message.',
	unauthenticated: 'You are not authorized to use this bot yet. Please reach out to bot admins.',
	notBookedByMe: '\nThis room is not booked by you. Please contact @chanyan or @Doriskeith for more information.\n'
};

export { MESSAGES as default };
