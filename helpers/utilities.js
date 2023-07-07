/* 
 * Title: Utilities
 * Description: Important utility functions
 * Author: Sanjoy Paul
 * Date: 7/7/2023
 * 
*/

// dependencies
const crypto = require('crypto');
const environments = require('./environments');

// module scaffolding
const utilities = {};

// parse JSON string to Object
utilities.parseJSON = (jsonString) => {
  let output;

  try {
    output = JSON.parse(jsonString);
  } catch (error) {
    output = {};
  }

  return output;
};

// hash string
utilities.hash = (str) => {
  if (typeof(str) === 'string' && str.length > 0) {
    let hash = crypto.createHmac('sha256', environments.secretKey).update(str).digest('hex');

    return hash;
  } else {
    return false;
  }
};


// export module
module.exports = utilities;
