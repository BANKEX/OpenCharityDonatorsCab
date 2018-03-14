import Router from 'koa-router';
import controller from './controllers/admin-controller';
import { Organization, Metamap } from '../dapp';

const router = new Router({ prefix: '/admin' });

router
  .post('/synchronize', controller.synchronize)
  ;

export default router.routes();

export {
  Organization,
  Metamap,
};

