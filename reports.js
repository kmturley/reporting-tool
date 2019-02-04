const api = require('./api.js');

function updateValue(parent, val, field, average) {
  if (!parent[field]) {
    parent[field] = val;
  } else {
    parent[field] += val;
    if (average === true) {
      parent[field] = parent[field] / 2;
    }
  }
}

function create(id, name, items) {
  return new Promise((resolve, reject) => {
    const obj = {};
    items.forEach((item) => {
      if (!obj[item[id]]) {
        obj[item[id]] = {};
      }
      if (!obj[item[id]][item.date]) {
        obj[item[id]][item.date] = {};
      }
      updateValue(obj[item[id]][item.date], item[id], id);
      updateValue(obj[item[id]][item.date], item.rate, 'rate', true);
      updateValue(obj[item[id]][item.date], item.cost, 'cost', true);
      updateValue(obj[item[id]][item.date], item.time, 'time');
      updateValue(obj[item[id]][item.date], obj[item[id]][item.date]['rate'] * item.time, 'rate_total');
      updateValue(obj[item[id]][item.date], obj[item[id]][item.date]['cost'] * item.cost, 'cost_total');
    });
    const results = [];
    const promises = [];
    Object.keys(obj).forEach(async (objKey, objIndex) => {
      promises.push(api.get(id === 'user_id' ? `members/${objKey}.json` : `projects/${objKey}.json`));
    });
    Promise.all(promises).then((list) => {
      list.forEach((listItem) => {
        if (!listItem) { return; }
        console.log(listItem.id, listItem.name);
        const i = results.length + 2;
        const result = {};
        result[name] = listItem.name;
        result[id] = listItem.id;
        result['rate'] = null;
        result['cost'] = null;
        result['time_total'] = `=SUM(J${i}:Z${i})`;
        result['rate_total'] = `=SUM(C${i}*E${i})`;
        result['cost_total'] = `=SUM(D${i}*E${i})`;
        result['margin'] = `=SUM(F${i}-G${i})`;
        result['margin_percentage'] = `=SUM(H${i}/F${i})`;
        Object.keys(obj[listItem.id]).forEach((dateKey) => {
          if (!result['rate']) {
            // use aggregated values instead of individual values
            result['rate'] = obj[listItem.id][dateKey]['rate'];
            result['cost'] = obj[listItem.id][dateKey]['cost'];
            if (name === 'project_name') {
              result['rate_total'] = obj[listItem.id][dateKey]['rate_total'];
              result['cost_total'] = obj[listItem.id][dateKey]['cost_total'];
            }
          }
          result[dateKey] = obj[listItem.id][dateKey]['time'];
        });
        results.push(result);
      });
      resolve(results);
    });
  });
}

exports.create = create;