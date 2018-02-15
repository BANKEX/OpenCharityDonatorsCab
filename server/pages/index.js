import Router from 'koa-router';
import getUser from '../utils/getUser.js';
import { ADDRESS } from 'configuration';

const router = new Router();

router
  .get('/', getUser(), async (ctx) => {
    ctx.body = 'DonatorsCabFront';
  })
  .get('/api/testAPI', getUser(), async (ctx) => {
    ctx.state.ws = ADDRESS.ws;
    await ctx.render('testAPI');
  })
  .get('*', async (ctx) => {
    ctx.state.message = 'Запрос к API некорректен';
    ctx.state.status = 404;
    ctx.res.statusCode = 404;
    await ctx.render('error');
  });

export default router.routes();
