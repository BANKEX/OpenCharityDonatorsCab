import { META } from 'configuration';
import rp from 'request-promise';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

export default {
  getOrgs: async () => {
    const options = {
      method: 'GET',
      uri: META + '/api/settings/organizations/',
    };
    return JSON.parse(await rp(options));
  },
};
