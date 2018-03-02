import Router from 'koa-router';
import dbController from './controllers/db-controller.js';
import { User } from '../user';
import { Organization } from '../dapp';

const router = new Router({ prefix: '/db' });

router
  .get('/users', dbController.users)
  .get('/orgs', dbController.orgs)
  .post('/dropUsers', dbController.dropUsers)
  .post('/dropOrgs', dbController.dropOrgs)
  ;

export default router.routes();

export {
  Organization,
  User,
};

