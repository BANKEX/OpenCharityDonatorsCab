import IO from 'koa-socket';
import socketsApp from 'sockets';
import {ADDRESS} from 'configuration';

export default (app) => {
  const io = new IO();
  io.attach(app);
  app.io.on('connection', socketsApp);
};
