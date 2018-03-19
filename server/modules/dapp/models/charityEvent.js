import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  address: String,
  ORGaddress: String,
  date: Date,
  name: String,
  payed: Number,
  target: Number,
  raised: Number,
  metaStorageHash: String,
  tags: String,
}, {
  timestamps: false,
});

export default mongoose.model('charityevent', schema);
