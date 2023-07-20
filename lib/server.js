/* 
 * Title: Server library
 * Description: Server related files
 * Author: Sanjoy Paul
 * Data: 7/10/2023
 * 
*/

// dependencies
const http = require('http');
const { handleReqRes } = require('../helpers/handleReqRes');
const environments = require('../helpers/environments');

// server object - module scaffolding
const server = {};

// create server
server.createServer = () => {
  const createServerVariable = http.createServer(server.handleReqRes);
  createServerVariable.listen(environments.port, () => {
    console.log(`listening to port ${environments.port}`);
  });
};

// handle Request Response
server.handleReqRes = handleReqRes;

// start server
server.init = () => {
  server.createServer();
};

// export
module.exports = server;
