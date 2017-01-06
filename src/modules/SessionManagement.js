const SESSION_EXPIRY_MSG = 'Ehh you took too long to book lah. I wait until fed up! 😡😡😡\n\nTry booking again -____-';
const SESSION_TERMINATED_DEFAULT_MSG = '😢 I just cancelled your booking... you want to try again?';
const SESSION_OUTDATED_MSG = 'This booking session has been cancelled. \nPlease refer to the latest booking message.';
const sessionLength = 1000 * 30;
let activeUsers = {};       //stores userId, lastMsgId, username, timer
let Emitter;

//TODO: fix session renew + starting point + timeout
export function setupEventEmitter(botEventEmitter) {
    Emitter = botEventEmitter;
};

export function startSessionCountdown(userChatId, msgId, username) {
    console.log('Booking session started at ' + new Date() + ' by @' + username);

    this.terminateSession(userChatId, SESSION_OUTDATED_MSG);    //terminate prev session; if any

    let timer = setTimeout(
        function () {
            console.log('Session expired for : @' + username);
            notifyUserAndClearUserData(userChatId, msgId, username, SESSION_EXPIRY_MSG);
        }, sessionLength);

    activeUsers[userChatId] = { userChatId: userChatId, msgId: msgId, username: username, timer: timer };
};

export function extendSession(userChatId, msgId) {
    let sessObj = activeUsers[userChatId];
    console.log('Session extended by @' + sessObj.username);

    clearTimeout(sessObj.timer);
    sessObj.timer = setTimeout(
        function () {
            console.log('Session expired for : @' + sessObj.username);
            notifyUserAndClearUserData(userChatId, msgId, sessObj.username, SESSION_EXPIRY_MSG);
        }, sessionLength);

    activeUsers[userChatId] = sessObj;
}

export function terminateSession(userChatId, msg) {
    if (activeUsers[userChatId] === undefined) {
        return;
    }

    let sessObj = activeUsers[userChatId];
    console.log('Session terminated by @' + sessObj.username);
    clearTimeout(sessObj.timer);
    delete activeUsers[userChatId];

    if (msg === undefined) {
        msg = SESSION_TERMINATED_DEFAULT_MSG;
    }
    notifyUserAndClearUserData(userChatId, sessObj.msgId, sessObj.username, msg);
};

export function endSession(userChatId) {
    if (activeUsers[userChatId] === undefined) {
        return;
    }

    let sess = activeUsers[userChatId];
    clearTimeout(sess.timer);
    delete activeUsers[userChatId];
    popUserInfoFromSession(userChatId);
};

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
