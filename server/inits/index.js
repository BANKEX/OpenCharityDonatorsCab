import fs from 'fs';
import { DIRS } from 'configuration';
import dapp from './stack/01-dapp';
import mongo from './stack/02-mongo';
import smart from './stack/03-dev-smart';
import dappInit from './stack/04-dappInit';
import server from 'server';

export default async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await dapp();
      await mongo();
      if (process.env.NODE_ENV == 'development') {
        if (!fs.existsSync(DIRS.abi)) fs.mkdirSync(DIRS.abi);
        await smart();
      }
      await dappInit();
      resolve();
    } catch (e) {
      console.log(e);
      console.log('Server has been closed');
      server.close();
      reject();
    }
  });
};
