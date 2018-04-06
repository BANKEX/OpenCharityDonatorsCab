import { DAPP, INTERVALS } from 'configuration';
import app from 'app';
import { Organization, CharityEvent, IncomingDonation } from '../modules/dapp';

const init = async () => {
  app.state.previousORG = app.state.actualORG;
  app.state.actualORG = app.state.initList.list;
  app.state.token = new app.state.web3.eth.Contract(app.state.initList.abis['OpenCharityToken'], DAPP.token);
  await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
    const orgData = await singleOrganization(ORGaddress);
    orgData.ORGaddress = ORGaddress;
    const orgFromDB = await Organization.findOne({ ORGaddress });
    if (orgFromDB) {
      await Organization.update({ ORGaddress }, orgData);
    } else {
      await Organization.create(orgData);
    }
    return null;
  }));

  await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
    const CEAddressList = await getCharityEventAddressList(ORGaddress);
    const IDAddressList = await getIncomingDonationAddressList(ORGaddress);
    await Organization.update({ORGaddress}, { CEAddressList, IDAddressList });
    return null;
  }));

  await Organization.deleteMany({ORGaddress: { '$nin': app.state.initList.list }});
  await CharityEvent.deleteMany({ORGaddress: { '$nin': app.state.initList.list }});
  await IncomingDonation.deleteMany({ORGaddress: { '$nin': app.state.initList.list }});

  const newORG = app.state.actualORG.filter(el => (!app.state.previousORG.includes(el)));
  subscribe(newORG);
};

const extractTags = (mask) => {
  return mask;
};

const CharityEventObjectExt = async (event) => {
  const _this = {};
  _this.address = event.returnValues.charityEvent;
  _this.ORGaddress = event.address;
  const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
  _this.date = (new Date(timestamp * 1000)).toLocaleString();
  const charityEventObject = await singleCharityEvent(_this.address);
  Object.getOwnPropertyNames(charityEventObject).forEach((key) => {
    _this[key] = charityEventObject[key];
  });
  _this.forCEaddressList = JSON.stringify({
    charityEvent: _this.address,
    date: _this.date,
  });
  return _this;
};
const IncomingDonationObjectExt = async (event) => {
  const _this = {};
  _this.address = event.returnValues.incomingDonation;
  _this.ORGaddress = event.address;
  const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
  _this.date = (new Date(timestamp * 1000)).toLocaleString();
  const incomingDonationObject = await singleIncomingDonation(_this.address);
  Object.getOwnPropertyNames(incomingDonationObject).forEach((key) => {
    _this[key] = incomingDonationObject[key];
  });
  _this.forIDaddressList = JSON.stringify({
    incomingDonation: _this.address,
    date: _this.date,
  });
  return _this;
};

// singles for init, controller, helper, events
const singleOrganization = async (ORGaddress) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const name = await ORGcontract.methods.name().call();
  const charityEventCount = await ORGcontract.methods.charityEventCount().call();
  const incomingDonationCount = await ORGcontract.methods.incomingDonationCount().call();
  return { name, charityEventCount, incomingDonationCount };
};
const singleCharityEvent = async (CEaddress) => {
  const CEcontract = new app.state.web3.eth.Contract(app.state.initList.abis['CharityEvent'], CEaddress);
  const name = await CEcontract.methods.name().call();
  const payed = await CEcontract.methods.payed().call();
  const target = await CEcontract.methods.target().call();
  const tags = await CEcontract.methods.tags().call();
  const metaStorageHash = await CEcontract.methods.metaStorageHash().call();
  const raised = await app.state.token.methods.balanceOf(CEaddress).call();
  return { name, payed, target, raised, tags, metaStorageHash };
};
const singleIncomingDonation = async (IDaddress) => {
  const IDcontract = new app.state.web3.eth.Contract(app.state.initList.abis['IncomingDonation'], IDaddress);
  const realWorldIdentifier = await IDcontract.methods.realWorldIdentifier().call();
  const note = await IDcontract.methods.note().call();
  const tags = await IDcontract.methods.tags().call();
  const amount = await app.state.token.methods.balanceOf(IDaddress).call();
  return { realWorldIdentifier, amount, note, tags };
};

// only for controller
const getHistory = async (ORGaddress, address, type) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const filter = (type=='CE')
  ? { charityEvent: address }
  : { incomingDonation: address };
  const events = await ORGcontract.getPastEvents('FundsMovedToCharityEvent', {
    fromBlock: 0,
    filter,
  });
  return await Promise.all(events.map(async (event) => {
    const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
    const date = (new Date(timestamp * 1000)).toLocaleString();
    const transactionHash = event.transactionHash;
    const { incomingDonation, charityEvent, amount } = event.returnValues;
    const data = (type=='CE')
    ? { incomingDonation, amount, date, transactionHash }
    : { charityEvent, amount, date, transactionHash };
    return JSON.stringify(data);
  }));
};

