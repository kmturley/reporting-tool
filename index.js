#!/usr/bin/env node

const chalk = require('chalk');
const co = require('co');
const mkdirp = require('mkdirp');
const prompt = require('co-prompt');
const program = require('commander');

const api = require('./api.js');
const reports = require('./reports.js');

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
      mkdirp('reports', (error) => {
        if (action === 'office') {
          api.get(`offices/${id}/reports/money.json?start=${dateStart}&end=${dateEnd}`).then((office) => {
            reports.create('project_id', 'project_name', office).then((report) => {
              const csv = api.toCSV(report);
              api.toFile(`reports/office-${id}.csv`, csv, (path) => {
                success(`Created file: ${path}`);
              });
            });
          });
        } else if (action === 'project') {
          api.get(`projects/${id}/reports/money.json?start=${dateStart}&end=${dateEnd}`).then((project) => {
            reports.create('user_id', 'user_name', project).then((report) => {
              const csv = api.toCSV(report);
              api.toFile(`reports/project-${id}.csv`, csv, (path) => {
                success(`Created file: ${path}`);
              });
            });
          });
        } else {
          failure(`Error command not recognized`);
        }
      });
    });
  })
  .parse(process.argv);
