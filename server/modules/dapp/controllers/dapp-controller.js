import { DappService } from '../services';
const organizations = ['0xe777faf8240196ba99c6e2a89e8f24b75c52eb2a'];

export default {
  async getOrganization(ctx) {
    const data = await DappService.getOrganization(organizations[0]);
    ctx.body = { data };
  },

  async getCharityEvents(ctx) {
    const charityEventList = await DappService.getCharityEventAddressList(organizations[0]);
    const data = await Promise.all(charityEventList.map(async (address) => (
      await DappService.singleCharityEvent(organizations[0], address)
    )));
    ctx.body = { data };
  },

  async getIncomingDonations(ctx) {
    const incomingDonationList = await DappService.getIncomingDonationAddressList(organizations[0]);
    const data = await Promise.all(incomingDonationList.map(async (address) => (
      await DappService.singleIncomingDonation(organizations[0], address)
    )));
    ctx.body = { data };
  },
  
  async getCharityEvent(ctx) {
    const data = await DappService.singleCharityEvent(organizations[0], ctx.params.hash);
    ctx.body = { data };
  },
  
  async getIncomingDonation(ctx) {
    const data = await DappService.singleIncomingDonation(organizations[0], ctx.params.hash);
    ctx.body = { data };
  },
};

