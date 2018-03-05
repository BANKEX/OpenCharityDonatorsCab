import { DappService, FilterService, SearchService, SmartService } from '../services';
import pick from 'lodash.pick';
import AppError from '../../../utils/AppErrors.js';
import { io } from '../../../server';
import uuid from 'uuid/v4';
import { Organization } from '../models';
import { doWithAllCE, doWithAllID, getDataFromDB } from '../helpers';

export default {
  async getOrganizations(ctx) {
    ctx.body = await Organization.find().select({__v: 0, _id: 0});
  },

  async getCharityEvents(ctx) {
    const orgFromDB = await Organization.findOne({ ORGaddress: ctx.params.org });
    if (orgFromDB) {
      const room = uuid();
      ctx.status = 200;
      ctx.res.end(room);
      let i=0;
      doWithAllCE(orgFromDB, (charityEvent) => {
        io.emit(room, JSON.stringify(charityEvent));
        i++;
        if (i==orgFromDB.charityEventCount) io.emit(room, 'close');
      });
    }
  },

  async getIncomingDonations(ctx) {
    const orgFromDB = await Organization.findOne({ ORGaddress: ctx.params.org });
    if (orgFromDB) {
      const room = uuid();
      ctx.status = 200;
      ctx.res.end(room);
      let i=0;
      doWithAllID(orgFromDB, (incomingDonation) => {
        io.emit(room, JSON.stringify(incomingDonation));
        i++;
        if (i==orgFromDB.incomingDonationCount) io.emit(room, 'close');
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
    const room = uuid();
    ctx.status = 200;
    ctx.res.end(room);

    const fields = pick(ctx.request.body, FilterService.cardCharityEvent);
    const filtering = Object.getOwnPropertyNames(fields).length != 0;
    const ORGsearch = (!ctx.request.body.ORGaddress)
      ? {}
      : {ORGaddress: ctx.request.body.ORGaddress};
    const ORGList = await Organization.find(ORGsearch);
    let i=0;
    let allCE=0;
    ORGList.forEach((orgFromDB) => {
      allCE+=orgFromDB.charityEventCount;
      doWithAllCE(orgFromDB, (charityEvent) => {
        const filtered = (filtering) ? FilterService.filter(charityEvent, fields) : charityEvent;
        io.emit(room, JSON.stringify(filtered));
        i++;
        if (i==allCE) io.emit(room, 'close');
      });
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
    const ORGsearch = (!ctx.request.body.ORGaddress)
      ? {}
      : {ORGaddress: ctx.request.body.ORGaddress};
    const ORGList = await Organization.find(ORGsearch);
    let i=0;
    let allID=0;
    ORGList.forEach((orgFromDB) => {
      allID+=orgFromDB.incomingDonationCount;
      doWithAllID(orgFromDB, (incomingDonation) => {
        const filtered = (filtering) ? FilterService.filter(incomingDonation, fields) : incomingDonation;
        io.emit(room, JSON.stringify(filtered));
        i++;
        if (i==allID) io.emit(room, 'close');
      });
    });
  },

  async search(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    ctx.body = await SearchService.search(ctx.request.body);
  },
  
  async smarts(ctx) {
    ctx.body = (ctx.params.name == '')
      ? SmartService.getListFromDir()
      : SmartService.getFile(ctx.params.name);
  },
};
