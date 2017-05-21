import { MESSAGES } from './Messages';
const sessionLength = 1000 * 60;
let activeUsers = {};       //stores userId, lastMsgId, username, timer
let Emitter;

export function setupEventEmitter(botEventEmitter) {
	Emitter = botEventEmitter;
};

export function startSessionCountdown(userChatId, msgId, username) {
	this.terminateSession(userChatId, MESSAGES.session_outdated);    // terminate prev session; if any
	console.log('[Session Started] at ' + new Date() + ' by @' + username);

	let timer = setCountdownTimer(userChatId, msgId, username);
	activeUsers[userChatId] = { userChatId: userChatId, msgId: msgId, username: username, timer: timer };
};

export function extendSession(userChatId, msgId, username) {
	let sessObj = activeUsers[userChatId];
	if (sessObj === undefined) {
		console.log('Session not available to extend; starting new session');
		this.startSessionCountdown(userChatId, msgId, username);
		return;
	}
	console.log('[Session Extended] by @' + sessObj.username);

	clearTimeout(sessObj.timer);
	sessObj.timer = setCountdownTimer(userChatId, msgId, sessObj.username);
	sessObj.msgId = msgId;
	activeUsers[userChatId] = sessObj;
}

export function terminateSession(userChatId, msg) {
	if (activeUsers[userChatId] === undefined) {
		return;
	}

	let sessObj = activeUsers[userChatId];
	console.log('[Session Terminated] by @' + sessObj.username);
	clearTimeout(sessObj.timer);
	delete activeUsers[userChatId];

	if (msg === undefined) {
		msg = MESSAGES.session_terminated;
	}
	notifyUserAndClearUserData(userChatId, sessObj.msgId, sessObj.username, msg);
};

export function endSession(userChatId) {    //used when booking completes
	if (activeUsers[userChatId] === undefined) {
		return;
	}

	let sess = activeUsers[userChatId];
	clearTimeout(sess.timer);
	delete activeUsers[userChatId];
	popUserInfoFromSession(userChatId);
};

function setCountdownTimer(userChatId, msgId, username) {
	return setTimeout(
		function () {
			console.log('[Session Expired] for : @' + username);
			notifyUserAndClearUserData(userChatId, msgId, username, MESSAGES.session_expired);
		}, sessionLength);
}

function notifyUserAndClearUserData(userChatId, msgId, username, msg) {
	if (userChatId !== undefined && msgId !== undefined) {
		updateBotMsg(userChatId, msgId, msg);
	}
	popUserInfoFromSession(userChatId);
}

function popUserInfoFromSession(userChatId) {
	Emitter.emit('clearUserSession', { userChatId });
}

function updateBotMsg(userChatId, msgId, msg) {
	Emitter.emit('sessionStateChange', { userChatId, msgId, msg });
}
