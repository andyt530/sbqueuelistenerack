// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
var EventHubClient = require('azure-event-hubs').Client;
var Promise = require('bluebird');
var util = require("util");
let appInsights = require('applicationinsights');
var request = require('request');

// Let's validate and spool the ENV VARS
if (process.env.EVENTHUBCONNSTRING.length == 0) {
  console.log("The environment variable EVENTHUBCONNSTRING has not been set");
} else {
  console.log("The environment variable EVENTHUBCONNSTRING is " + process.env.EVENTHUBCONNSTRING);
}

if (process.env.EVENTHUBPATH.length == 0) {
  console.log("The environment variable EVENTHUBPATH has not been set");
} else {
  console.log("The environment variable EVENTHUBPATH is " + process.env.EVENTHUBPATH);
}

if (process.env.PROCESSENDPOINT.length == 0) {
  console.log("The environment variable PROCESSENDPOINT has not been set");
} else {
  console.log("The environment variable PROCESSENDPOINT is " + process.env.PROCESSENDPOINT);
}

if (process.env.TEAMNAME.length == 0) {
  console.log("The environment variable TEAMNAME has not been set");
} else {
  console.log("The environment variable TEAMNAME is " + process.env.TEAMNAME);
}

// Start
var source = process.env.SOURCE;
var connectionString = process.env.EVENTHUBCONNSTRING;
var eventHubPath = process.env.EVENTHUBPATH;
var processendpoint = process.env.PROCESSENDPOINT;
var insightsKey = "23c6b1ec-ca92-4083-86b6-eba851af9032";
var teamname = process.env.TEAMNAME;

if (insightsKey != "") {
  appInsights.setup(insightsKey).start();
}

// The Event Hubs SDK can also be used with an Azure IoT Hub connection string.
// In that case, the eventHubPath variable is not used and can be left undefined.

var body = "";

var printError = function (err) {
  console.error(err.message);
};


var printEvent = function (ehEvent) {
  var jj = JSON.stringify(ehEvent.body);
  console.log('Event Received: ' + jj);
  var orderId = ehEvent.body.order;

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

      }
    });
  } // we have a process endpoint
  else {
    console.log('process endpoint not configured at PROCESSENDPOINT');
  }

  try {
    let appclient = appInsights.defaultClient;
    appclient.trackEvent({
      name: "EventHubListener: - Team Name " + teamname,
      properties: {
        team: teamname,
        challenge: "4-eventlistener",
        type: "eventhub"
      }
    });

  } catch (e) {
    console.error("AppInsights " + e.message);
  }

};

var client = EventHubClient.fromConnectionString(connectionString, eventHubPath);
var receiveAfterTime = Date.now() - 5000;

// Create a receiver per partition
client.open()
  .then(client.getPartitionIds.bind(client))
  .then(function (partitionIds) {
    return Promise.map(partitionIds, function (partitionId) {
      return client.createReceiver('$Default', partitionId, {
        'startAfterTime': receiveAfterTime
      }).then(function (receiver) {
        receiver.on('errorReceived', printError);
        receiver.on('message', printEvent);
      });
    });
  })
  .catch(printError);