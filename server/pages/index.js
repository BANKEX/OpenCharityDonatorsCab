import Router from 'koa-router';
import getUser from '../utils/getUser.js';

const router = new Router();

router
  .get('/testAPI', getUser(), async (ctx) => {
    await ctx.render('testAPI');
  });

export default router.routes();
