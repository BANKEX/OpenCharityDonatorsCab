import Router from 'koa-router';
import user from './user';
import dapp from './dapp';

const router = new Router({ prefix: '/api' });

router.use(user);
router.use(dapp);

export default router.routes();
