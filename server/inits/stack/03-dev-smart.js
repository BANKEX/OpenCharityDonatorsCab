import { INTERVALS, DIRS, DAPP } from 'configuration';
import fs from 'fs';
import rp from 'request-promise';

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

export default async () => {
  process.stdout.write('SmartContracts...');
  const int = setInterval(() => {
    process.stdout.write('.');
  }, 200);
  
  const list = JSON.parse(await getSClist());
  await Promise.all(list.map(async (name) => {
    const file = await getSC(name);
    fs.writeFileSync(DIRS.abi+name, file);
    return true;
  }));
  
  clearInterval(int);
  process.stdout.write('reloaded');
  console.log('');
};
