// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
var azure = require('azure-sb');
var Promise = require('bluebird');
var util = require("util");
let challengeAppInsights = require('applicationinsights');
var request = require('request');

// Let's validate and spool the ENV VARS
if (process.env.SERVICEBUSCONNSTRING.length == 0) {
  console.log("The environment variable SERVICEBUSCONNSTRING has not been set");
} else {
  console.log("The environment variable SERVICEBUSCONNSTRING is " + process.env.SERVICEBUSCONNSTRING);
}

if (process.env.PROCESSENDPOINT.length == 0) {
  console.log("The environment variable PROCESSENDPOINT has not been set");
} else {
  console.log("The environment variable PROCESSENDPOINT is " + process.env.PROCESSENDPOINT);
}

if (process.env.SERVICEBUSQUEUENAME.length == 0) {
  console.log("The environment variable SERVICEBUSQUEUENAME has not been set");
} else {
  console.log("The environment variable SERVICEBUSQUEUENAME is " + process.env.SERVICEBUSQUEUENAME);
}

if (process.env.TEAMNAME.length == 0) {
  console.log("The environment variable TEAMNAME has not been set");
} else {
  console.log("The environment variable TEAMNAME is " + process.env.TEAMNAME);
}

if (process.env.CHALLENGEAPPINSIGHTS_KEY.length == 0) {
  console.log("The environment variable CHALLENGEAPPINSIGHTS_KEY has not been set");
} else {
  console.log("The environment variable CHALLENGEAPPINSIGHTS_KEY is " + process.env.CHALLENGEAPPINSIGHTS_KEY);
}

// Start
var source = process.env.SOURCE;
var connectionString = process.env.SERVICEBUSCONNSTRING;
var queueName = process.env.SERVICEBUSQUEUENAME;
var processendpoint = process.env.PROCESSENDPOINT;
var challengeInsightsKey = process.env.CHALLENGEAPPINSIGHTS_KEY;
var teamname = process.env.TEAMNAME;

if (challengeInsightsKey != "") {
  challengeAppInsights.setup(challengeInsightsKey).start();
}

var printEvent = function (event, sbService) {
  var jj = JSON.parse(event.body);
  console.log('Event Received: ' + event.body);
  var orderId = jj.order;
  console.log('Extracted order id is: ' + orderId)
  // Set the headers
  var headers = {
    'Content-Type': 'application/json'
  };

  if (processendpoint != "") {
    // Configure the request
    var options = {
      url: processendpoint,
      method: 'POST',
      headers: headers,
      json: {
        'OrderId': orderId
      }
    };

    // Start the request
    console.log('attempting to POST order to fulfill api: ' + processendpoint);
    request(options, function (error, response, body) {
      console.log('statusCode:', response && response.statusCode);
      console.log('error:', error);
      console.log('body:', body);

      // Acknowledge the message if we don't have errors
      if (!error) {
        sbService.deleteMessage(event, function (deleteError){
          if(!deleteError){
              // Message deleted
          }
        });

        var item = {
          name: "ServiceBusListener: - Team Name " + teamname,
          properties: {
            team: teamname,
            challenge: "4-eventlistener",
            type: "servicebus",
            service: "servicebuslistener",
            orderId: orderId
          }
        };
      
        try {
          console.log("tracking event:" +item.name)
          let challengeAppclient = challengeAppInsights.defaultClient;
          challengeAppclient.trackEvent(item);
          
        } catch (e) {
          console.error("ChallengeAppInsights " + e.message);
        }
      }
    });
  } // we have a process endpoint
  else {
    console.log('process endpoint not configured at PROCESSENDPOINT');
  }
};

function checkForMessages(sbService, queueName, callback) {
  sbService.receiveQueueMessage(queueName, { isPeekLock: true }, function (err, message) {
    if (err) {
      //console.log('No messages');
    } else {
      callback(message, sbService);
    }
  });
}

console.log('Connecting to ' + connectionString + ' queue ' + queueName);
var client = azure.createServiceBusService(connectionString);
client.createQueueIfNotExists(queueName, function (err) {
  if (err) {
   console.log('Failed to create queue: ', err);
  } else {
    setInterval(checkForMessages.bind(null, client, queueName, printEvent), 5000);
  }
});