// only for init
const getCharityEventAddressList = async (ORGaddress) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const added = await ORGcontract.getPastEvents('CharityEventAdded', {fromBlock: 0});
  // let batch = [];
  const CEaddressList = await Promise.all(added.map(async (event) => {
    const charityEventObjectExt = await CharityEventObjectExt(event);
    const ce = await CharityEvent.findOne({address: charityEventObjectExt.address});
    if (!ce) await CharityEvent.create(charityEventObjectExt);

    return charityEventObjectExt.forCEaddressList;
  }));

  // const edited = await ORGcontract.getPastEvents('CharityEventEdited', {fromBlock: 0});
  // здесь что-то делаем с edited
  /*
  const metaUpdated = await ORGcontract.getPastEvents('MetaStorageHashUpdated', {fromBlock: 0});
  const update = await Promise.all(metaUpdated.map(async (event) => {
    console.log(event);
    const ORGaddress = event.address;
    const { ownerAddress, metaStorageHash } = event.returnValues;

    // update Metamap

    return true;
  }));
  */
  return CEaddressList;
};
const getIncomingDonationAddressList = async (ORGaddress) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress.toLowerCase());
  const added = await ORGcontract.getPastEvents('IncomingDonationAdded', {fromBlock: 0});

  const IDaddressList = await Promise.all(added.map(async (event) => {
    const incomingDonationObjectExt = await IncomingDonationObjectExt(event);
    const id = await IncomingDonation.findOne({address: incomingDonationObjectExt.address});
    if (!id) await IncomingDonation.create(incomingDonationObjectExt);
    
    return incomingDonationObjectExt.forIDaddressList;
  }));
  // SearchService.addBatchToLine(batch);
  return IDaddressList;
};
const subscribe = async (_ORGAddressList) => {
  const charityEventAdded = async (event) => {
    console.log(new Date().toLocaleString());
    const charityEventObjectExt = await CharityEventObjectExt(event);
    const orgFromDB = await Organization.findOne({ ORGaddress: charityEventObjectExt.ORGaddress });
    if (orgFromDB) {
      const { _id, CEAddressList } = orgFromDB;
      CEAddressList.push(charityEventObjectExt.forCEaddressList);
      const charityEventCount = orgFromDB.charityEventCount+1;
      await Organization.update({ _id }, { CEAddressList, charityEventCount });
      app.io.emit('newCharityEvent', JSON.stringify(charityEventObjectExt));
    } else {
      console.error('Organization not found');
    }
    console.log(charityEventObjectExt);
  };
  const incomingDonationAdded = async (event) => {
    console.log(new Date().toLocaleString());
    const incomingDonationObjectExt = await IncomingDonationObjectExt(event);
    const orgFromDB = await Organization.findOne({ORGaddress: incomingDonationObjectExt.ORGaddress});
    if (orgFromDB) {
      const { _id, IDAddressList } = orgFromDB;
      IDAddressList.push(incomingDonationObjectExt.forIDaddressList);
      const incomingDonationCount = orgFromDB.incomingDonationCount+1;
      await Organization.update({ _id }, { IDAddressList, incomingDonationCount });
      app.io.emit('newIncomingDonation', JSON.stringify(incomingDonationObjectExt));
    } else {
      console.error('Organization not found');
    }
    console.log(incomingDonationObjectExt);
  };
  const fundsMovedToCharityEvent = async (event) => {
    console.log(new Date().toLocaleString());
    const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
    const date = (new Date(timestamp * 1000)).toLocaleString();
    const ORGaddress = event.address;
    const { incomingDonation, charityEvent, amount } = event.returnValues;
    const ce = await CharityEvent.findOne({ address: charityEvent });
    const id = await IncomingDonation.findOne({ address: incomingDonation });
    await CharityEvent.update({ address: ce.address }, { raised: ce.raised + Number(amount) });
    await IncomingDonation.update({ address: id.address }, { amount: id.amount - Number(amount) });
    app.io.emit('moveFunds', JSON.stringify({ ORGaddress, incomingDonation, charityEvent, amount, date }));
    console.log(`${incomingDonation}--(${amount})-->${charityEvent}`);
  };
  const metaStorageHashUpdated = async (event) => {
    console.log(new Date().toLocaleString());
    console.log('MetaUpdated');
    const ORGaddress = event.address;
    const { ownerAddress, metaStorageHash } = event.returnValues;
    // edit DB
  };
  
  _ORGAddressList.forEach(async (ORGaddress) => {
    const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
    ORGcontract.events.CharityEventAdded({ fromBlock: 'latest' }).on('data', charityEventAdded);
    ORGcontract.events.IncomingDonationAdded({ fromBlock: 'latest' }).on('data', incomingDonationAdded);
    ORGcontract.events.FundsMovedToCharityEvent({ fromBlock: 'latest' }).on('data', fundsMovedToCharityEvent);
    ORGcontract.events.MetaStorageHashUpdated({ fromBlock: 'latest' }).on('data', metaStorageHashUpdated);
  });
};

export default {
  init,
  singleOrganization,
  singleCharityEvent,
  singleIncomingDonation,
  getHistory,
};
