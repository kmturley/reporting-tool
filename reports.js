exports.create = function(project) {
  const users = {};
  const results = [];
  project.forEach((entry) => {
    if (!users[entry.user_id]) {
      users[entry.user_id] = {};
    }
    if (!users[entry.user_id][entry.date]) {
      users[entry.user_id][entry.date] = {};
    }
    if (!users[entry.user_id][entry.date]['user_id']) {
      users[entry.user_id][entry.date]['user_id'] = entry.user_id;
    }
    if (!users[entry.user_id][entry.date]['cost']) {
      users[entry.user_id][entry.date]['cost'] = entry.cost;
    }
    if (!users[entry.user_id][entry.date]['rate']) {
      users[entry.user_id][entry.date]['rate'] = entry.rate;
    }
    if (!users[entry.user_id][entry.date]['time']) {
      users[entry.user_id][entry.date]['time'] = entry.time;
    } else {
      users[entry.user_id][entry.date]['time'] += entry.time;
    }
  });
  Object.keys(users).forEach((userKey, userIndex) => {
    const i = userIndex + 2;
    const resultUser = {
      'user_id': null,
      'rate': null,
      'cost': null,
      'time_total': `=SUM(I${i}:Z${i})`,
      'rate_total': `=SUM(B${i}*D${i})`,
      'cost_total': `=SUM(C${i}*D${i})`,
      'margin': `=SUM(E${i}-F${i})`,
      'margin_percentage': `=SUM((G${i}/E${i})*100)`,
    };
    Object.keys(users[userKey]).forEach((dateKey) => {
      if (!resultUser['user_id']) {
        resultUser['user_id'] = users[userKey][dateKey]['user_id'];
        resultUser['rate'] = users[userKey][dateKey]['rate'];
        resultUser['cost'] = users[userKey][dateKey]['cost'];
      }
      resultUser[dateKey] = users[userKey][dateKey]['time'];
    });
    results.push(resultUser);
  });
  return results;
}
