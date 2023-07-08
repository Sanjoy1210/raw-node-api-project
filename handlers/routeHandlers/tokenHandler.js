/* 
 * Title: Token Handler
 * Description: Handler to handle toke related routes
 * Author: Sanjoy Paul
 * Date: 7/8/2023
 * 
*/

// dependencies
const data = require('../../lib/data');
const { hash, parseJSON, createRandomString } = require('../../helpers/utilities');

// module scaffolding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
  const acceptedMethods = ['get', 'post', 'put', 'delete'];

  if (acceptedMethods.includes(requestProperties.method)) {
    handler._token[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }

};

handler._token = {};

handler._token.post = (requestProperties, callback) => {
  const phone = typeof requestProperties.body.phone === 'string' && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;
  const password = typeof requestProperties.body.password === 'string' && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;

  if (phone && password) {
    data.read('users', phone, (err, userData) => {
      const hashedPassword = hash(password);
      if (!err && hashedPassword === parseJSON(userData).password) {
        let tokenId = createRandomString(20);
        let expires = Date.now() + 3600 * 1000;

        // provide to the user
        const tokenObj = {
          phone,
          tokenId,
          expires,
        };

        // store the token
        data.create('tokens', tokenId, tokenObj, (err2) => {
          if (!err2) {
            // 200 - accepted to the server
            callback(200, tokenObj);
          } else {
            // 500 - server side error
            callback(500, {
              error: 'There was a problem in the server side',
            });
          }
        });
      } else {
        // 400 - client request problem
        callback(400, {
          error: 'Password doesn\'t match',
        });
      }
    })
  } else {
    // 400 - client request problem
    callback(400, {
      error: 'You have a problem in your request',
    });
  }
};

handler._token.get = (requestProperties, callback) => {
  // check the tokenId is valid
  const tokenId = typeof requestProperties.queryStringObj.tokenId === 'string' && requestProperties.queryStringObj.tokenId.trim().length === 20 ? requestProperties.queryStringObj.tokenId : false;

  if (tokenId) {
    // lookup the token
    data.read('tokens', tokenId, (err, tokenData) => {
      const token = {...parseJSON(tokenData)};
      if (!err && token) {
        callback(200, token);
      } else {
        callback(404, {
          error: 'Requested token was not found',
        });
      }
    })
  } else {
    callback(404, {
      error: 'Requested token was not found',
    });
  }
};

handler._token.put = (requestProperties, callback) => {
  // check the tokenId is valid
  const tokenId = typeof requestProperties.body.tokenId === 'string' && requestProperties.body.tokenId.trim().length === 20 ? requestProperties.body.tokenId : false;
  const extend = typeof requestProperties.body.extend === 'boolean' && requestProperties.body.extend === true;

  if (tokenId && extend) {
    data.read('tokens', tokenId, (err, tokenData) => {
      let tokenObj = parseJSON(tokenData);
      if (tokenObj.expires > Date.now()) {
        tokenObj.expires = Date.now() + 3600 * 1000;

        // store the updated token
        data.update('tokens', tokenId, tokenObj, (err2) => {
          if (!err2) {
            callback(200);
          } else {
            // 500 - server side problem
            callback(500, {
              error: 'There was a server side problem!',
            });
          }
        })
      } else {
        // 400 - client request problem
        callback(400, {
          error: 'Token already expired!',
        });
      }
    })
  } else {
    // 400 - client request problem
    callback(400, {
      error: 'There was a problem in your request',
    });
  }
};

handler._token.delete = (requestProperties, callback) => {
  // check the token is valid
  const tokenId = typeof requestProperties.queryStringObj.tokenId === 'string' && requestProperties.queryStringObj.tokenId.trim().length === 20 ? requestProperties.queryStringObj.tokenId : false;

  if (tokenId) {
    // lookup the user
    data.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        data.delete('tokens', tokenId, (err2) => {
          if (!err2) {
            callback(200, {
              message: 'Token was successfully deleted!'
            });
          } else {
            callback(500, {
              error: 'There was a server side error!',
            });
          }
        })
      } else {
        callback(500, {
          error: 'There was a server side error!',
        });
      }
    })
  } else {
    callback(400, {
      error: 'There was a problem in your request!',
    });
  }
};

handler._token.verify = (tokenId, phone, callback) => {
  data.read('tokens', tokenId, (err, tokenData) => {
    if (!err && tokenData) {
      const token = parseJSON(tokenData);
      if (token.phone === phone && token.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  })
}

module.exports = handler;
