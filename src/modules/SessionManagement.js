import MESSAGES from './Messages';
import { SESSION_LENGTH as sessionLength } from '../../config/settings';

let activeUsers = {};       // stores userId, lastMsgId, username, timer
let Emitter;

class SessionManagement {
	constructor(botEventEmitter) {
		this.Emitter = botEventEmitter;
	}

	startSessionCountdown(userChatId, msgId, username) {
		this.terminateSession(userChatId, MESSAGES.session_outdated);    // terminate prev session; if any
		console.log(`[Session Started] at ${new Date()} by @${username}`);

		let timer = this.setCountdownTimer(userChatId, msgId, username);
		activeUsers[userChatId] = { userChatId: userChatId, msgId: msgId, username: username, timer: timer };
		return activeUsers;
	}

	extendSession(userChatId, msgId, username) {
		let sessObj = activeUsers[userChatId];
		if (sessObj === undefined) {
			console.log('Session not available to extend; starting new session');
			this.startSessionCountdown(userChatId, msgId, username);
			return;
		}
		console.log(`[Session Extended] by @${sessObj.username}`);

		clearTimeout(sessObj.timer);
		sessObj.timer = this.setCountdownTimer(userChatId, msgId, sessObj.username);
		sessObj.msgId = msgId;
		activeUsers[userChatId] = sessObj;
	}

	terminateSession(userChatId, msg) {
		if (activeUsers[userChatId] === undefined) {
			return;
		}

		let sessObj = activeUsers[userChatId];
		console.log(`[Session Terminated] by @${sessObj.username}`);
		clearTimeout(sessObj.timer);
		delete activeUsers[userChatId];

		if (msg === undefined) {
			msg = MESSAGES.session_terminated;
		}
		this.notifyUserAndClearUserData(userChatId, sessObj.msgId, sessObj.username, msg);
	}

	endSession(userChatId) {    // used when booking completes
		if (activeUsers[userChatId] === undefined) {
			return;
		}

		let sess = activeUsers[userChatId];
		clearTimeout(sess.timer);
		delete activeUsers[userChatId];
		this.popUserInfoFromSession(userChatId);
	}

	setCountdownTimer(userChatId, msgId, username) {
		return setTimeout(
			() => {
				console.log(`[Session Expired] for : @${username}`);
				this.notifyUserAndClearUserData(userChatId, msgId, username, MESSAGES.session_expired);
			}, sessionLength);
	}

	notifyUserAndClearUserData(userChatId, msgId, username, msg) {
		if (userChatId !== undefined && msgId !== undefined) {
			this.updateBotMsg(userChatId, msgId, msg);
		}
		this.popUserInfoFromSession(userChatId);
	}

	popUserInfoFromSession(userChatId) {
		this.Emitter.emit('clearUserSession', { userChatId });
	}

	updateBotMsg(userChatId, msgId, msg) {
		this.Emitter.emit('sessionStateChange', { userChatId, msgId, msg });
	}
}
export default SessionManagement;
