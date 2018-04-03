import Socket from 'socket.io';
import socketsApp from '../../sockets';
import server from 'server';
import app from 'app';

export default () => {
  process.stdout.write('Sockets...');
  const int = setInterval(() => {
    process.stdout.write('.');
  }, 200);
  const io = new Socket();
  io.attach(server, {path: '/api/ws'});
  io.on('connection', socketsApp);
  app.io = io;
  clearInterval(int);
  process.stdout.write('connected');
  console.log('');
};
