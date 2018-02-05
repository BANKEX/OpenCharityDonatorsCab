import {DIRS, DAPP} from 'configuration';
import Web3 from 'web3';

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(DAPP.provider));
const abi = (type) => (require(DIRS.abi+type).abi);
const TOKEN = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);

export default {
  getOrganization: async (address) => {
    const organization = new web3.eth.Contract(abi('Organization.json'), address);
    const name = await organization.methods.name().call();
    const charityEventCount = await organization.methods.charityEventCount().call();
    const incomingDonationCount = await organization.methods.incomingDonationCount().call();
    return { name, charityEventCount, incomingDonationCount, address };
  },

  getCharityEventAddressList: async (organizationAddress) => {
    const organization = new web3.eth.Contract(abi('Organization.json'), organizationAddress);
    const charityEventCount = await organization.methods.charityEventCount().call();
    const charityEventList = [];
    for (let i = 0; i < charityEventCount; i++) {
      const address = await organization.methods.charityEventIndex(i).call();
      const isActive = await organization.methods.charityEvents(address).call();
      (isActive) ? charityEventList.push(address) : null;
    }
    return charityEventList;
  },

  getIncomingDonationAddressList: async (organizationAddress) => {
    const organization = new web3.eth.Contract(abi('Organization.json'), organizationAddress);
    const incomingDonationCount = await organization.methods.incomingDonationCount().call();
    const incomingDonationList = [];
    for (let i = 0; i < incomingDonationCount; i++) {
      const address = await organization.methods.incomingDonationIndex(i).call();
      const isActive = await organization.methods.incomingDonations(address).call();
      (isActive) ? incomingDonationList.push(address) : null;
    }
    return incomingDonationList;
  },

  singleCharityEvent: async (address) => {
    const contract = new web3.eth.Contract(abi('CharityEvent.json'), address);
    const name = await contract.methods.name().call();
    const payed = await contract.methods.payed().call();
    const target = await contract.methods.target().call();
    const tags = await contract.methods.tags().call();
    const raised = await TOKEN.methods.balanceOf(address).call();
    return { name, payed, target, raised, tags, address };
  },

  singleIncomingDonation: async (address) => {
    const contract = new web3.eth.Contract(abi('IncomingDonation.json'), address);
    const realWorldIdentifier = await contract.methods.realWorldIdentifier().call();
    const note = await contract.methods.note().call();
    const tags = await contract.methods.tags().call();
    const amount = await TOKEN.methods.balanceOf(address).call();
    return { realWorldIdentifier, amount, note, tags, address };
  },
};
