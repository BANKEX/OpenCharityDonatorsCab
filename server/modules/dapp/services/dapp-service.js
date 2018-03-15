import { DIRS, DAPP, INTERVALS } from 'configuration';
import SearchService from './search-service';
import OrgService from './orgs-service';
import { Organization, Metamap } from '../models';
import { io } from '../../../server';
import init from '../init';
import Web3 from 'web3';

const refreshABI = {};
let web3;
let TOKENcontract;
let int;

const abi = (type) => {
  if (!refreshABI[type]) {
    refreshABI[type] = setTimeout((type)=>{
      delete require.cache[require.resolve(DIRS.abi+type)];
      delete refreshABI[type];
    }, INTERVALS.refreshSmartContracts, type);
  }
  return require(DIRS.abi+type).abi;
};

// singles for init, controller, helper, events
const singleOrganization = async (ORGaddress) => {
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const name = await ORGcontract.methods.name().call();
  const charityEventCount = await ORGcontract.methods.charityEventCount().call();
  const incomingDonationCount = await ORGcontract.methods.incomingDonationCount().call();
  return { name, charityEventCount, incomingDonationCount };
};
const singleCharityEvent = async (CEaddress) => {
  const CEcontract = new web3.eth.Contract(abi('CharityEvent.json'), CEaddress);
  const name = await CEcontract.methods.name().call();
  const payed = await CEcontract.methods.payed().call();
  const target = await CEcontract.methods.target().call();
  const tags = await CEcontract.methods.tags().call();
  const metaStorageHash = await CEcontract.methods.metaStorageHash().call();
  const raised = await TOKENcontract.methods.balanceOf(CEaddress).call();
  return { name, payed, target, raised, tags, metaStorageHash };
};
const singleIncomingDonation = async (IDaddress) => {
  const IDcontract = new web3.eth.Contract(abi('IncomingDonation.json'), IDaddress);
  const realWorldIdentifier = await IDcontract.methods.realWorldIdentifier().call();
  const note = await IDcontract.methods.note().call();
  const tags = await IDcontract.methods.tags().call();
  const amount = await TOKENcontract.methods.balanceOf(IDaddress).call();
  return { realWorldIdentifier, amount, note, tags };
};

// only for controller
const getHistory = async (ORGaddress, address, type) => {
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const filter = (type=='CE')
  ? { charityEvent: address }
  : { incomingDonation: address };
  const events = await ORGcontract.getPastEvents('FundsMovedToCharityEvent', {
    fromBlock: 0,
    filter,
  });
  return await Promise.all(events.map(async (event) => {
    const { timestamp } = await web3.eth.getBlock(event.blockHash);
    const date = (new Date(timestamp * 1000)).toLocaleString();
    const transactionHash = event.transactionHash;
    const { incomingDonation, charityEvent, amount } = event.returnValues;
    const data = (type=='CE')
    ? { incomingDonation, amount, date, transactionHash }
    : { charityEvent, amount, date, transactionHash };
    return JSON.stringify(data);
  }));
};

// only for subscribe
const extractTags = (mask) => {
  return mask;
};

function DappObject(type, objExt) {
  const titleTypes = {
    charityEvent: 'name',
    incomingDonation: 'realWorldIdentifier',
  };
  this.type = type;
  this.searchDescription = extractTags(objExt.tags);
  this.data = {
    title: objExt[titleTypes[type]],
    address: objExt.address,
    ORGaddress: objExt.ORGaddress,
  };
  this.id = objExt.address;
}

