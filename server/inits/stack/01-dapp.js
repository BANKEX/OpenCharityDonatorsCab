import { DAPP } from 'configuration';
import Web3 from 'web3';

export default () => {
  return new Promise((resolve, reject) => {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
    web3.eth.getBlockNumber((err) => {
      if (err) reject(err);
      console.log('Blockchain connected');
      resolve();
    });
  });
};
