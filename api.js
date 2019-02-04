
const fs = require('fs');
const json2csv = require('json2csv').parse;
const requestPromise = require('request-promise');

const domain = process.env.REPORT_URL || console.error('Please set your REPORT_URL');
const email = process.env.REPORT_EMAIL || console.error('Please set your REPORT_EMAIL');
const token = process.env.REPORT_TOKEN || console.error('Please set your REPORT_TOKEN');

exports.getDomain = function() {
  return domain;
}

exports.get = function(url) {
  console.log('api.get', url);
  return requestPromise.get({
    uri: `https://${domain}/api/public/v1/${url}`,
    headers: {
      'X-User-Email': email,
      'X-User-Token': token
    },
    json: true
  }).catch((error) => {
    console.error(error.options.uri, error.name, error.statusCode, error.message);
  });
};

exports.toCSV = function(dataset) {
  console.log('api.toCSV', dataset.length);
  var headers = Object.keys(dataset[0]);
  try {
    return json2csv(dataset, { headers });
  } catch (error) {
    failure(error);
  }
};

exports.toFile = function(path, data, callback) {
  console.log('toFile', path);
  fs.writeFile(path, data, 'utf8', (error) => {
    if (error) {
      failure(error);
    } else{
      callback(path);
    }
  });
}
