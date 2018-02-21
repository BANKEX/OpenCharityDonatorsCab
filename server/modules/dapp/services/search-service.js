import { META } from 'configuration';
import rp from 'request-promise';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

export default {
  addDataToIndex: async (data) => {
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
  },

  search: async (data) => {
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
  },
};
