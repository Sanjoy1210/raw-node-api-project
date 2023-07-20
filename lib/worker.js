/* 
 * Title: Workers library
 * Description: Worker related files
 * Author: Sanjoy Paul
 * Data: 7/10/2023
 * 
*/

// dependencies
const data = require('./data');
const { parseJSON } = require('../helpers/utilities');
const url = require('url');
const http = require('http');
const https = require('https');
const { sendTwilioSms } = require('../helpers/notifications');

// worker object - module scaffolding
const worker = {};

// perform check
worker.performCheck = (originalCheckData) => {
  // prepare the initial check outcome
  let checkOutcome = {
    'error': false,
    'responseCode': false,
  };

  // mark the outcome has not been sent yet
  let outcomeSent = false;

  // parse the hostname & full url from original data
  const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  // construct the request
  const requestDetails = {
    protocol: originalCheckData.protocol + ':',
    hostname,
    path,
    method: originalCheckData.method.toUpperCase(),
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

  let req = protocolToUse.request(requestDetails, (res) => {
    // grab the status of the response
    const status = res.statusCode;

    // update the check outcome and pass to the next process
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('error', (err) => {
    checkOutcome = {
      'error': true,
      'value': err,
    };
    // update the check outcome and pass to the next process
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('timeout', (err) => {
    checkOutcome = {
      'error': true,
      'value': 'timeout',
    };
    // update the check outcome and pass to the next process
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // req send
  req.end();
};

// save check outcome to database and send to next process
worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // check if check outcome is up or down
  let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  // decide whether we should alert the user or not
  let alertWanted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  // update the check data
  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // update the check to disk
  data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWanted) {
        // send the check data to next process
        worker.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Alert is not needed as there is no state change');
      }
    } else {
      console.log('Error trying to save the check data of one of the checks');
    }
  })
};

// send notification sms to user if state changes
worker.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;

  sendTwilioSms(newCheckData.phone, msg, (err) => {
    if (!err) {
      console.log(`User was alerted to a status change via SMS: ${msg}`);
    } else {
      console.log('There was a problem sending sms to one of the user');
    }
  });
}

// validate individual checks data
worker.validateCheckData = (originalCheckData) => {
  const originalData = originalCheckData;
  if (originalCheckData && originalCheckData.id) {
    originalData.state = typeof originalCheckData.state === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';

    originalData.lastChecked = typeof originalCheckData.lastChecked === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // pass to the next process
    worker.performCheck(originalData);
  } else {
    console.log('Error: check was invalid or not properly formatted!');
  }
};

// lookup all the checks
worker.gatherAllChecks = () => {
  // get all the checks
  data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach(check => {
        // read the check data
        data.read('checks', check, (err2, originalCheckData) => {
          if (!err2 && originalCheckData) {
            // pass the data to the check validator
            worker.validateCheckData(parseJSON(originalCheckData));
          } else {
            console.log('Error: reading one of the checks data!');
          }
        });
      });
    } else {
      console.log(`Error: Could not find any checks to process!`);
    }
  });
};

// timer to execute the worker process once per minute
worker.loop = () => {
  setInterval(() => {
    worker.gatherAllChecks();
  }, 8000);
};

// start the worker
worker.init = () => {
  // execute all the checks
  worker.gatherAllChecks();

  // call the loop so that checks continue
  worker.loop();
};

// export
module.exports = worker;
