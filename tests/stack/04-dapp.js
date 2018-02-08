const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const Web3 = require('web3');
const config = require('config');

const ADDRESS = config.get('address');
const JWT = config.get('jwt');
const DIRS = config.get('dirs');
const MONGO_URI = config.get('mongoURI');
const DAPP = config.get('dapp');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8'
});

const mainURL = ADDRESS.protocol+'://' + ADDRESS.web;
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(DAPP.provider));
const organizations = ['0xe777faf8240196ba99c6e2a89e8f24b75c52eb2a'];
const abi = (type) => (require(DIRS.abi+type).abi);
const TOKEN = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
const ORG = new web3.eth.Contract(abi('Organization.json'), organizations[0]);

let charityEventCount, incomingDonationCount, CE, ID;

describe('--------Запросы к DAPP-----------', () => {
  it('Запрос getOrganization', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/dapp/getOrganization'
    };
    const response = await rp(options);
    const responseData = JSON.parse(response).data;
    charityEventCount = responseData.charityEventCount;
    incomingDonationCount = responseData.incomingDonationCount;
    assert.equal(responseData.address, organizations[0]);
    assert.notEqual(responseData.name, undefined);
    assert.notEqual(responseData.charityEventCount, undefined);
    assert.notEqual(responseData.incomingDonationCount, undefined);
  });

  it('Запрос getCharityEvents', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/dapp/getCharityEvents'
    };
    const response = await rp(options);
    const responseData = JSON.parse(response).data;
    CE = responseData;
    assert.equal(responseData.length, charityEventCount);
  });

  it('Запрос getIncomingDonations', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/dapp/getIncomingDonations'
    };
    const response = await rp(options);
    const responseData = JSON.parse(response).data;
    ID = responseData;
    assert.equal(responseData.length, incomingDonationCount);
  });

  it('Запрос getCharityEvent/hash', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/dapp/getCharityEvent/' + CE[0].address
    };
    const response = await rp(options);
    const responseData = JSON.parse(response).data;
    assert.equal(responseData.name, CE[0].name);
    assert.equal(responseData.target, CE[0].target);
    assert.equal(responseData.raised, CE[0].raised);
    assert.equal(responseData.tags, CE[0].tags);
    assert.equal(responseData.date, CE[0].date);
  });

  it('Запрос getIncomingDonation/hash', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/dapp/getIncomingDonation/' + ID[0].address
    };
    const response = await rp(options);
    const responseData = JSON.parse(response).data;
    assert.equal(responseData.realWorldIdentifier, ID[0].realWorldIdentifier);
    assert.equal(responseData.tags, ID[0].tags);
    assert.equal(responseData.date, ID[0].date);
  });
});
