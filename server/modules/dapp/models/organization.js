import mongoose, { Schema } from 'mongoose';

const OrgSchema = new Schema({
  ORGaddress: String,
  name: String,
  charityEventCount: Number,
  incomingDonationCount: Number,
  CEAddressList: [String],
  IDAddressList: [String],
}, {
  timestamps: false,
});

export default mongoose.model('organization', OrgSchema);
