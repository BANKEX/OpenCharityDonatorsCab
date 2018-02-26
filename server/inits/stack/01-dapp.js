import { DAPP } from 'configuration';
import blockchainConnector from '../../services/blockchain-connector.js';
import server from 'server';

export default async () => {
  try {
    await blockchainConnector(DAPP.ws);
  } catch (e) {
    console.log('Server has been closed');
    server.close();
  }
};
