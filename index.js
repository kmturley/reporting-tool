#!/usr/bin/env node

const chalk = require('chalk');
const co = require('co');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const mkdirp = require('mkdirp');
const prompt = require('co-prompt');
const program = require('commander');
const request = require('request');

const reports = require('./reports.js');

const domain = process.env.REPORT_URL || console.error('Please set your REPORT_URL');
const email = process.env.REPORT_EMAIL || console.error('Please set your REPORT_EMAIL');
const token = process.env.REPORT_TOKEN || console.error('Please set your REPORT_TOKEN');

function success(msg) {
  console.log(`-------`);
  console.log(chalk.green(msg));
  process.exit(1);
}

function failure(msg) {
  console.log(`-------`);
  console.log(chalk.red(msg));
  process.exit(0);
}

function get(url) {
  return new Promise((resolve, reject) => {
    console.log('get', url);
    request.get({
      url: `https://${domain}/api/public/v1/${url}`,
      headers: {
        'X-User-Email': email,
        'X-User-Token': token
      }
    }, function(error, response, body) {
      if (error) {
        return reject(error);
      }
      try {
        body = JSON.parse(body);
      } catch (error) {
        console.log(body);
        return reject(error);
      }
      if (body.error) {
        return reject(body.error);
      }
      resolve(body);
    });
  });
}

function convert(dataset) {
  console.log('convert', dataset);
  var headers = Object.keys(dataset[0]);
  try {
    return json2csv(dataset, { headers });
  } catch (error) {
    failure(error);
  }
}

function file(path, data, callback) {
  console.log('file', path);
  fs.writeFile(path, data, 'utf8', function (error) {
    if (error) {
      failure(error);
    } else{
      callback(path);
    }
  });
}

program
  .arguments('<action>')
  .option('-i, --id <date>', 'Project ID (YYYY-MM-DD)')
  .option('-s, --start <date>', 'Start Date (YYYY-MM-DD)')
  .option('-e, --end <date>', 'End Date (YYYY-MM-DD)')
  .action((action) => {
    co(function* () {
      const projectId = program.id ? program.id : yield prompt('Project ID: ');
      const dateStart = program.start ? program.start : yield prompt('Start Date (YYYY-MM-DD): ');
      const dateEnd = program.end ? program.end : yield prompt('End Date (YYYY-MM-DD): ');
      if (action === 'generate') {
        console.log(`projects downloading...`);
        // get(`projects.json`).then((projects) => {
        // console.log(`projects downloaded!`);
        const promises = [];
        // test 10 projects
        // projects.forEach((project, projectIndex) => {
        //   if (projectIndex < 10) {
        //     promises.push(get(`projects/${project.id}/reports/money.json?start=${dateStart}&end=${dateStart}`));
        //   }
        // });
        // test a single project
        promises.push(get(`projects/${projectId}/reports/money.json?start=${dateStart}&end=${dateEnd}`));
        Promise.all(promises).then(function(projects) {
          mkdirp('reports', function(error) {
            if (error) { return failure(error); }
            projects.forEach((project) => {
              if (project[0]) {
                const projectId = project[0]['project_id'];
                const report = reports.create(project);
                const csv = convert(report);
                file(`reports/project-${projectId}.csv`, csv, function(path) {
                  success(`Created file: ${path}`);
                });
                // debug raw json data
                // file(`reports/project-${projectId}.json`, JSON.stringify(project, null, 2), function(path) {
                //   console.log(`Created file: ${path}`);
                // });
              }
            });
          });
        }).catch(function (error) {
          failure(error);
        });
        // }).catch(function (error) {
        //   failure(error);
        // });
      } else {
        failure(`Error command not recognized`);
      }
  });
})
.parse(process.argv);
