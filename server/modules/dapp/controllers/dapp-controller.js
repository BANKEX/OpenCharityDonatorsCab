import { FilterService, SearchService } from '../services';
import pick from 'lodash.pick';
import AppError from '../../../utils/AppErrors.js';
import DappService from '../../../services/dapp-service';
import uuid from 'uuid/v4';
import { Organization, CharityEvent, IncomingDonation } from '../index';
import { doWithAllCE, doWithAllID, getDataFromDB } from '../helpers';
import app from 'app';

export default {
  async getOrganizations(ctx) {
    if (ctx.query.how == 'bc' && app.state.web3) {
      ctx.body = 'Development';
    } else {
      ctx.body = await Organization.find().select({__v: 0, _id: 0});
    }
  },

  async getCharityEvents(ctx) {
    const org = (ctx.params.org=='all') ? {} : { ORGaddress: ctx.params.org };

    if (ctx.query.how == 'bc' && app.state.web3) {
      const orgFromDB = await Organization.find(org);
      if (orgFromDB.length) {
        let quantity = 0;
        orgFromDB.forEach((el) => quantity += el.charityEventCount);
        const room = uuid();
        ctx.body = { room, quantity };

        let i = 0;
        orgFromDB.forEach((org) => {
          doWithAllCE(org, (charityEvent) => {
            app.io.emit(room, JSON.stringify(charityEvent));
            i++;
            if (i == quantity) app.io.emit(room, 'close');
          });
        });
      }
    } else {
      ctx.body = await CharityEvent.find(org).select({__v: 0, _id: 0}).sort({date: -1});
    }
  },

  async getIncomingDonations(ctx) {
    const org = (ctx.params.org=='all') ? {} : { ORGaddress: ctx.params.org };

    if (ctx.query.how == 'bc' && app.state.web3) {
      const orgFromDB = await Organization.find(org);
      if (orgFromDB.length) {
        let quantity = 0;
        orgFromDB.forEach((el) => {
          quantity += el.incomingDonationCount;
        });
        const room = uuid();
        ctx.body = { room, quantity };

        let i = 0;
        orgFromDB.forEach((org) => {
          doWithAllID(org, (incomingDonation) => {
            app.io.emit(room, JSON.stringify(incomingDonation));
            i++;
            if (i == quantity) app.io.emit(room, 'close');
          });
        });
      }
    } else {
      ctx.body = await IncomingDonation.find(org).select({__v: 0, _id: 0}).sort({date: -1});
    }
  },

  async getCharityEvent(ctx) {
    if (ctx.query.how == 'bc' && app.state.web3) {
      const charityEvent = await DappService.singleCharityEvent(ctx.params.hash);
      const ext = await getDataFromDB(ctx.params.hash);
      charityEvent.date = ext.date;
      charityEvent.address = ext.charityEvent;
      charityEvent.ORGaddress = ext.ORGaddress;
      charityEvent.history = await DappService.getHistory(ext.ORGaddress, ext.charityEvent, 'CE');
      ctx.body = charityEvent;
    } else {
      ctx.body = await CharityEvent.findOne({ address: ctx.params.hash }).select({__v: 0, _id: 0}) || 'Not found';
    }
  },
  
  async getIncomingDonation(ctx) {
    if (ctx.query.how == 'bc' && app.state.web3) {
      const incomingDonation = await DappService.singleIncomingDonation(ctx.params.hash);
      const ext = await getDataFromDB(ctx.params.hash);
      incomingDonation.date = ext.date;
      incomingDonation.address = ext.incomingDonation;
      incomingDonation.ORGaddress = ext.ORGaddress;
      incomingDonation.history = await DappService.getHistory(ext.ORGaddress, ext.incomingDonation, 'ID');
      ctx.body = incomingDonation;
    } else {
      ctx.body = await IncomingDonation.findOne({ address: ctx.params.hash }).select({__v: 0, _id: 0}) || 'Not found';
    }
  },
  
  async filterCharityEvents(ctx) {
    if (ctx.request.header['content-type'] != 'application/json' &&
      ctx.request.header['content-type'] != 'application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (!app.state.web3) throw new AppError(406, 801);

    const fields = pick(ctx.request.body, FilterService.cardCharityEvent);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    const ORGsearch = (!ctx.request.body.ORGaddress)
      ? {}
      : {ORGaddress: ctx.request.body.ORGaddress};
    const ORGList = await Organization.find(ORGsearch);
    const room = uuid();
    let quantity = 0;
    ORGList.forEach((orgFromDB) => {
      quantity += orgFromDB.charityEventCount;
    });
    ctx.body = {room, quantity};

    let i = 0;
    ORGList.forEach((orgFromDB) => {
      doWithAllCE(orgFromDB, (charityEvent) => {
        const filtered = (filtering) ? FilterService.filter(charityEvent, fields) : charityEvent;
        app.io.emit(room, JSON.stringify(filtered));
        i++;
        if (i == quantity) app.io.emit(room, 'close');
      });
    });
  },

  async filterIncomingDonation(ctx) {
    if (!app.state.web3) throw new AppError(406, 801);
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);

    const fields = pick(ctx.request.body, FilterService.cardIncomingDonation);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    const ORGsearch = (!ctx.request.body.ORGaddress)
      ? {}
      : {ORGaddress: ctx.request.body.ORGaddress};
    const ORGList = await Organization.find(ORGsearch);
    const room = uuid();
    let quantity = 0;
    ORGList.forEach((orgFromDB) => {
      quantity += orgFromDB.incomingDonationCount;
    });
    ctx.body = { room, quantity };
    
    let i=0;
    ORGList.forEach((orgFromDB) => {
      doWithAllID(orgFromDB, (incomingDonation) => {
        const filtered = (filtering) ? FilterService.filter(incomingDonation, fields) : incomingDonation;
        app.io.emit(room, JSON.stringify(filtered));
        i++;
        if (i==quantity) app.io.emit(room, 'close');
      });
    });
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
    console.log(addresses);
    
    if (ctx.request.body.how == 'bc' && app.state.web3) {
      const room = uuid();
      const quantity = addresses.length;
      ctx.body = {room, quantity};
      if (quantity == 0) setTimeout(() => app.io.emit(room, 'close'), 1000);

      if (body.type == 'charityEvent') {
        let i = 0;
        addresses.forEach(async (address) => {
          const charityEvent = await DappService.singleCharityEvent(address);
          const ext = await getDataFromDB(address);
          charityEvent.date = ext.date;
          charityEvent.address = ext.charityEvent;
          charityEvent.ORGaddress = ext.ORGaddress;
          app.io.emit(room, JSON.stringify(charityEvent));
          i++;
          if (i == addresses.length) app.io.emit(room, 'close');
        });
      }
      if (body.type == 'incomingDonation') {
        let i = 0;
        addresses.forEach(async (address) => {
          const incomingDonation = await DappService.singleIncomingDonation(address);
          const ext = await getDataFromDB(address);
          incomingDonation.date = ext.date;
          incomingDonation.address = ext.incomingDonation;
          incomingDonation.ORGaddress = ext.ORGaddress;
          app.io.emit(room, JSON.stringify(incomingDonation));
          i++;
          if (i == addresses.length) app.io.emit(room, 'close');
        });
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
