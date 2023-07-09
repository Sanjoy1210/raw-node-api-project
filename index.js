/* 
 * Title: Uptime Monitoring Application
 * Description: A RESTFUL API to monitor up or down time of user defined links
 * Author: Sanjoy Paul
 * Data: 7/5/2023
 * 
*/

// dependencies
const http = require('http');
const {handleReqRes} = require('./helpers/handleReqRes');
const environments = require('./helpers/environments')
const { sendTwilioSms } = require('./helpers/notifications');

// app object - module scaffolding
const app = {};

// @TODO remove later
sendTwilioSms('01845201104', 'Hello World!', (err) => {
  console.log('this is the error', err);
});

// create server
app.createServer = () => {
  const server = http.createServer(app.handleReqRes);
  server.listen(environments.port, () => {
    console.log(`environment variable is ${process.env.NODE_ENV}`);
    console.log(`listening to port ${environments.port}`);
  })
}

// handle Request Response
app.handleReqRes = handleReqRes;

// start server
app.createServer();
