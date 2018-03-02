import mongoose, { Schema } from 'mongoose';

const CESchema = new Schema({
  address: String,
  ORGaddress: String,
  name: String,
  payed: Number,
  raised: Number,
  target: Number,
  tags: String,
  date: String,
  history: [String],
}, {
  timestamps: false,
});

export default mongoose.model('charityEvent', CESchema);
