const axios = require('axios');
const log = require('loglevel');
const colors = require('colors');

function handleError(error) {
    const {
        config: {
            url,
        },
        response: {
            status,
            data: body,
        },
    } = error;

    log.error(colors.red(`Error requesting ${url}, reason: ${body.errorMessage}`));

    return {
        status,
        body,
    };
}

function handleSuccess(success) {
    const {
        config: {
            url,
        },
        status,
        data: body,
    } = success;

    if (body.status === false) {
        log.error(colors.red(`Error requesting ${url}, reason: ${body.errorMessage}`));
    }

    return {
        status,
        body,
    };
}

async function makeRequest(options) {
    return axios(options).then(handleSuccess).catch(handleError);
}

module.exports = {
    makeRequest,
};
