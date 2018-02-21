import {DIRS, DAPP} from 'configuration';
import SearchService from './search-service';
import { Organization } from '../models';
import { io } from '../../../server';
import Web3 from 'web3';

const web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
const abi = (type) => (require(DIRS.abi+type).abi);
setInterval(() => {
  web3.eth.getBlockNumber().then(console.log);
}, 1000*60);
const TOKENcontract = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);


const getLastBlock = async () => {
  return await web3.eth.getBlockNumber();
};

const subscribe = async (_ORGAddressList, fromBlock) => {
  _ORGAddressList.forEach(async (ORGaddress) => {
    const ORGcontract = new web3.eth.Contract(abi('Organization.json'), ORGaddress);

    ORGcontract.events.CharityEventAdded({ fromBlock: 0 })
      .on('data', async (event) => {
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
            let charityEventCount = orgFromDB.charityEventCount+1;
            await Organization.update({ _id }, { CEAddressList, charityEventCount });
            io.emit('newCharityEvent', JSON.stringify(dataForSearch));
          } else {
            console.error('Organization not found');
          }
        }
      })
      .on('error', console.error);

    ORGcontract.events.IncomingDonationAdded({ fromBlock: 0 })
      .on('data', async (event) => {
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
            let incomingDonationCount = orgFromDB.incomingDonationCount+1;
            await Organization.update({ _id }, { IDAddressList, incomingDonationCount });
            io.emit('newIncomingDonation', JSON.stringify(dataForSearch));
          } else {
            console.error('Organization not found');
          }
        }
      })
      .on('error', console.error);
  });
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
