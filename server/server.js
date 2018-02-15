import app from 'app';
import { ADDRESS } from 'configuration';
import url from 'url';
const internalURL = url.parse(ADDRESS.internal);
import Socket from 'socket.io';
import socketsApp from 'sockets';

const server = (process.env.NODE_ENV === 'test')
  ? app.callback()
  : app.listen(internalURL.port, internalURL.hostname, (err) => {
      console.log((err) ? err : `Server running on ${ADDRESS.internal}`);
    });

app.on('error', (err) => {
  console.log(err.stack);
});

const io = new Socket();
io.attach(server, {
  path: '/api/ws',
});
// app.io = io;
io.on('connection', () => {
  console.log('connected');
});

export default server;

export {
  io,
};
