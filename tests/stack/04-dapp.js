const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const config = require('config');
const io = require('socket.io-client');

const ADDRESS = config.get('address');
const META = config.get('metaServer');
const DAPP = config.get('dapp');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8'
});

const mainURL = ADDRESS.external;
let organizations, testOrg;
const CE=[], ID=[];
const socket = io(mainURL, {
  path: '/api/ws'
});

socket.on('error', () => {
  console.log(error);
});

socket.on('connect', () => {
  describe('--------Запросы к DAPP-----------', () => {
    it('Запрос getOrganizations', async () => {
      const options = {
        method: 'GET',
        uri: mainURL + '/api/dapp/getOrganizations'
      };
      const response = await rp(options);
      organizations = JSON.parse(response);
      testOrg = organizations.find((elem) => (elem.ORGaddress==DAPP.organizations[0]));
      assert.equal(response.indexOf(DAPP.organizations[0])!=-1, true);
    });

    it('Запрос getCharityEvents', (done) => {
      let counter=0;
      request(mainURL + '/api/dapp/getCharityEvents/'+testOrg.ORGaddress, (err, resp, body) => {
        if (err) return done(err);
        socket.on(body, (dt) => {
          if (dt!='close') {
            const data = JSON.parse(dt);
            CE.push(data);
            counter++;
            process.stdout.write('.');
            assert.notEqual(data.name, undefined);
            assert.notEqual(data.payed, undefined);
            assert.notEqual(data.target, undefined);
            assert.notEqual(data.raised, undefined);
            assert.notEqual(data.tags, undefined);
            assert.notEqual(data.date, undefined);
            assert.notEqual(data.address, undefined);
          } else {
            if (counter == testOrg.charityEventCount) done();
          }
        });
      });
    });

    it('Запрос getIncomingDonations', (done) => {
      let counter=0;
      request(mainURL + '/api/dapp/getIncomingDonations/'+testOrg.ORGaddress, (err, resp, body) => {
        if (err) return done(err);
        socket.on(body, (dt) => {
          if (dt!='close') {
            const data = JSON.parse(dt);
            ID.push(data);
            counter++;
            process.stdout.write('.');
            assert.notEqual(data.realWorldIdentifier, undefined);
            assert.notEqual(data.amount, undefined);
            assert.notEqual(data.note, undefined);
            assert.notEqual(data.tags, undefined);
            assert.notEqual(data.date, undefined);
            assert.notEqual(data.address, undefined);
          } else {
            if (counter == testOrg.incomingDonationCount) done();
          }
        });
      });

    });

    it('Запрос getCharityEvent/hash', async () => {
      const options = {
        method: 'GET',
        uri: mainURL + '/api/dapp/getCharityEvent/' + CE[0].address
      };
      const response = await rp(options);
      const responseData = JSON.parse(response);
      assert.equal(responseData.name, CE[0].name);
      assert.equal(responseData.target, CE[0].target);
      assert.equal(responseData.payed, CE[0].payed);
      assert.equal(responseData.raised, CE[0].raised);
      assert.equal(responseData.tags, CE[0].tags);
      assert.equal(responseData.date, CE[0].date);
      assert.equal(responseData.address, CE[0].address);
    });

    it('Запрос getIncomingDonation/hash', async () => {
      const options = {
        method: 'GET',
        uri: mainURL + '/api/dapp/getIncomingDonation/' + ID[0].address
      };
      const response = await rp(options);
      const responseData = JSON.parse(response);
      assert.equal(responseData.realWorldIdentifier, ID[0].realWorldIdentifier);
      assert.equal(responseData.note, ID[0].note);
      assert.equal(responseData.amount, ID[0].amount);
      assert.equal(responseData.tags, ID[0].tags);
      assert.equal(responseData.date, ID[0].date);
      assert.equal(responseData.address, ID[0].address);
      socket.disconnect();
    });
/*
    it('Фильтр getCharityEvents', (done) => {
      const body = {
        ORGaddress: testOrg.ORGaddress,
        name: {
          enum: [CE[0].name, CE[1].name],
          include: "Test",
        },
        target: {
          range: [100, 110]
        }
      };

      const options = {
        method: 'POST',
        uri: mainURL + '/api/dapp/getCharityEvents',
        body: JSON.stringify(body),
        headers: {
          'Content-Type' : 'application/json'
        }
      };

      let counter=0;
      let test = true;
      rp.post(options)
        .then((body) => {
          socket.on(body, (dt) => {
            if (dt!='close') {
              const data = JSON.parse(dt);
              counter++;
              process.stdout.write('.');
              if (data !== false) {
                test = test && (data.name.toLowerCase().indexOf('test') != -1);
                test = test && (Number(data.target) >= 100 && Number(data.target) <= 110);
                test = test && (data.name.toLowerCase() == CE[0].name.toLowerCase() || data.name.toLowerCase() == CE[1].name.toLowerCase() || data.name.toLowerCase() == CE[2].name.toLowerCase())
              }
              assert.equal(test, true);
            } else {
              if (counter == testOrg.charityEventCount) {
                socket.disconnect();
                done();
              }
            }
          });
        })
        .catch((err) => {
          if (err) return done(err);
        });
    });

    it('Запрос search/', async () => {
      const text = 'test';
      const options = {
        method: 'POST',
        uri: mainURL + '/api/dapp/search',
        body: JSON.stringify({text: text}),
        headers: {
          'Content-Type' : 'application/json'
        }
      };
      const response = await rp(options);
      const respObj = JSON.parse(response);
      if (Object.getOwnPropertyNames(respObj).length!=0) {
        assert.equal(response.indexOf(text)!=-1, true);
      }
    });
*/
  });
});
