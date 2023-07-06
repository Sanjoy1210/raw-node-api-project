/* 
 * Title: Handle Request Response
 * Description: Handle Request and Response
 * Author: Sanjoy Paul
 * Date: 7/5/2023
 * 
*/

// dependencies
const url = require('url');
const {StringDecoder} = require('string_decoder');
const routes = require('../routes');
const { notFoundHandler } = require('../handlers/routeHandlers/notFoundHandler');

// module scaffolding
const handler = {};

handler.handleReqRes = (req, res) => {
  // request handling
  // get the url and parse it
  const parsedURL = url.parse(req.url, true);
  const pathname = parsedURL.pathname;
  // remove first and last / from a pathname
  const trimmedPathname = pathname.replace(/^\/+|\/+$/g, '');
  const method = req.method.toLowerCase();
  const queryStringObj = parsedURL.query;
  const headersObj = req.headers;

  const requestProperties = {
    parsedURL,
    pathname,
    trimmedPathname,
    method,
    queryStringObj,
    headersObj,
  };

  // string decode
  const decoder = new StringDecoder('utf-8');
  let realData = '';

  const chosenHandler = routes[trimmedPathname] ? routes[trimmedPathname] : notFoundHandler;

  req.on('data', (buffer) => {
    realData += decoder.write(buffer);
  });

  req.on('end', () => {
    realData += decoder.end();
    
    chosenHandler(requestProperties, (statusCode, payload) => {
      statusCode = typeof(statusCode) === 'number' ? statusCode : 500;
      payload = typeof(payload) === 'object' ? payload : {};

      const payloadString = JSON.stringify(payload);

      // return the final response
      res.writeHead(statusCode);
      res.end(payloadString);
    });

    // response handle
    res.end('Hello programmers');
  })
}

module.exports = handler;
