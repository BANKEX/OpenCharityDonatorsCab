import { DIRS, DAPP, INTERVALS } from 'configuration';
import SearchService from './search-service';
import { Organization } from '../models';
import { io } from '../../../server';
import init from '../init';
import Web3 from 'web3';
const abi = (type) => (require(DIRS.abi+type).abi);

let web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
let TOKENcontract = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
let int;

const reconnect = () => {
  const reconInt = setInterval(async () => {
    web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
    TOKENcontract = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
    try {
      await web3.eth.getBlockNumber().then(console.log);
      console.log('socket reconnect');
      clearInterval(reconInt);
      init();
    } catch (err) {
      console.log('socket connection lost');
    }
  }, INTERVALS.dapp.reconnection);
};

const subscribe = async (_ORGAddressList) => {
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
      console.log(log);
    }
  });

  _ORGAddressList.forEach(async (ORGaddress) => {
    console.log('listeners for '+ORGaddress);
    const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
    ORGcontract.events.CharityEventAdded({ fromBlock: 'latest' }).on('data', async (event) => {
      console.log(new Date().toLocaleString());
      const { timestamp } = await web3.eth.getBlock(event.blockHash);
      const date = (new Date(timestamp * 1000)).toLocaleString();
      const organization = event.address.toLowerCase();
      const { charityEvent } = event.returnValues;
      const dataForSearch = await singleCharityEvent(charityEvent);
      dataForSearch.address = charityEvent.toLowerCase();
      dataForSearch.date = date;
      dataForSearch.ORGaddress = organization;
      SearchService.addDataToIndex(dataForSearch);
      const orgFromDB = await Organization.findOne({ORGaddress: organization.toLowerCase()});
      if (orgFromDB) {
        const { _id, CEAddressList } = orgFromDB;
        const forPush = JSON.stringify({
          charityEvent: charityEvent.toLowerCase(),
          date: date,
        });
        CEAddressList.push(forPush);
        const charityEventCount = orgFromDB.charityEventCount+1;
        await Organization.update({ _id }, { CEAddressList, charityEventCount });
        io.emit('newCharityEvent', JSON.stringify(dataForSearch));
      } else {
        console.error('Organization not found');
      }
    });
    ORGcontract.events.IncomingDonationAdded({ fromBlock: 'latest' }).on('data', async (event) => {
      console.log(new Date().toLocaleString());
      const { timestamp } = await web3.eth.getBlock(event.blockHash);
      const date = (new Date(timestamp * 1000)).toLocaleString();
      const organization = event.address.toLowerCase();
      const { incomingDonation } = event.returnValues;
      const dataForSearch = await singleIncomingDonation(incomingDonation);
      dataForSearch.address = incomingDonation.toLowerCase();
      dataForSearch.date = date;
      dataForSearch.ORGaddress = organization;
      SearchService.addDataToIndex(dataForSearch);
      const orgFromDB = await Organization.findOne({ORGaddress: organization.toLowerCase()});
      if (orgFromDB) {
        const { _id, IDAddressList } = orgFromDB;
        const forPush = JSON.stringify({
          incomingDonation: incomingDonation.toLowerCase(),
          date: date,
        });
        IDAddressList.push(forPush);
        const incomingDonationCount = orgFromDB.incomingDonationCount+1;
        await Organization.update({ _id }, { IDAddressList, incomingDonationCount });
        io.emit('newIncomingDonation', JSON.stringify(dataForSearch));
      } else {
        console.error('Organization not found');
      }
    });
    ORGcontract.events.FundsMovedToCharityEvent({ fromBlock: 'latest' }).on('data', async (event) => {
      console.log(new Date().toLocaleString());
      const { timestamp } = await web3.eth.getBlock(event.blockHash);
      const date = (new Date(timestamp * 1000)).toLocaleString();
      const organization = event.address.toLowerCase();
      const { incomingDonation, charityEvent, amount } = event.returnValues;
      console.log(organization);
      console.log(incomingDonation);
      console.log(charityEvent);
      console.log(amount);
      console.log(date);
      /*
      if (event.blockNumber>fromBlock) {
        const orgFromDB = await Organization.findOne({ORGaddress: organization.toLowerCase()});
        if (orgFromDB) {
          const { _id, IDAddressList } = orgFromDB;
          const forPush = JSON.stringify({
            IDaddress: incomingDonation.toLowerCase(),
            date: date,
          });
          IDAddressList.push(forPush);
          const incomingDonationCount = orgFromDB.incomingDonationCount+1;
          await Organization.update({ _id }, { IDAddressList, incomingDonationCount });
          io.emit('newIncomingDonation', JSON.stringify(dataForSearch));
        } else {
          console.error('Organization not found');
        }
      }
      */
    });
  });
};

