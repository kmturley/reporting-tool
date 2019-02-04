exports.create = function(id, name, items) {
  const users = {};
  const results = [];
  items.forEach((entry) => {
    // console.log('entry', JSON.stringify(entry));
    if (!users[entry[id]]) {
      users[entry[id]] = {};
    }
    if (!users[entry[id]][entry.date]) {
      users[entry[id]][entry.date] = {};
    }
    if (!users[entry[id]][entry.date][id]) {
      users[entry[id]][entry.date][id] = entry[id];
    }
    if (!users[entry[id]][entry.date]['cost']) {
      users[entry[id]][entry.date]['cost'] = entry.cost;
    }
    if (!users[entry[id]][entry.date]['rate']) {
      users[entry[id]][entry.date]['rate'] = entry.rate;
    }
    if (!users[entry[id]][entry.date]['time']) {
      users[entry[id]][entry.date]['time'] = entry.time;
    } else {
      users[entry[id]][entry.date]['time'] += entry.time;
    }
  });
  Object.keys(users).forEach((userKey, userIndex) => {
    const i = userIndex + 2;
    const resultUser = {};
    resultUser[name] = null;
    resultUser[id] = null;
    resultUser['rate'] = null;
    resultUser['cost'] = null;
    resultUser['time_total'] = `=SUM(I${i}:Z${i})`;
    resultUser['rate_total'] = `=SUM(B${i}*D${i})`;
    resultUser['cost_total'] = `=SUM(C${i}*D${i})`;
    resultUser['margin'] = `=SUM(E${i}-F${i})`;
    resultUser['margin_percentage'] = `=SUM((G${i}/E${i})*100)`;
    Object.keys(users[userKey]).forEach((dateKey) => {
      if (!resultUser[name]) {
        resultUser[name] = users[userKey][dateKey][name];
        resultUser[id] = users[userKey][dateKey][id];
        resultUser['rate'] = users[userKey][dateKey]['rate'];
        resultUser['cost'] = users[userKey][dateKey]['cost'];
      }
      resultUser[dateKey] = users[userKey][dateKey]['time'];
    });
    results.push(resultUser);
  });
  return results;
}
