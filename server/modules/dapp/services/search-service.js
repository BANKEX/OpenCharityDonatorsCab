import { META } from 'configuration';
import rp from 'request-promise';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

const addDataToIndex = async (data) => {
  const options = {
    method: 'POST',
    uri: META + '/api/meta/addIndex',
    body: JSON.stringify(data),
    headers: {'Content-Type': 'application/json'},
  };
  try {
    await rp.post(options);
  } catch (e) {
    console.error(e.message);
  }
};

const delDataFromIndex = async (data) => {
  const options = {
    method: 'POST',
    uri: META + '/api/meta/delIndex',
    body: JSON.stringify({ del: data }),
    headers: {'Content-Type': 'application/json'},
  };
  try {
    return await rp.post(options);
  } catch (e) {
    console.error(e.message);
  }
};

const search = async (fields) => {
  let star = fields.searchRequest.toLowerCase().split(' ').filter(elem => elem!='');
  if (fields.addition) {
    if (fields.addition[0] != '') star = star.concat(fields.addition.map(elem => elem.toLowerCase()));
  }
  const data = {};
  data.pageSize = fields.pageSize;
  data.offset = (fields.page-1)*fields.pageSize;
  data.query = {};
  data.query.AND = {};
  data.query.AND['*'] = star;
  if (fields.type) data.query.AND.type = [fields.type.toLowerCase()];

  const options = {
    method: 'POST',
    uri: META + '/api/meta/search/',
    body: JSON.stringify(data),
    headers: {'Content-Type': 'application/json'},
  };
  try {
    return await rp(options);
  } catch (e) {
    console.error(e.message);
  }
};

export default {
  addDataToIndex,
  search,
  delDataFromIndex,
};
