#!/usr/bin/env node

const chalk = require('chalk');
const co = require('co');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const mkdirp = require('mkdirp');
const prompt = require('co-prompt');
const program = require('commander');
const request = require('request');
const { map } = require('rxjs/operators');

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
    }, (error, response, body) => {
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
  console.log('convert', dataset.length);
  var headers = Object.keys(dataset[0]);
  try {
    return json2csv(dataset, { headers });
  } catch (error) {
    failure(error);
  }
}

function file(path, data, callback) {
  console.log('file', path);
  fs.writeFile(path, data, 'utf8', (error) => {
    if (error) {
      failure(error);
    } else{
      callback(path);
    }
  });
}

program
  .arguments('<action>')
  .option('-i, --id <date>', 'ID')
  .option('-s, --start <date>', 'Start Date (YYYY-MM-DD)')
  .option('-e, --end <date>', 'End Date (YYYY-MM-DD)')
  .action((action) => {
    co(function* () {
      const id = program.id ? program.id : yield prompt('ID: ');
      const dateStart = program.start ? program.start : yield prompt('Start Date (YYYY-MM-DD): ');
      const dateEnd = program.end ? program.end : yield prompt('End Date (YYYY-MM-DD): ');
      if (action === 'office') {
        const projectList = {};
        yield get(`projects.json`).then((projects) => {
          projects.forEach((project) => {
            projectList[project.id] = project;
          });
        });
        get(`offices/${id}/reports/money.json?start=${dateStart}&end=${dateEnd}`).then((entries) => {
          mkdirp('reports', (error) => {
            if (error) { return failure(error); }
            const reportRows = reports.create('project_id', 'project_name', entries);
            reportRows.forEach((reportRow) => {
              reportRow['project_name'] = projectList[reportRow.project_id] ? projectList[reportRow.project_id].name : 'none';
            });
            const csv = convert(reportRows);
            file(`reports/office-${id}.csv`, csv, (path) => {
              success(`Created file: ${path}`);
            });
          });
        });
      } else if (action === 'project') {
        const memberList = {};
        yield get(`members.json`).then((members) => {
          members.forEach((member) => {
            memberList[member.id] = member;
          });
        });
        get(`projects/${id}/reports/money.json?start=${dateStart}&end=${dateEnd}`).then((project) => {
          mkdirp('reports', (error) => {
            if (error) { return failure(error); }
            const reportRows = reports.create('user_id', 'user_name', project);
            reportRows.forEach((reportRow) => {
              reportRow['user_name'] = memberList[reportRow.user_id].name;
            });
            const csv = convert(reportRows);
            file(`reports/project-${id}.csv`, csv, (path) => {
              success(`Created file: ${path}`);
            });
          });
        }).catch((error) => {
          failure(error);
        });
      } else {
        failure(`Error command not recognized`);
      }
  });
})
.parse(process.argv);
