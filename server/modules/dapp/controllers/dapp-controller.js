import { FilterService, SearchService } from '../services';
import pick from 'lodash.pick';
import AppError from '../../../utils/AppErrors.js';
import DappService from '../../../services/dapp-service';
import uuid from 'uuid/v4';
import { Organization, CharityEvent, IncomingDonation } from '../index';
import app from 'app';

const getMany = async (ctx, type) => {
  const options = {
    'CE': {
      count: 'charityEventCount',
      collection: CharityEvent,
    },
    'ID': {
      count: 'incomingDonationCount',
      collection: IncomingDonation,
    },
  };

  if (ctx.query.how == 'bc' && app.state.web3) {
    const listORG = (ctx.params.org == 'all') ? app.state.initList.list : [ctx.params.org];
    let quantity = 0;
    await Promise.all(listORG.map(async (ORGaddress) => {
      const org = await DappService.singleOrganization(ORGaddress);
      quantity += Number(org[options[type].count]);
      return null;
    }));
    const room = uuid();
    ctx.body = { room, quantity };

    let i = 0;
    listORG.forEach(async (ORGaddress) => {
      const list = await DappService.getAddresses(ORGaddress, type);
      list.forEach(async (address) => {
        const res = await DappService.getFullObject(address, null, type, ORGaddress);
        app.io.emit(room, JSON.stringify(res));
        i++;
        if (i == quantity) app.io.emit(room, 'close');
      });
    });
  } else {
    const org = (ctx.params.org == 'all') ? {} : { ORGaddress: ctx.params.org };
    ctx.body = await options[type].collection.find(org).select({__v: 0, _id: 0}).sort({date: -1});
  }
};

const getOne = async (ctx, type) => {
  const options = {
    'CE': {
      type: 'charityEvent',
      collection: CharityEvent,
    },
    'ID': {
      type: 'incomingDonation',
      collection: IncomingDonation,
    },
  };

  if (ctx.query.how == 'bc' && app.state.web3) {
    const res = await DappService.getFullObject(ctx.params.hash, null, type, null);
    res.history = await DappService.getHistory(res.ORGaddress, res.address, type);
    ctx.body = res;
  } else {
    const res = (await options[type].collection.findOne({ address: ctx.params.hash }).select({__v: 0, _id: 0})).toObject();
    if (res) {
      res.history = await DappService.getHistory(res.ORGaddress, res.address, type);
    }
    ctx.body = res || 'Not found';
  }
};

const filter = async (ctx, type) => {
  const options = {
    'CE': {
      card: 'cardCharityEvent',
      collection: CharityEvent,
    },
    'ID': {
      card: 'cardIncomingDonation',
      collection: IncomingDonation,
    },
  };

  if (ctx.request.header['content-type'] != 'application/json' &&
    ctx.request.header['content-type'] != 'application/x-www-form-urlencoded') throw new AppError(400, 10);

  const fields = pick(ctx.request.body, FilterService[options[type].card]);
  const filtering = Object.getOwnPropertyNames(fields).length != 0;
  const ORGsearch = (!ctx.request.body.ORGaddress)
    ? {}
    : {ORGaddress: ctx.request.body.ORGaddress};

  const all = await options[type].collection.find(ORGsearch).select({__v: 0, _id: 0});
  const res = [];
  await Promise.all(all.map((obj) => {
    const filtered = (filtering) ? FilterService.filter(obj, fields) : obj;
    if (filtered) res.push(filtered);
    return null;
  }));
  ctx.body = res;
};

export default {
  async getOrganizations(ctx) {
    if (ctx.query.how == 'bc' && app.state.web3) {
      const room = uuid();
      const quantity = app.state.initList.list.length;
      ctx.body = { room, quantity };

      let i = 0;
      app.state.initList.list.forEach(async (ORGaddress) => {
        const orgData = await DappService.singleOrganization(ORGaddress);
        orgData.ORGaddress = ORGaddress;
        app.io.emit(room, JSON.stringify(orgData));
        i++;
        if (i == quantity) app.io.emit(room, 'close');
      });
    } else {
      ctx.body = await Organization.find().select({__v: 0, _id: 0});
    }
  },

  async getCharityEvents(ctx) {
    await getMany(ctx, 'CE');
  },

  async getIncomingDonations(ctx) {
    await getMany(ctx, 'ID');
  },

  async getCharityEvent(ctx) {
    await getOne(ctx, 'CE');
  },
  
  async getIncomingDonation(ctx) {
    await getOne(ctx, 'ID');
  },
  
  async filterCharityEvents(ctx) {
    await filter(ctx, 'CE');
  },

  async filterIncomingDonation(ctx) {
    await filter(ctx, 'ID');
  },

  async search(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    const body = ctx.request.body;
    if (!body.searchRequest) throw new AppError(406, 601);
    if (typeof body.searchRequest!='string') throw new AppError(406, 620);
    if (body.type) {
      if (typeof body.type!='string') throw new AppError(406, 620);
    }
    if (body.addition) {
      if (!Array.isArray(body.addition)) throw new AppError(406, 620);
    }
    if (body.pageSize) {
      if (!Number.isInteger(body.pageSize)) throw new AppError(406, 620);
    }
    if (body.page) {
      if (!Number.isInteger(body.page) || body.page<1) throw new AppError(406, 620);
    }
    const addresses = JSON.parse(await SearchService.search(body));
    
    if (ctx.request.body.how == 'bc' && app.state.web3) {
      const room = uuid();
      const quantity = addresses.length;
      ctx.body = {room, quantity};
      if (quantity == 0) setTimeout(() => app.io.emit(room, 'close'), 1000);

      const type = (body.type == 'charityEvent')
        ? 'CE'
        : (body.type == 'incomingDonation')
          ? 'ID'
          : undefined;

      if (type) {
        let i = 0;
        addresses.forEach(async (address) => {
          const res = await DappService.getFullObject(address, null, type, null);
          app.io.emit(room, JSON.stringify(res));
          i++;
          if (i == addresses.length) app.io.emit(room, 'close');
        });
      } else {
        console.log('type - undefined');
        setTimeout(() => app.io.emit(room, 'close'), 1000);
      }
    } else {
      ctx.body = (body.type == 'charityEvent')
        ? await CharityEvent.find({ address: addresses}).select({__v: 0, _id: 0}).sort({date: -1})
        : (body.type == 'incomingDonation')
        ? await IncomingDonation.find({ address: addresses}).select({__v: 0, _id: 0}).sort({date: -1})
        : [];
    }
  },
  
};
