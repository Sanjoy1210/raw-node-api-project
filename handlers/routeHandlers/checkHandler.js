/* 
 * Title: Check Handler
 * Description: Handler to handle user defined checks
 * Author: Sanjoy Paul
 * Date: 7/8/2023
 * 
*/

// dependencies
const data = require('../../lib/data');
const { hash, parseJSON, createRandomString } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
  const acceptedMethods = ['get', 'post', 'put', 'delete'];

  if (acceptedMethods.includes(requestProperties.method)) {
    handler._check[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }

};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
  // validate inputs
  const protocol = typeof(requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;

  const url = typeof(requestProperties.body.url) === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;

  const method = typeof(requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;

  const successCodes = typeof(requestProperties.body.successCodes) === 'object' && requestProperties.body.successCodes instanceof Array ? requestProperties.body.successCodes : false;
  
  const timeoutSeconds = typeof(requestProperties.body.timeoutSeconds) === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;
  
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // verify token
    let token = typeof(requestProperties.headersObj.token) === 'string' ? requestProperties.headersObj.token : false;

    // lookup the user phone by reading the token
    data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        let phone = parseJSON(tokenData).phone;
        // lookup the user data
        data.read('users', phone, (err2, userData) => {
          if (!err2 && userData) {
            tokenHandler._token.verify(token, phone, (tokenIsValid) => {
              if (tokenIsValid) {
                let userObj = parseJSON(userData);
                let userChecks = typeof(userObj.checks) === 'object' && userObj.checks instanceof Array ? userObj.checks : [];

                if (userChecks.length <= maxChecks) {
                  let checkId = createRandomString(20);
                  let checkObj = {
                    id: checkId,
                    phone,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };

                  // save the object
                  data.create('checks', checkId, checkObj, (err3) => {
                    if (!err3) {
                      // add check id to the user's object
                      userObj.checks = userChecks;
                      userObj.checks.push(checkId);

                      // save the new user data
                      data.update('users', phone, userObj, (err4) => {
                        if (!err4) {
                          // return the data about the new check
                          callback(200, checkObj);
                        } else {
                          callback(500, {
                            error: 'There was a problem in server side!',
                          });
                        }
                      })
                    } else {
                      callback(500, {
                        error: 'There was a problem in server side!',
                      });
                    }
                  })
                } else {
                  callback(401, {
                    error: 'User has already reached max checks limits!',
                  });
                }
              } else {
                callback(403, {
                  error: 'Authentication problem!',
                });
              }
            })
          } else {
            callback(404, {
              error: 'User not found!',
            });
          }
        })
      } else {
        callback(403, {
          error: 'Authentication problem',
        });
      }
    })
  } else {
    callback(400, {
      error: 'You have problem in your request',
    });
  }
};

handler._check.get = (requestProperties, callback) => {
  // check the checkId is valid
  const id = typeof requestProperties.queryStringObj.id === 'string' && requestProperties.queryStringObj.id.trim().length === 20 ? requestProperties.queryStringObj.id : false;

  if (id) {
    // lookup the checks
    data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // verify token
        let token = typeof(requestProperties.headersObj.token) === 'string' ? requestProperties.headersObj.token : false;

        tokenHandler._token.verify(token, parseJSON(checkData).phone, (tokenIsValid) => {
          if (tokenIsValid) {
            callback(200, parseJSON(checkData));
          } else {
            callback(403, {
              error: 'Authentication failure!',
            });
          }
        });
      } else {
        callback(500, {
          error: 'There was a problem in server side',
        });
      }
    });
  } else {
    callback(400, {
      error: 'You have problem in your request',
    });
  }

};

handler._check.put = (requestProperties, callback) => {
  // check the checkId is valid
  const id = typeof requestProperties.body.id === 'string' && requestProperties.body.id.trim().length === 20 ? requestProperties.body.id : false;

  // validate inputs
  const protocol = typeof(requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;

  const url = typeof(requestProperties.body.url) === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;

  const method = typeof(requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;

  const successCodes = typeof(requestProperties.body.successCodes) === 'object' && requestProperties.body.successCodes instanceof Array ? requestProperties.body.successCodes : false;
  
  const timeoutSeconds = typeof(requestProperties.body.timeoutSeconds) === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const checkObj = parseJSON(checkData);
          // verify token
          let token = typeof(requestProperties.headersObj.token) === 'string' ? requestProperties.headersObj.token : false;

          tokenHandler._token.verify(token, checkObj.phone, (tokenIsValid) => {
            if (tokenIsValid) {
              if (protocol) {
                checkObj.protocol = protocol;
              }
              if (url) {
                checkObj.url = url;
              }
              if (method) {
                checkObj.method = method;
              }
              if (successCodes) {
                checkObj.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkObj.timeoutSeconds = timeoutSeconds;
              }

              // store the check object
              data.update('checks', id, checkObj, (err2) => {
                if (!err2) {
                  callback(200);
                } else {
                  callback(500, {
                    error: 'There was a server side problem.',
                  });
                }
              })
            } else {
              callback(403, {
                error: 'Authentication error!',
              });
            }
          })
        } else {
          callback(500, {
            error: 'There was a problem in server side.',
          });
        }
      })
    } else {
      callback(400, {
        error: 'You must provide at least one field to update.',
      });
    }
  } else {
    callback(400, {
      error: 'You have problem in your request',
    });
  }
};

handler._check.delete = (requestProperties, callback) => {
  // check the checkId is valid
  const id = typeof requestProperties.queryStringObj.id === 'string' && requestProperties.queryStringObj.id.trim().length === 20 ? requestProperties.queryStringObj.id : false;

  if (id) {
    // lookup the checks
    data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // verify token
        let token = typeof(requestProperties.headersObj.token) === 'string' ? requestProperties.headersObj.token : false;
        const checkObj = parseJSON(checkData);

        tokenHandler._token.verify(token, checkObj.phone, (tokenIsValid) => {
          if (tokenIsValid) {
            // delete the check data
            data.delete('checks', id, (err2) => {
              if (!err2) {
                data.read('users', checkObj.phone, (err3, userData) => {
                  const userObj = parseJSON(userData);
                  if (!err3 && userData) {
                    let userChecks = typeof(userObj.checks) === 'object' && userObj.checks instanceof Array ? userObj.checks : [];

                    // remove the deleted check id from user list of checks
                    let checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);

                      // update the user data
                      userObj.checks = userChecks;
                      data.update('users', userObj.phone, userObj, (err4) => {
                        if (!err4) {
                          callback(200);
                        } else {
                          callback(500, {
                            error: 'There was a server side problem.'
                          });
                        }
                      })
                    } else {
                      callback(400, {
                        error: 'Check id is not found in user!'
                      });
                    }
                  } else {
                    callback(500, {
                      error: 'There was a server side problem.'
                    });
                  }
                })
              } else {
                callback(500, {
                  error: 'There was a server side problem.'
                });
              }
            })
          } else {
            callback(403, {
              error: 'Authentication failure!',
            });
          }
        });
      } else {
        callback(500, {
          error: 'There was a problem in server side',
        });
      }
    });
  } else {
    callback(400, {
      error: 'You have problem in your request',
    });
  }
};

module.exports = handler;
