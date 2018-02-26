import Web3 from 'web3';

export default async (ws) => {
  try {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(ws));
    await web3.eth.getBlockNumber().then(console.log);
    console.log('Blockchain connected');
  } catch (e) {
    console.log('Blockchain connection failed');
    throw e;
  }
};
