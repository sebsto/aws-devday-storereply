"use strict";

const StoreAndReply = require('./StoreAndReply');

// Event wrapper for Amazon SQS

exports.handler = async (event, context) => {

    function buildResponse(message) {
        const response = {
            message: message
        };
        console.log(JSON.stringify(response));
    }

    console.log('event: ' + JSON.stringify(event));

    const records = event.Records;

    for(let record of records) {
        const jsonRecord = JSON.parse(record.body);
        buildResponse(await StoreAndReply.process(jsonRecord.user, jsonRecord.message));
    }

    return {};
};
