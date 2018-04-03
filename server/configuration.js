import config from 'config';

const ADDRESS = config.get('address');
const JWT = config.get('jwt');
const DIRS = config.get('dirs');
const MONGO_URI = config.get('mongoURI');
const DAPP = config.get('dapp');
const META = config.get('metaServer');
const OC = config.get('opencharity');
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
