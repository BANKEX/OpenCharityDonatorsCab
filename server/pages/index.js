import Router from 'koa-router';
import getUser from '../utils/getUser.js';

const router = new Router();

router
  .get('/api/testAPI', getUser(), async (ctx) => {
    await ctx.render('testAPI');
  })
  .get('*', async (ctx) => {
    ctx.body = 'DonatorsCab';
  });

export default router.routes();