/*
const getDate = async (ORGaddress, XXaddress, type) => {
  const eventTypes = ['CharityEventAdded', 'IncomingDonationAdded'];
  const types = ['charityEvent', 'incomingDonation'];
  const index = types.indexOf(type);
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const allPastEvents = await ORGcontract.getPastEvents(eventTypes[index], {fromBlock: 0});
  const { blockHash } = allPastEvents.find((elem) => {
    return (elem.returnValues[type] == XXaddress);
  });
  const { timestamp } = await web3.eth.getBlock(blockHash);
  return (new Date(timestamp * 1000)).toLocaleString();
};
*/

// addressList
const getOrganizationAddressList = async () => {
  return [
    '0xbb8251c7252b6fec412a0a99995ebc1a28e4e103',
    '0xc9afa3e4e78a678ffb836c4062547b1dc8dd592f',
    '0xe379894535aa72706396f9a3e1db6f3f5e4c1c15',
    '0x78a6f275abb6e5ffb95ef9114ec6b605a000ea76',
    '0x77203ee959ebd7f9ade414969773cdc978eac709',
    '0x2cc93f96abdc1f0f6b726e6b097d5a20e174d18c',
    '0xbe08f7884ff4e31b4c77a5b6ed7f4fcae0440d0b',
    '0x8b8653c12e2017f073fc001b3c93d94e1de5b86f',
  ];
};
const getCharityEventAddressList = async (ORGaddress) => {
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const events = await ORGcontract.getPastEvents('CharityEventAdded', {fromBlock: 0});
  return await Promise.all(events.map(async (event) => {
    const { timestamp } = await web3.eth.getBlock(event.blockHash);
    const date = (new Date(timestamp * 1000)).toLocaleString();
    const organization = event.address.toLowerCase();
    const { charityEvent } = event.returnValues;
    const dataForSearch = await singleCharityEvent(charityEvent);
    dataForSearch.address = charityEvent.toLowerCase();
    dataForSearch.date = date;
    dataForSearch.ORGaddress = organization;
    SearchService.addDataToIndex(dataForSearch);
    return JSON.stringify({ charityEvent, date });
  }));
};
const getIncomingDonationAddressList = async (ORGaddress) => {
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const events = await ORGcontract.getPastEvents('IncomingDonationAdded', {fromBlock: 0});
  return await Promise.all(events.map(async (event) => {
    const { timestamp } = await web3.eth.getBlock(event.blockHash);
    const date = (new Date(timestamp * 1000)).toLocaleString();
    const organization = event.address.toLowerCase();
    const { incomingDonation } = event.returnValues;
    const dataForSearch = await singleIncomingDonation(incomingDonation);
    dataForSearch.address = incomingDonation.toLowerCase();
    dataForSearch.date = date;
    dataForSearch.ORGaddress = organization;
    SearchService.addDataToIndex(dataForSearch);
    return JSON.stringify({ incomingDonation, date });
  }));
};

// single
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
  const raised = await TOKENcontract.methods.balanceOf(CEaddress).call();
  return { name, payed, target, raised, tags };
};
const singleIncomingDonation = async (IDaddress) => {
  const IDcontract = new web3.eth.Contract(abi('IncomingDonation.json'), IDaddress);
  const realWorldIdentifier = await IDcontract.methods.realWorldIdentifier().call();
  const note = await IDcontract.methods.note().call();
  const tags = await IDcontract.methods.tags().call();
  const amount = await TOKENcontract.methods.balanceOf(IDaddress).call();
  return { realWorldIdentifier, amount, note, tags };
};


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
