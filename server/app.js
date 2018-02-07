import Koa from 'koa';
import cors from '@koa/cors';
import inits from 'inits';
import middlewares from 'middlewares';
import pages from 'pages';
import modules from 'modules';

const app = new Koa();
inits();
middlewares(app);
app.use(cors());
app.use(pages);
app.use(modules);

export default app;
