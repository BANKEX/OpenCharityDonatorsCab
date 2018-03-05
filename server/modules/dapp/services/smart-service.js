import { DAPP, DIRS } from 'configuration';
import rp from 'request-promise';
import fs from 'fs';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

const getSClist = async () => {
  const options = {
    method: 'GET',
    uri: DAPP.smartContacts+'/all',
  };
  return await rp(options);
};

const getSC = async (name) => {
  const options = {
    method: 'GET',
    uri: DAPP.smartContacts+'/'+name,
  };
  return await rp(options);
};

const getListFromDir = () => {
  return fs.readdirSync(DIRS.abi).sort();
};

const getFile = (name) => {
  return fs.readFileSync(DIRS.abi+name);
};

export default {
  getSClist,
  getSC,
  getListFromDir,
  getFile,
};
