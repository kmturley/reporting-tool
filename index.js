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

function round(amount) {
  return Math.round(amount * 100) / 100;
}

function margin(revenue, cost) {
  if (!revenue || !cost) {
    return 0;
  }
  return (revenue - cost) / revenue;
}

function percent(amount, total) {
  if (!amount || !total) {
    return 0;
  }
  return amount / total;
}

function processReport(type, selector, id, url) {
  api.get(`api/v2/report_items?p=${id}`).then((report_items) => {
    const reportSummary = reports.projectReport(selector, report_items);
    reports.projectDetails(selector, reportSummary).then((projectDetails) => {
      // create summary row
      const rowSummary = {
        name: 'Summary',
        url: url,
        planned_rate_cost: 0,
        planned_rate_fees: 0,
        planned_time: 0,
        planned_cost: 0,
        planned_fees: 0,
        planned_margin: 0,
        actual_rate_cost: 0,
        actual_rate_fees: 0,
        actual_time: 0,
        actual_cost: 0,
        actual_fees: 0,
        actual_margin: 0,
        complete_percent: 0,
      };
      projectDetails.forEach((detail) => {
        // calculate row totals
        detail.planned_time = round(detail.planned_time);
        detail.planned_cost = round(detail.planned_rate_cost * detail.planned_time);
        detail.planned_fees = round(detail.planned_rate_fees * detail.planned_time);
        detail.planned_margin = round(margin(detail.planned_fees, detail.planned_cost));
        detail.actual_time = round(detail.actual_time);
        detail.actual_cost = round(detail.actual_rate_cost * detail.actual_time);
        detail.actual_fees = round(detail.actual_rate_fees * detail.actual_time);
        detail.actual_margin = round(margin(detail.actual_fees, detail.actual_cost));
        detail.complete_percent = round(percent(detail.actual_time, detail.planned_time));
        // add to summary
        rowSummary.planned_rate_cost += detail.planned_rate_cost;
        rowSummary.planned_rate_fees += detail.planned_rate_fees;
        rowSummary.planned_time += detail.planned_time;
        rowSummary.planned_cost += detail.planned_cost;
        rowSummary.planned_fees += detail.planned_fees;
        rowSummary.actual_rate_cost += detail.actual_rate_cost;
        rowSummary.actual_rate_fees += detail.actual_rate_fees;
        rowSummary.actual_time += detail.actual_time;
        rowSummary.actual_cost += detail.actual_cost;
        rowSummary.actual_fees += detail.actual_fees;
      });
      rowSummary.planned_time = round(rowSummary.planned_time);
      rowSummary.planned_margin = round(margin(rowSummary.planned_fees, rowSummary.planned_cost));
      rowSummary.actual_time = round(rowSummary.actual_time);
      rowSummary.actual_margin = round(margin(rowSummary.actual_fees, rowSummary.actual_cost));
      rowSummary.complete_percent = round(percent(rowSummary.actual_time, rowSummary.planned_time));
      projectDetails.push(rowSummary);
      const csv = api.toCSV(projectDetails);
      api.toFile(`reports/${type}.csv`, csv, (path) => {
        success(`Created file: ${path}`);
      });
    });
  });
}

program
  .arguments('<action>')
  .option('-i, --id <date>', 'ID')
  .action((action) => {
    co(function* () {
      const id = program.id ? program.id : yield prompt('ID: ');
      mkdirp('reports', (error) => {
        if (action === 'office') {
          api.get(`api/v2/projects.json`).then((projects) => {
            const officeProjects = [];
            projects.filter((project) => {
              if (Number(project.office_id) === Number(id) && project.archived === false && project.closed === false) {
                officeProjects.push(project.id);
              }
            });
            processReport('office', 'project_id', officeProjects.join(','), `https://${api.getDomain()}/reports?office=${id}`);
          });
        } else if (action === 'project') {
          processReport('project', 'user_id', id, `https://${api.getDomain()}/projects/${id}`);
        } else {
          failure(`Error command not recognized`);
        }
      });
    });
  })
  .parse(process.argv);
