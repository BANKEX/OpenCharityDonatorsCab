import Router from 'koa-router';
import controller from './controllers/dapp-controller.js';
import dappErrors from './errors';
import { Organization } from './models';

const router = new Router({ prefix: '/dapp' });

router
  .get('/getOrganizations', dappErrors(), controller.getOrganizations)
  .get('/getCharityEvents/:org', dappErrors(), controller.getCharityEvents)
  .get('/getIncomingDonations/:org', dappErrors(), controller.getIncomingDonations)
  .get('/getCharityEvent/:hash', dappErrors(), controller.getCharityEvent)
  .get('/getIncomingDonation/:hash', dappErrors(), controller.getIncomingDonation)
  .post('/getCharityEvents', dappErrors(), controller.filterCharityEvents)
  .post('/getIncomingDonations', dappErrors(), controller.filterIncomingDonation)
  .post('/search', dappErrors(), controller.search)
  .get('/smarts/:name', dappErrors(), controller.smarts)
;

export default router.routes();

export {
  Organization,
};

