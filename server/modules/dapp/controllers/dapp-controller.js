import { DappService, FilterService, SearchService, SmartService } from '../services';
import pick from 'lodash.pick';
import AppError from '../../../utils/AppErrors.js';
import { io } from '../../../server';
import uuid from 'uuid/v4';
import { Organization, Metamap } from '../models';
import { doWithAllCE, doWithAllID, getDataFromDB } from '../helpers';

export default {
  async getOrganizations(ctx) {
    ctx.body = await Organization.find().select({__v: 0, _id: 0});
  },

  async getCharityEvents(ctx) {
    const orgFromDB = await Organization.findOne({ ORGaddress: ctx.params.org });
    if (orgFromDB) {
      const room = uuid();
      const quantity = orgFromDB.charityEventCount;
      ctx.body = { room, quantity };
      let i=0;
      doWithAllCE(orgFromDB, (charityEvent) => {
        io.emit(room, JSON.stringify(charityEvent));
        i++;
        if (i==quantity) io.emit(room, 'close');
      });
    }
  },

  async getIncomingDonations(ctx) {
    const orgFromDB = await Organization.findOne({ ORGaddress: ctx.params.org });
    if (orgFromDB) {
      const room = uuid();
      const quantity = orgFromDB.incomingDonationCount;
      ctx.body = { room, quantity };
      let i=0;
      doWithAllID(orgFromDB, (incomingDonation) => {
        io.emit(room, JSON.stringify(incomingDonation));
        i++;
        if (i==quantity) io.emit(room, 'close');
      });
    }
  },

  async getCharityEvent(ctx) {
    const charityEvent = await DappService.singleCharityEvent(ctx.params.hash);
    const ext = await getDataFromDB(ctx.params.hash);
    charityEvent.date = ext.date;
    charityEvent.address = ext.charityEvent;
    charityEvent.ORGaddress = ext.ORGaddress;
    charityEvent.history = await DappService.getHistory(ext.ORGaddress, ext.charityEvent, 'CE');
    ctx.body = charityEvent;
  },
  
  async getIncomingDonation(ctx) {
    const incomingDonation = await DappService.singleIncomingDonation(ctx.params.hash);
    const ext = await getDataFromDB(ctx.params.hash);
    incomingDonation.date = ext.date;
    incomingDonation.address = ext.incomingDonation;
    incomingDonation.ORGaddress = ext.ORGaddress;
    incomingDonation.history = await DappService.getHistory(ext.ORGaddress, ext.incomingDonation, 'ID');
    ctx.body = incomingDonation;
  },
  
  async filterCharityEvents(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    
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
    ctx.body = { room, quantity };
    
    let i=0;
    ORGList.forEach((orgFromDB) => {
      doWithAllCE(orgFromDB, (charityEvent) => {
        const filtered = (filtering) ? FilterService.filter(charityEvent, fields) : charityEvent;
        io.emit(room, JSON.stringify(filtered));
        i++;
        if (i==quantity) io.emit(room, 'close');
      });
    });
  },

  async filterIncomingDonation(ctx) {
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
        io.emit(room, JSON.stringify(filtered));
        i++;
        if (i==quantity) io.emit(room, 'close');
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

    const documents = JSON.parse(await SearchService.search(body));

    const addresses = [];
    await Promise.all(documents.map(async (doc) => {
      let docAddress = doc.id;
      if (doc.id.indexOf('Qm')==0) {
        const metamap = await Metamap.findOne({ hash: doc.id });
        docAddress = (metamap) ? metamap.address : false;
      }
      
      if (docAddress) {
        if (addresses.indexOf(docAddress) == -1) addresses.push(docAddress);
      } else {
        console.log('No address');
      }
      return true;
    }));

    const room = uuid();
    const quantity = addresses.length;
    ctx.body = { room, quantity };

    if (body.type == 'charityEvent') {
      let i=0;
      addresses.forEach(async (address) => {
        const charityEvent = await DappService.singleCharityEvent(address);
        const ext = await getDataFromDB(address);
        charityEvent.date = ext.date;
        charityEvent.address = ext.charityEvent;
        charityEvent.ORGaddress = ext.ORGaddress;
        io.emit(room, JSON.stringify(charityEvent));
        i++;
        if (i==addresses.length) io.emit(room, 'close');
      });
    }
    if (body.type == 'incomingDonation') {
      let i=0;
      addresses.forEach(async (address) => {
        const incomingDonation = await DappService.singleIncomingDonation(address);
        const ext = await getDataFromDB(address);
        incomingDonation.date = ext.date;
        incomingDonation.address = ext.incomingDonation;
        incomingDonation.ORGaddress = ext.ORGaddress;
        io.emit(room, JSON.stringify(incomingDonation));
        i++;
        if (i==addresses.length) io.emit(room, 'close');
      });
    }
  },
  
  async smarts(ctx) {
    ctx.body = (ctx.params.name == 'all')
      ? SmartService.getListFromDir()
      : SmartService.getFile(ctx.params.name);
  },
};
