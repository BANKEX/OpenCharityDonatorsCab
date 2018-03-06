import { MONGO_URI } from 'configuration';
import mongooseConnector from '../../services/mongoose-connector.js';

export default async () => {
  await mongooseConnector(MONGO_URI);
};
