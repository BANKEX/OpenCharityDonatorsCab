import { META } from 'configuration';
import rp from 'request-promise';

const line = [];
let readyToIndex = true;

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

const addBatchToLine = (data) => {
  line.push(data);
  if (readyToIndex) addDataToIndex();
};

const addDataToIndex = async () => {
  if (line.length) {
    readyToIndex = false;
    const options = {
      method: 'POST',
      uri: META + '/api/meta/addIndex',
      body: JSON.stringify(line[0]),
      headers: {'Content-Type': 'application/json'},
    };
    try {
      await rp.post(options);
      line.shift();
      addDataToIndex();
    } catch (e) {
      console.error(e.message);
    }
  } else {
    readyToIndex = true;
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
  const TYPES = ['organization', 'charityEvent', 'incomingDonation'];
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
  if (fields.type) data.query.AND.type = [TYPES.indexOf(fields.type)];

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
  addBatchToLine,
  search,
  delDataFromIndex,
};
