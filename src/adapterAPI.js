"use strict";

const StoreAndReply = require('./StoreAndReply');

// Event wrapper for Amazon API Gateway

exports.handler = async (event, context) => {

    function buildResponse(replyMessage) {
        console.log(context);
        const responseBody = {
            message: replyMessage,
            version: 'a'
        };
        const response = {
            statusCode: 200,
            headers: {
              'Content-Type' : 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(responseBody)
        };
        console.log('response: ' + JSON.stringify(response));
        return response;
    }

    console.log('request: ' + JSON.stringify(event));

    let user;
    let message;
    if (event.queryStringParameters) {
        user = event.queryStringParameters.user;
        message = event.queryStringParameters.message;
    }

    return buildResponse(await StoreAndReply.process(user, message));
};
