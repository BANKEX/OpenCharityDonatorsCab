import { DappService, FilterService } from '../services';
import pick from 'lodash.pick';
import AppError from '../../../utils/AppErrors.js';
const organizations = ['0xc4e24e6b25fb81e3aae568c3e1d7da04ccebd762'];

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
  
  async filterCharityEvents(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);

    const charityEventList = await DappService.getCharityEventAddressList(organizations[0]);
    const fields = pick(ctx.request.body, FilterService.cardCharityEvent);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    const data = await Promise.all(charityEventList.map(async (address) => {
      const ce = await DappService.singleCharityEvent(organizations[0], address);
      return (filtering) ? FilterService.filter(ce, fields) : ce;
    }));
    ctx.body = { data };
  },

  async filterIncomingDonation(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);

    const incomingDonationList = await DappService.getIncomingDonationAddressList(organizations[0]);
    const fields = pick(ctx.request.body, FilterService.cardIncomingDonation);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    const data = await Promise.all(incomingDonationList.map(async (address) => {
      const id = await DappService.singleIncomingDonation(organizations[0], address);
      return (filtering) ? FilterService.filter(id, fields) : id;
    }));
    ctx.body = { data };
  },
};

