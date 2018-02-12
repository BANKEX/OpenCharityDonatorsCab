import {DIRS, DAPP} from 'configuration';
import Web3 from 'web3';

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(DAPP.provider));
const abi = (type) => (require(DIRS.abi+type).abi);
const TOKEN = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);

const getDate = async (organizationAddress, address, type) => {
  const eventTypes = ['CharityEventAdded', 'IncomingDonationAdded'];
  const types = ['charityEvent', 'incomingDonation'];
  const index = types.indexOf(type);
  if (index==-1) return false;
  const organization = new web3.eth.Contract(abi('Organization.json'), organizationAddress);
  const allPastEvents = await organization.getPastEvents(eventTypes[index], {
    fromBlock: 0,
    toBlock: 'latest',
  });
  const { blockHash } = allPastEvents.find((el) => {
    return (el.returnValues[type] == address);
  });
  const { timestamp } = await web3.eth.getBlock(blockHash);
  return (new Date(timestamp * 1000)).toLocaleString();
};


export default {
  getOrganization: async (address) => {
    const organization = new web3.eth.Contract(abi('Organization.json'), address);
    const name = await organization.methods.name().call();
    const charityEventCount = await organization.methods.charityEventCount().call();
    const incomingDonationCount = await organization.methods.incomingDonationCount().call();
    return { name, charityEventCount, incomingDonationCount, address };
  },

  getCharityEventAddressList: async (organizationAddress, send) => {
    const organization = new web3.eth.Contract(abi('Organization.json'), organizationAddress);
    const charityEventCount = await organization.methods.charityEventCount().call();
    for (let i = 0; i < charityEventCount; i++) {
      organization.methods.charityEventIndex(i).call().then(send);
    }
  },

  getIncomingDonationAddressList: async (organizationAddress, send) => {
    const organization = new web3.eth.Contract(abi('Organization.json'), organizationAddress);
    const incomingDonationCount = await organization.methods.incomingDonationCount().call();
    for (let i = 0; i < incomingDonationCount; i++) {
      organization.methods.incomingDonationIndex(i).call().then(send);
    }
  },

  singleCharityEvent: async (organizationAddress, address) => {
    const contract = new web3.eth.Contract(abi('CharityEvent.json'), address);
    const name = await contract.methods.name().call();
    const payed = await contract.methods.payed().call();
    const target = await contract.methods.target().call();
    const tags = await contract.methods.tags().call();
    const raised = await TOKEN.methods.balanceOf(address).call();
    const date = await getDate(organizationAddress, address, 'charityEvent');
    return { name, payed, target, raised, tags, date, address };
  },

  singleIncomingDonation: async (organizationAddress, address) => {
    const contract = new web3.eth.Contract(abi('IncomingDonation.json'), address);
    const realWorldIdentifier = await contract.methods.realWorldIdentifier().call();
    const note = await contract.methods.note().call();
    const tags = await contract.methods.tags().call();
    const amount = await TOKEN.methods.balanceOf(address).call();
    const date = await getDate(organizationAddress, address, 'incomingDonation');
    return { realWorldIdentifier, amount, note, tags, date, address };
  },
};