const CharityEventObjectExt = async (event) => {
  const _this = {};
  _this.address = event.returnValues.charityEvent;
  _this.ORGaddress = event.address;
  const { timestamp } = await web3.eth.getBlock(event.blockHash);
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
  const { timestamp } = await web3.eth.getBlock(event.blockHash);
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

function MetamapObject(objExt) {
  this.address = objExt.address;
  this.hash = objExt.metaStorageHash;
}

const reconnect = () => {
  const reconInt = setInterval(async () => {
    web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
    TOKENcontract = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
    try {
      await web3.eth.getBlockNumber().then(console.log);
      console.log('socket reconnected');
      clearInterval(reconInt);
      init();
    } catch (err) {
      console.log('socket connection lost');
    }
  }, INTERVALS.dapp.reconnection);
};
const charityEventAdded = async (event) => {
  console.log(new Date().toLocaleString());
  const charityEventObjectExt = await CharityEventObjectExt(event);

  await Metamap.create(new MetamapObject(charityEventObjectExt));
  await SearchService.addDataToIndex(new DappObject('charityEvent', charityEventObjectExt));

  const orgFromDB = await Organization.findOne({ ORGaddress: charityEventObjectExt.ORGaddress });
  if (orgFromDB) {
    const { _id, CEAddressList } = orgFromDB;
    CEAddressList.push(charityEventObjectExt.forCEaddressList);
    const charityEventCount = orgFromDB.charityEventCount+1;
    await Organization.update({ _id }, { CEAddressList, charityEventCount });
    io.emit('newCharityEvent', JSON.stringify(charityEventObjectExt));
  } else {
    console.error('Organization not found');
  }
  console.log(charityEventObjectExt);
};
const incomingDonationAdded = async (event) => {
  console.log(new Date().toLocaleString());
  const { timestamp } = await web3.eth.getBlock(event.blockHash);
  const date = (new Date(timestamp * 1000)).toLocaleString();
  const organization = event.address;
  const { incomingDonation } = event.returnValues;
  const dataForSearch = await singleIncomingDonation(incomingDonation);
  dataForSearch.address = incomingDonation;
  dataForSearch.date = date;
  dataForSearch.ORGaddress = organization;
  SearchService.addDataToIndex(dataForSearch);
  const orgFromDB = await Organization.findOne({ORGaddress: organization});
  if (orgFromDB) {
    const { _id, IDAddressList } = orgFromDB;
    const forPush = JSON.stringify({
      incomingDonation: incomingDonation,
      date: date,
    });
    IDAddressList.push(forPush);
    const incomingDonationCount = orgFromDB.incomingDonationCount+1;
    await Organization.update({ _id }, { IDAddressList, incomingDonationCount });
    io.emit('newIncomingDonation', JSON.stringify(dataForSearch));
  } else {
    console.error('Organization not found');
  }
  console.log(dataForSearch);
};
const fundsMovedToCharityEvent = async (event) => {
  console.log(new Date().toLocaleString());
  const { timestamp } = await web3.eth.getBlock(event.blockHash);
  const date = (new Date(timestamp * 1000)).toLocaleString();
  const ORGaddress = event.address;
  const { incomingDonation, charityEvent, amount } = event.returnValues;
  io.emit('moveFunds', JSON.stringify({ ORGaddress, incomingDonation, charityEvent, amount, date }));
  console.log(`${incomingDonation}--(${amount})-->${charityEvent}`);
};
const metaStorageHashUpdated = async (event) => {
  console.log(new Date().toLocaleString());
  console.log('MetaUpdated');
  const ORGaddress = event.address;
  const { ownerAddress, metaStorageHash } = event.returnValues;
  // edit DB
};

// only for init
const getOrganizationAddressList = async () => {
  if (!web3) web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
  if (!TOKENcontract) TOKENcontract = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
  return await OrgService.getOrgs();
};
const getCharityEventAddressList = async (ORGaddress) => {
  console.log('getCharityEventAddressList');
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const added = await ORGcontract.getPastEvents('CharityEventAdded', {fromBlock: 0});
  const CEaddressList = await Promise.all(added.map(async (event) => {
    const charityEventObjectExt = await CharityEventObjectExt(event);
    const metamap = await Metamap.findOne({ address: charityEventObjectExt.address });
    if (!metamap) {
      await Metamap.create(new MetamapObject(charityEventObjectExt));
      console.log(`MetaObject created ${charityEventObjectExt.address} - ${charityEventObjectExt.metaStorageHash}`);
    }
    // console.log(await SearchService.delDataFromIndex([charityEventObjectExt.address])); // if exists
    setTimeout(() => {
      SearchService.addDataToIndex(new DappObject('charityEvent', charityEventObjectExt));
    }, Math.floor(Math.random()*5000));
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
  console.log('getIncomingDonationAddressList');
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const added = await ORGcontract.getPastEvents('IncomingDonationAdded', {fromBlock: 0});
  const IDaddressList = await Promise.all(added.map(async (event) => {
    const incomingDonationObjectExt = await IncomingDonationObjectExt(event);
    /*
    const metamap = await Metamap.findOne({ address: incomingDonationObjectExt.address });
    if (!metamap) {
      await Metamap.create(new MetamapObject(incomingDonationObjectExt));
      console.log(`MetaObject created ${incomingDonationObjectExt.address} - ${incomingDonationObjectExt.metaStorageHash}`);
    }
    */
    // console.log(await SearchService.delDataFromIndex([charityEventObjectExt.address])); // if exists
    setTimeout(() => {
      SearchService.addDataToIndex(new DappObject('incomingDonation', incomingDonationObjectExt));
    }, Math.floor(Math.random()*5000));
    return incomingDonationObjectExt.forIDaddressList;
  }));

  return IDaddressList;
};
const subscribe = async (_ORGAddressList) => {
  console.log('subscribe start');
  int = setInterval(async () => {
    await web3.eth.getBlockNumber().then(console.log);
  }, INTERVALS.dapp.checkConnection);
  web3.eth.subscribe('logs', {}, async (error, log) => {
    if (error) {
      if (error.type == 'close') {
        console.log(new Date().toLocaleString());
        console.log('socket connection lost');
        clearInterval(int);
        reconnect();
      } else {
        console.log(new Date().toLocaleString());
        console.error(error);
      }
    } else {
      console.log('log - ' + new Date().toLocaleString());
      console.log(log);
    }
  });

  _ORGAddressList.forEach(async (ORGaddress) => {
    console.log('listeners for '+ORGaddress);
    const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
    ORGcontract.events.CharityEventAdded({ fromBlock: 'latest' }).on('data', charityEventAdded);
    ORGcontract.events.IncomingDonationAdded({ fromBlock: 'latest' }).on('data', incomingDonationAdded);
    ORGcontract.events.FundsMovedToCharityEvent({ fromBlock: 'latest' }).on('data', fundsMovedToCharityEvent);
    ORGcontract.events.MetaStorageHashUpdated({ fromBlock: 'latest' }).on('data', metaStorageHashUpdated);
  });
};

export default {
  subscribe,
  getOrganizationAddressList,
  getCharityEventAddressList,
  getIncomingDonationAddressList,
  singleOrganization,
  singleCharityEvent,
  singleIncomingDonation,
  getHistory,
};
