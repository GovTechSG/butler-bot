const path = require('path');
require('dotenv').config({ path: '../.env' });

const config = {
    keyFile: require.resolve(path.join('../../config/', process.env.GOOGLE_KEYFILE_PATH)),
    serviceAcctId: process.env.SERVICE_ACCT_ID,
    timezone: 'UTC+08:00'
};
module.exports = config;
