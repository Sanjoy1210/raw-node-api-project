/* 
 * Title: Data Library
 * Description: Data library functions for CRUD
 * Author: Sanjoy Paul
 * Data: 7/6/2023
 * 
*/

// dependencies
const fs = require('fs');
const path = require('path');

// module scaffolding
const lib = {};

// base directory of the data folder
lib.basedir = path.join(__dirname, '/../.data/');

// write data to file
lib.create = function(dir, file, data, callback) {
  // open file for writing
  fs.open(lib.basedir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // convert data to string
      const stringData = JSON.stringify(data);

      // write data to file and then close it
      fs.writeFile(fileDescriptor, stringData, function(err2) {
        if (!err2) {
          fs.close(fileDescriptor, function(err3) {
            if (!err3) {
              callback(false);
            } else {
              callback('Error closing the new file!');
            }
          })
        } else {
          callback('Error writing to new file!');
        }
      })

    } else {
      callback('Could not open file, it may already exists!');
    }
  })
}

// read data from file
lib.read = function(dir, file, callback) {
  fs.readFile(lib.basedir+dir+'/'+file+'.json', 'utf8', function(err, data) {
    callback(err, data);
  })
}

// update existing file
lib.update = function(dir, file, data, callback) {
  // file open for writing
  fs.open(lib.basedir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // convert the dat to string
      const stringData = JSON.stringify(data);

      // truncate the file (ফাইল খালি করা)
      fs.ftruncate(fileDescriptor, function(err2) {
        if (!err2) {
          // write to the file and close it
          fs.writeFile(fileDescriptor, stringData, function(err3) {
            if (!err3) {
              // close the file
              fs.close(fileDescriptor, function(err4) {
                if (!err4) {
                  callback(false);
                } else {
                  callback('Error closing file!');
                }
              })
            } else {
              callback('Error writing to file!');
            }
          })
        } else {
          callback('Error truncating file!');
        }
      })
    } else {
      callback('Error updating. File may no exist');
    }
  })
}

// delete existing file
lib.delete = function(dir, file, callback) {
  // unlink file
  fs.unlink(lib.basedir+dir+'/'+file+'.json', function(err) {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file!');
    }
  });
}

// list all the items in a directory
lib.list = (dir, callback) => {
  fs.readdir(lib.basedir+dir+'/', (err, fileNames) => {
    if (!err && fileNames && fileNames.length > 0) {
      const trimedFileNames = [];
      fileNames.forEach(fileName => {
        trimedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimedFileNames);
    } else {
      callback('Error reading directory!');
    }
  });
}

module.exports = lib;
