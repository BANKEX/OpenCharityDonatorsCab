import { Organization, Metamap } from '../';
import init from '../../dapp/init';
import AppError from '../../../utils/AppErrors.js';
import { META } from 'configuration';
import rp from 'request-promise';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

const flushIndex = async () => {
  const options = {
    method: 'POST',
    uri: META + '/api/meta/flush',
    body: JSON.stringify({ password: 'flush' }),
    headers: {'Content-Type': 'application/json'},
  };
  try {
    await rp.post(options);
  } catch (e) {
    throw e;
  }
};

export default {
  
  async synchronize(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='synchro') throw new AppError(401, 100);

    // остановить руты

    // удалить организации
    await Organization.remove();

    // удалить index
    await flushIndex();

    // удалить metamap
    await Metamap.remove();

    
    init();
  },
  
};
