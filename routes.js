/* 
 * Title: Routes
 * Description: Application Routes
 * Author: Sanjoy Paul
 * Date: 7/5/2023
 * 
*/

// dependencies
const {sampleHandler} = require('./handlers/routeHandlers/sampleHandler');
const { tokenHandler } = require('./handlers/routeHandlers/tokenHandler');
const { userHandler } = require('./handlers/routeHandlers/userHandler');
const { checkHandler } = require('./handlers/routeHandlers/checkHandler');

const routes = {
  'sample': sampleHandler,
  'user': userHandler,
  'token': tokenHandler,
  'check': checkHandler,
};

module.exports = routes;
