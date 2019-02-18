const api = require('./api.js');
const credentials = require('./credentials.json');

exports.projectReport = function(selector, items, obj) {
  if (!obj) { obj = {}; }
  items.forEach((item) => {
    let newItem = obj[item[selector]];
    if (!newItem) {
      newItem = obj[item[selector]] = {
        name: 'None',
        url: selector === 'user_id' ? `https://${api.getDomain()}/users/${item[selector]}/timetable`: `https://${api.getDomain()}/projects/${item[selector]}`,
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
      }
    }
    if (item.reportable_type === 'TimeLog') {
      if (!newItem['actual_rate_cost']) {
        newItem['actual_rate_cost'] = item.cost;
      }
      if (!newItem['actual_rate_fees']) {
        newItem['actual_rate_fees'] = item.rate;
      }
      newItem['actual_time'] += item.value;
    } else {
      if (!newItem['planned_rate_cost']) {
        newItem['planned_rate_cost'] = item.cost;
      }
      if (!newItem['planned_rate_fees']) {
        newItem['planned_rate_fees'] = item.rate;
      }
      newItem['planned_time'] += item.value;
    }
  });
  return obj;
}

exports.projectDetails = function(selector, obj) {
  return new Promise((resolve, reject) => {
    const results = [];
    const promises = [];
    let usersUrl = 'users';
    let projectsUrl = 'projects';
    if (credentials.staging === true) {
      usersUrl = 'api/public/v1/members';
      projectsUrl = 'api/public/v1/projects';
    }
    Object.keys(obj).forEach(async (objKey) => {
      if (objKey && objKey !== 'null') {
        promises.push(api.get(selector === 'user_id' ? `${usersUrl}/${objKey}.json`: `${projectsUrl}/${objKey}.json`, true));
      }
    });
    Promise.all(promises).then((members) => {
      members.forEach((member) => {
        if (!member) { return; }
        obj[member.id]['name'] = member.name;
        results.push(obj[member.id]);
      });
      resolve(results);
    });
  });
};
