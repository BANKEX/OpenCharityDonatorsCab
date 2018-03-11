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

const socket = io(mainURL, { path: '/api/ws' });
socket.on('error', console.log);
socket.on('connect', () => {
  describe('--------Запросы к DAPP-----------', () => {
    after(() => {socket.disconnect()});

    it('Запрос getOrganizations', async () => {
      const options = {
        method: 'GET',
        uri: mainURL + '/api/dapp/getOrganizations'
      };
      const response = await rp(options);
      organizations = JSON.parse(response);
      testOrg = organizations.find((elem) => (
        elem.charityEventCount>1 && elem.incomingDonationCount>1
      ));
      assert.equal(typeof organizations, 'object');
    });

    it('Запрос getCharityEvents', (done) => {
      if (testOrg) {
        let counter = 0;
        request(mainURL + '/api/dapp/getCharityEvents/' + testOrg.ORGaddress, (err, resp, body) => {
          if (err) return done(err);
          socket.on(body, (dt) => {
            if (dt != 'close') {
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
              assert.notEqual(data.metaStorageHash, undefined);
            } else {
              if (counter == testOrg.charityEventCount) done();
            }
          });
        });
      } else {
        console.log('There is no test organization');
      }
    });

    it('Запрос getIncomingDonations', (done) => {
      if (testOrg) {
        let counter = 0;
        request(mainURL + '/api/dapp/getIncomingDonations/' + testOrg.ORGaddress, (err, resp, body) => {
          if (err) return done(err);
          socket.on(body, (dt) => {
            if (dt != 'close') {
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
      } else {
        console.log('There is no test organization');
      }
    });

    it('Запрос getCharityEvent/hash', async() => {
      if (testOrg) {
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
      } else {
        console.log('There is no test organization');
      }
    });

    it('Запрос getIncomingDonation/hash', async() => {
      if (testOrg) {
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
      } else {
        console.log('There is no test organization');
      }
    });


    it('Фильтр getCharityEvents', (done) => {
      if (testOrg) {
        const body = {
          ORGaddress: testOrg.ORGaddress,
          name: {
            include: CE[0].name
          },
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
                console.log(data);
                counter++;
                process.stdout.write('.');
                if (data !== false) {
                  test = test && (data.name.indexOf(CE[0].name) != -1);
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
      } else {
        console.log('There is no test organization');
      }
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
      console.log(respObj);
      if (Object.getOwnPropertyNames(respObj).length!=0) {
        console.log(respObj.length);
        assert.equal(response.indexOf(text)!=-1, true);
      }
    });
  });
});
