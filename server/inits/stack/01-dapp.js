import { DAPP } from 'configuration';
import Web3 from 'web3';

export default () => {
  process.stdout.write('BlockChain...');
  const int = setInterval(() => {
    process.stdout.write('.');
  }, 200);
  return new Promise((resolve, reject) => {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
    web3.eth.getBlockNumber((err) => {
      clearInterval(int);
      if (err) return reject(err);
      process.stdout.write('connected');
      console.log('');
      resolve();
    });
  });
};
