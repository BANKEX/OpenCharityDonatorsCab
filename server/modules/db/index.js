import Router from 'koa-router';
import dbController from './controllers/db-controller.js';
import { User } from '../user';
import { Organization, Metamap } from '../dapp';

const router = new Router({ prefix: '/db' });

router
  .get('/users', dbController.users)
  .get('/orgs', dbController.orgs)
  .post('/dropUsers', dbController.dropUsers)
  .post('/dropOrgs', dbController.dropOrgs)
  .get('/getMetamap', dbController.metaMap)
  ;

export default router.routes();

export {
  Organization,
  User,
  Metamap,
};

