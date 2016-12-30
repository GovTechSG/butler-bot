const SESSION_EXPIRY_MSG = 'Ehh you took too long to book lah. I wait until fed up! 😡😡😡\n\nTry booking again -____-';
const SESSION_TERMINATED_DEFAULT_MSG = '😢 I just cancelled your booking... you want to try again?';
const SESSION_OUTDATED_MSG = 'This booking session has been cancelled. \nPlease refer to the latest booking message.';
const sessionLength = 1000 * 30;
let activeUsers = {};       //stores userId, lastMsgId, username, timer
let Emitter;

//TODO: fix session renew + starting point + timeout
function setupEventEmitter(botEventEmitter) {
    Emitter = botEventEmitter;
};

function startSessionCountdown(userChatId, msgId, username) {
    console.log('Booking session started at ' + new Date() + ' by @' + username);

    this.terminateSession(userChatId, SESSION_OUTDATED_MSG);

    let timer = setTimeout(
        function () {
            console.log('Session expired for : @' + username);
            expireSession(userChatId, msgId, username, SESSION_EXPIRY_MSG);
        }, sessionLength);

    activeUsers[userChatId] = { userChatId: userChatId, msgId: msgId, username: username, timer: timer };
};

function terminateSession(userChatId, msg) {
    if (activeUsers[userChatId] === undefined) {
        return;
    }

    let sessObj = activeUsers[userChatId];
    console.log('Session cancelled by @' + sessObj.username);
    clearTimeout(sessObj.timer);
    delete activeUsers[userChatId];

    if (msg === undefined) {
        msg = SESSION_TERMINATED_DEFAULT_MSG;
    }
    expireSession(userChatId, sessObj.msgId, sessObj.username, msg);
};

function closeSession(userChatId) {
    if (activeUsers[userChatId] === undefined) {
        return;
    }

    let sess = activeUsers[userChatId];
    clearTimeout(sess.timer);
    delete activeUsers[userChatId];
    popUserInfoFromSession(userChatId);
};

function expireSession(userChatId, msgId, username, msg) {
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

const SessionMgr = {
    setupEventEmitter: setupEventEmitter,
    startSessionCountdown: startSessionCountdown,
    terminateSession: terminateSession,
    closeSession: closeSession
}

export { SessionMgr };