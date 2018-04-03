import Router from 'koa-router';
import user from './user';
import dapp from './dapp';
import db from './db';

const router = new Router({ prefix: '/api' });

router.use(user);
router.use(dapp);
router.use(db);

export default router.routes();
