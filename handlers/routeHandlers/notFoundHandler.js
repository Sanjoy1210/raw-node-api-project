/* 
 * Title: Not Found Handler
 * Description: 404 Not Found Handler
 * Author: Sanjoy Paul
 * Date: 7/5/2023
 * 
*/

// module scaffolding
const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
  console.log(requestProperties);

  callback(404, {
    message: 'Your requested url was not found!'
  });
}

module.exports = handler;
