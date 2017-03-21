const CONFIG = {
    keyFile: require.resolve(process.env.GOOGLE_KEYFILE_PATH),
    userId: process.env.USER_ID,
    serviceAcctId: process.env.SERVICE_ACCT_ID,
    calendarUrl: process.env.CALENDAR_URL,
    calendarId: JSON.parse(process.env.CALENDAR_ID)
};

export { CONFIG };
