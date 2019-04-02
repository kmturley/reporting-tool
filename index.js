#!/usr/bin/env node

const chalk = require('chalk');
const co = require('co');
const mkdirp = require('mkdirp');
const prompt = require('co-prompt');
const program = require('commander');

const api = require('./api.js');
const reports = require('./reports.js');
const package = require('./package.json');

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

function processReport(type, selector, id, url, formulas) {
  api.get(`${api.getDomain()}/api/v2/report_items?p=${id}`).then((report_items) => {
    const reportSummary = reports.projectReport(selector, report_items);
    reports.projectDetails(selector, reportSummary).then((projectDetails) => {
      const j = projectDetails.length + 1;
      // create summary row
      const rowSummary = {
        name: 'Summary',
        url: url,
        planned_rate_cost: formulas ? `=SUM(C2:C${j})` : 0,
        planned_rate_fees: formulas ? `=SUM(D2:D${j})` : 0,
        planned_time: formulas ? `=SUM(E2:E${j})` : 0,
        planned_cost: formulas ? `=SUM(F2:F${j})` : 0,
        planned_fees: formulas ? `=SUM(G2:G${j})` : 0,
        planned_margin: formulas ? `=AVERAGE(H2:H${j})` : 0,
        actual_rate_cost: formulas ? `=SUM(I2:I${j})` : 0,
        actual_rate_fees: formulas ? `=SUM(J2:J${j})` : 0,
        actual_time: formulas ? `=SUM(K2:K${j})` : 0,
        actual_cost: formulas ? `=SUM(L2:L${j})` : 0,
        actual_fees: formulas ? `=SUM(M2:M${j})` : 0,
        actual_margin: formulas ? `=AVERAGE(N2:N${j})` : 0,
        complete_percent: formulas ? `=AVERAGE(O2:O${j})` : 0,
      };
      projectDetails.forEach((detail, detailIndex) => {
        const i = detailIndex + 2;
        // calculate row totals
        detail.planned_time = round(detail.planned_time);
        detail.planned_cost = formulas ? `=SUM(C${i}*E${i})` : round(detail.planned_rate_cost * detail.planned_time);
        detail.planned_fees = formulas ? `=SUM(D${i}*E${i})` : round(detail.planned_rate_fees * detail.planned_time);
        detail.planned_margin = formulas ? `=IFERROR(SUM((G${i}-F${i})/G${i}), 0)` : round(margin(detail.planned_fees, detail.planned_cost));
        detail.actual_time = round(detail.actual_time);
        detail.actual_cost = formulas ? `=SUM(I${i}*K${i})` : round(detail.actual_rate_cost * detail.actual_time);
        detail.actual_fees = formulas ? `=SUM(J${i}*K${i})` : round(detail.actual_rate_fees * detail.actual_time);
        detail.actual_margin = formulas ? `=IFERROR(SUM((M${i}-L${i})/M${i}), 0)` : round(margin(detail.actual_fees, detail.actual_cost));
        detail.complete_percent = formulas ? `=IFERROR(SUM(K${i}/E${i}), 0)` : round(percent(detail.actual_time, detail.planned_time));
        // add to summary
        if (!formulas) {
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
        }
      });
      if (!formulas) {
        rowSummary.planned_time = round(rowSummary.planned_time);
        rowSummary.planned_margin = round(margin(rowSummary.planned_fees, rowSummary.planned_cost));
        rowSummary.actual_time = round(rowSummary.actual_time);
        rowSummary.actual_margin = round(margin(rowSummary.actual_fees, rowSummary.actual_cost));
        rowSummary.complete_percent = round(percent(rowSummary.actual_time, rowSummary.planned_time));
      }
      projectDetails.push(rowSummary);
      const csv = api.toCSV(projectDetails);
      api.toFile(`reports/${type}.csv`, csv, (path) => {
        success(`Created file: ${path}`);
      });
    });
  });
}

program
  .version(package.version)
  .arguments('<action>')
  .option('-i, --id <date>', 'ID')
  .option('-f, --formulas <boolean>', 'Formulas')
  .action((action) => {
    co(function* () {
      const id = program.id ? program.id : yield prompt('ID: ');
      let formulas = program.formulas ? program.formulas : yield prompt('Formulas: ');
      formulas = formulas === 'true' ? true : false;
      mkdirp('reports', (error) => {
        if (action === 'office') {
          api.get(`${api.getAPI()}/projects.json`).then((projects) => {
            const officeProjects = [];
            projects.filter((project) => {
              if (Number(project.office_id) === Number(id) && project.archived === false && project.closed === false) {
                officeProjects.push(project.id);
              }
            });
            processReport('office', 'project_id', officeProjects.join(','), `${api.getDomain()}/reports?office=${id}`, formulas);
          });
        } else if (action === 'project') {
          processReport('project', 'user_id', id, `${api.getDomain()}/projects/${id}`, formulas);
        } else {
          failure(`Error command not recognized`);
        }
      });
    });
  })
  .parse(process.argv);
