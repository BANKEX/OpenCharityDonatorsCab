import mongoose, { Schema } from 'mongoose';

const MetaSchema = new Schema({
  address: String,
  hash: String,
}, {
  timestamps: false,
});

export default mongoose.model('charityEvent', MetaSchema);
