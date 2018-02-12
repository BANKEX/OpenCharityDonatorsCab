import Router from 'koa-router';
import controller from './controllers/dapp-controller.js';
import dappErrors from './errors';

const router = new Router({ prefix: '/dapp' });

router
  .get('/getOrganization', dappErrors(), controller.getOrganization)
  .get('/getCharityEvents', dappErrors(), controller.getCharityEvents)
  .get('/getIncomingDonations', dappErrors(), controller.getIncomingDonations)
  .get('/getCharityEvent/:hash', dappErrors(), controller.getCharityEvent)
  .get('/getIncomingDonation/:hash', dappErrors(), controller.getIncomingDonation)
  .post('/getCharityEvents', dappErrors(), controller.filterCharityEvents)
  .post('/getIncomingDonations', dappErrors(), controller.filterIncomingDonation)
;

export default router.routes();
