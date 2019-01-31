#!/usr/bin/env node

const chalk = require('chalk');
const co = require('co');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const prompt = require('co-prompt');
const program = require('commander');
const request = require('request');

const domain = process.env.REPORT_URL || console.error('Please set your REPORT_URL');
const email = process.env.REPORT_EMAIL || console.error('Please set your REPORT_EMAIL');
const token = process.env.REPORT_TOKEN || console.error('Please set your REPORT_TOKEN');

function success(msg) {
  console.log(`-------`);
  console.log(chalk.green(msg));
  process.exit(1);
}

function error(msg) {
  console.log(`-------`);
  console.log(chalk.red(msg));
  process.exit(0);
}

function get(url, callback) {
  console.log('get', url);
  request.get({
    url: `https://${domain}/api/public/v1/${url}`,
    headers: {
      'X-User-Email': email,
      'X-User-Token': token
    }
  }, function(error, response, body) {
    if (error) {
      return error(error);
    }
    body = JSON.parse(body);
    if (body.error) {
      return error(body.error);
    }
    callback(body);
  });
}

function convert(dataset) {
  console.log('convert', dataset);
  var headers = Object.keys(dataset[0]);
  try {
    return json2csv(dataset, { headers });
  } catch (error) {
    error(error);
  }
}

function write(path, data, callback) {
  console.log('write', path, data);
  fs.writeFile(path, data, 'utf8', function (error) {
    if (error) {
      error(error);
    } else{
      callback(path);
    }
  });
}

program
  .arguments('<action>')
  .option('-f, --filename <filename>', 'Filename')
  .option('-t, --type <filename>', 'Type')
  .action((action) => {
    co(function* () {
      if (action === 'generate') {
        const filename = yield prompt('Filename: ');
        const type = yield prompt('Type: ');
        get(`${type}.json`, function(data) {
          const csv = convert(data);
          write(`${filename}.csv`, csv, function(path) {
            success(`Created: ${path}`);
          });
        });
      } else {
        error(`Error command not recognized`);
      }
  });
})
.parse(process.argv);
