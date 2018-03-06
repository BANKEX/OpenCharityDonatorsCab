import { DIRS } from 'configuration';
import fs from 'fs';

const getListFromDir = () => (fs.readdirSync(DIRS.abi).sort());

const getFile = (name) => {
  const file = fs.readFileSync(DIRS.abi+name);
  const abi = JSON.parse(file).abi;
  return JSON.stringify({ abi });
};

export default {
  getListFromDir,
  getFile,
};
