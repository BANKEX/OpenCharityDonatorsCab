import { DIRS, DAPP, INTERVALS } from 'configuration';
import SearchService from './search-service';
import { Organization } from '../models';
import { io } from '../../../server';
import init from '../init';
import Web3 from 'web3';
const abi = (type) => (require(DIRS.abi+type).abi);

let web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
let TOKENcontract = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
let int = setInterval(async () => {
  await web3.eth.getBlockNumber().then(console.log);
}, INTERVALS.dapp.checkConnection);

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

const subscribe = (_ORGAddressList, fromBlock) => {
  web3.eth.subscribe('logs', {}, async (error, log) => {
    if (error) {
      if (error.type == 'close') {
        console.log('socket connection lost');
        clearInterval(int);
        reconnect();
      }
    } else {
      console.log(log);
    }
  });

  _ORGAddressList.forEach(async (ORGaddress) => {
    console.log('listeners for '+ORGaddress);
    const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);

    ORGcontract.events.CharityEventAdded({ fromBlock: 0 })
      .on('data', async (event) => {
        console.log(new Date().toLocaleString());
        const { timestamp } = await web3.eth.getBlock(event.blockHash);
        const date = (new Date(timestamp * 1000)).toLocaleString();
        const { organization, charityEvent } = event.returnValues;
        const dataForSearch = await singleCharityEvent(charityEvent);
        dataForSearch.address = charityEvent.toLowerCase();
        dataForSearch.date = date;
        SearchService.addDataToIndex(dataForSearch);
        if (event.blockNumber>fromBlock) {
          const orgFromDB = await Organization.findOne({ORGaddress: organization.toLowerCase()});
          if (orgFromDB) {
            const { _id, CEAddressList } = orgFromDB;
            const forPush = JSON.stringify({
              CEaddress: charityEvent.toLowerCase(),
              date: date,
            });
            CEAddressList.push(forPush);
            const charityEventCount = orgFromDB.charityEventCount+1;
            await Organization.update({ _id }, { CEAddressList, charityEventCount });
            io.emit('newCharityEvent', JSON.stringify(dataForSearch));
          } else {
            console.error('Organization not found');
          }
        }
      })
      .on('error', (err) => {
        console.log(new Date().toLocaleString());
        // console.error(err);
        // web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
      });

    ORGcontract.events.IncomingDonationAdded({ fromBlock: 0 })
      .on('data', async (event) => {
        console.log(new Date().toLocaleString());
        const { timestamp } = await web3.eth.getBlock(event.blockHash);
        const date = (new Date(timestamp * 1000)).toLocaleString();
        const { organization, incomingDonation } = event.returnValues;
        const dataForSearch = await singleIncomingDonation(incomingDonation);
        dataForSearch.address = incomingDonation.toLowerCase();
        dataForSearch.date = date;
        SearchService.addDataToIndex(dataForSearch);
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
      })
      .on('error', (err) => {
        console.log(new Date().toLocaleString());
        // console.error(err);
        // web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
      });
  });
};

const getLastBlock = async () => {
  return await web3.eth.getBlockNumber();
};
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

// addressList
const getOrganizationAddressList = async () => {
  return [
    '0xbb8251c7252b6fec412a0a99995ebc1a28e4e103',
    '0xc9afa3e4e78a678ffb836c4062547b1dc8dd592f',
    '0xe379894535aa72706396f9a3e1db6f3f5e4c1c15',
  ];
};
const getCharityEventAddressList = async (ORGaddress) => {
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const charityEventCount = await ORGcontract.methods.charityEventCount().call();
  const CEList = [];
  for (let i = 0; i < charityEventCount; i++) {
    CEList.push(await ORGcontract.methods.charityEventIndex(i).call());
  }
  return CEList;
};
const getIncomingDonationAddressList = async (ORGaddress) => {
  const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);
  const incomingDonationCount = await ORGcontract.methods.incomingDonationCount().call();
  const IDList = [];
  for (let i = 0; i < incomingDonationCount; i++) {
    IDList.push(await ORGcontract.methods.incomingDonationIndex(i).call());
  }
  return IDList;
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

export default {
  getLastBlock,
  subscribe,
  getDate,
  getOrganizationAddressList,
  getCharityEventAddressList,
  getIncomingDonationAddressList,
  singleOrganization,
  singleCharityEvent,
  singleIncomingDonation,
};
