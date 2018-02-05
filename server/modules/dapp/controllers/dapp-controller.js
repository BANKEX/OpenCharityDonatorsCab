import { DappService } from '../services';
const organizations = ['0xf959e72cbfd729888adeee819563e1122545f46b'];

export default {
  async getOrganization(ctx) {
    const data = await DappService.getOrganization(organizations[0]);
    ctx.body = { data };
  },

  async getCharityEvents(ctx) {
    const charityEventList = await DappService.getCharityEventAddressList(organizations[0]);
    const data = await Promise.all(charityEventList.map(await DappService.singleCharityEvent));
    ctx.body = { data };
  },

  async getIncomingDonations(ctx) {
    const incomingDonationList = await DappService.getIncomingDonationAddressList(organizations[0]);
    const data = await Promise.all(incomingDonationList.map(await DappService.singleIncomingDonation));
    ctx.body = { data };
  },
  
  async getCharityEvent(ctx) {
    const data = await DappService.singleCharityEvent(ctx.params.hash);
    ctx.body = { data };
  },
  
  async getIncomingDonation(ctx) {
    const data = await DappService.singleIncomingDonation(ctx.params.hash);
    ctx.body = { data };
  },
};

