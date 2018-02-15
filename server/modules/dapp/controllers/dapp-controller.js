import { DappService, FilterService } from '../services';
import pick from 'lodash.pick';
import AppError from '../../../utils/AppErrors.js';
import app from '../../../app';
import uuid from 'uuid/v4';
import {io} from '../../../server';
const organizations = ['0xe379894535aa72706396f9a3e1db6f3f5e4c1c15'];

export default {
  async getOrganization(ctx) {
    const data = await DappService.getOrganization(organizations[0]);
    ctx.body = { data };
  },

  async getCharityEvents(ctx) {
    const room = uuid();
    ctx.status = 200;
    ctx.res.end(room);
    DappService.getCharityEventAddressList(organizations[0], async (address) => {
      const ce = await DappService.singleCharityEvent(organizations[0], address);
      io.emit(room, JSON.stringify(ce));
    });
  },

  async getIncomingDonations(ctx) {
    const room = uuid();
    ctx.status = 200;
    ctx.res.end(room);
    DappService.getIncomingDonationAddressList(organizations[0], async (address) => {
      const id = await DappService.singleIncomingDonation(organizations[0], address);
      io.emit(room, JSON.stringify(id));
    });
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

    const room = uuid();
    ctx.status = 200;
    ctx.res.end(room);
    const fields = pick(ctx.request.body, FilterService.cardCharityEvent);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    DappService.getCharityEventAddressList(organizations[0], async (address) => {
      const ce = await DappService.singleCharityEvent(organizations[0], address);
      const filtered = (filtering) ? FilterService.filter(ce, fields) : ce;
      io.emit(room, JSON.stringify(filtered));
    });
  },

  async filterIncomingDonation(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);

    const room = uuid();
    ctx.status = 200;
    ctx.res.end(room);
    const fields = pick(ctx.request.body, FilterService.cardIncomingDonation);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    DappService.getIncomingDonationAddressList(organizations[0], async (address) => {
      const id = await DappService.singleIncomingDonation(organizations[0], address);
      const filtered = (filtering) ? FilterService.filter(id, fields) : id;
      io.emit(room, JSON.stringify(filtered));
    });
  },
};

