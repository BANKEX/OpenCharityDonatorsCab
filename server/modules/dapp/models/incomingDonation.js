import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  address: String,
  ORGaddress: String,
  cdate: Number,
  mdate: Number,
  realWorldIdentifier: String,
  note: String,
  amount: Number,
  metaStorageHash: String,
  tags: String,
}, {
  timestamps: false,
});

export default mongoose.model('incomingdonation', schema);
