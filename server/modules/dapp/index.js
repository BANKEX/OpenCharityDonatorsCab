import Router from 'koa-router';
import controller from './controllers/dapp-controller.js';
import { Organization, CharityEvent, IncomingDonation } from './models';

const router = new Router({ prefix: '/dapp' });

router
  .get('/getOrganizations', controller.getOrganizations)
  .get('/getCharityEvents/:org', controller.getCharityEvents)
  .get('/getIncomingDonations/:org', controller.getIncomingDonations)
  .get('/getCharityEvent/:hash', controller.getCharityEvent)
  .get('/getIncomingDonation/:hash', controller.getIncomingDonation)
  .post('/getCharityEvents', controller.filterCharityEvents)
  .post('/getIncomingDonations', controller.filterIncomingDonation)
  .post('/search', controller.search)
;

export default router.routes();

export {
  Organization,
  CharityEvent,
  IncomingDonation,
};

