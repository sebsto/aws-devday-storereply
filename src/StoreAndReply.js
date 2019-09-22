"use strict";

// AWS X-Ray
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
//const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const comprehend = new AWS.Comprehend();
const translate = new AWS.Translate();
const cloudWatch = new AWS.CloudWatch();

const MESSAGES_TABLE = process.env.MESSAGES_TABLE;
const REPLY_MESSAGE = process.env.REPLY_MESSAGE;
const REPLY_LANGUAGE = process.env.REPLY_LANGUAGE;

const METRIC_NAMESPACE = process.env.METRIC_NAMESPACE;
const METRIC_DIMENSION_NAME = process.env.METRIC_DIMENSION_NAME;
const METRIC_DIMENSION_VALUE = process.env.METRIC_DIMENSION_VALUE;
const METRIC_NAME = process.env.METRIC_NAME;

// Your Business Logic

async function putMetric(value) {
    const metricData = await cloudWatch.putMetricData({
        MetricData: [
            {
                MetricName: METRIC_NAME,
                Dimensions: [
                    {
                        Name: METRIC_DIMENSION_NAME,
                        Value: METRIC_DIMENSION_VALUE
                    }
                ],
                Timestamp: new Date,
                Value: value
            }
        ],
        Namespace: METRIC_NAMESPACE
    }).promise();
    console.log(metricData);
}

class StoreAndReply {
    static async process(user, message) {
        console.log('storeAndReply ', user, message);

        if ((user == null) || (user == '')) {
            throw Error("NoUser");
        }
        if ((message == null) || (message == '')) {
            throw Error("NoMessage");
        }

        const languageData = await comprehend.detectDominantLanguage({
            Text: message
        }).promise();
        console.log(languageData);

        const lang = languageData.Languages.reduce(
            (acc, val) => {
                if (val.Score > acc.Score) { return val; } else { return acc; }
            }, { Score: 0 }).LanguageCode;

        var replyMessage;
        if (lang !== REPLY_LANGUAGE) {
            const translateData = await translate.translateText({
                SourceLanguageCode: REPLY_LANGUAGE,
                TargetLanguageCode: lang,
                Text: REPLY_MESSAGE
            }).promise();
            replyMessage = translateData.TranslatedText;
        } else {
            replyMessage = REPLY_MESSAGE;
        }

        await dynamodb.put({
            TableName: MESSAGES_TABLE,
            Item: {
                user: user,
                timestamp: Date.now(),
                lang: lang,
                message: message
            }
        }).promise();

        await putMetric(message.length);
        console.log('Processed: ', METRIC_NAMESPACE, METRIC_DIMENSION_NAME,
            METRIC_DIMENSION_VALUE, message.length);

        console.log('replyMessage: ', replyMessage);
        return replyMessage;
    }
}

module.exports = StoreAndReply;