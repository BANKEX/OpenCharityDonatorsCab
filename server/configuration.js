import config from 'config';
import path from 'path';

const ADDRESS = config.get('address');
const JWT = config.get('jwt');
const DIRS = {};
DIRS.main = path.resolve();
DIRS.public = path.resolve('public');
const MONGO_URI = config.get('mongoURI');
const DAPP = config.get('dapp');
const META = config.get('metaServer');
const OC = config.get('openCharity');
const INTERVALS = config.get('intervals');
const EMAIL = config.get('email');
const CORS = config.get('cors');

export {
  ADDRESS,
  JWT,
  DIRS,
  MONGO_URI,
  DAPP,
  META,
  OC,
  INTERVALS,
  EMAIL,
  CORS,
};
