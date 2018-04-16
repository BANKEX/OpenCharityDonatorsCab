const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const config = require('config');
const io = require('socket.io-client');

const ADDRESS = config.get('address');
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
  describe('--------DAPP tests-----------', () => {
    after(() => {socket.disconnect()});

    it('GET getOrganizations', async () => {
      const options = {
        method: 'GET',
        uri: mainURL + '/api/dapp/getOrganizations'
      };
      const response = await rp(options);
      organizations = JSON.parse(response);
      testOrg = organizations.find((elem) => (
        elem.charityEventCount>=1 && elem.incomingDonationCount>=1
      ));
      assert.equal(typeof organizations, 'object');
    });

    it('GET getCharityEvents', (done) => {
      if (testOrg) {
        let counter = 0;
        request(mainURL + '/api/dapp/getCharityEvents/' + testOrg.ORGaddress +'?how=bc', (err, resp, body) => {
          if (err) return done(err);
          socket.on(JSON.parse(body).room, (dt) => {
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
              assert.notEqual(data.cdate, undefined);
              assert.notEqual(data.mdate, undefined);
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

    it('GET getIncomingDonations', (done) => {
      if (testOrg) {
        let counter = 0;
        request(mainURL + '/api/dapp/getIncomingDonations/' + testOrg.ORGaddress+'?how=bc', (err, resp, body) => {
          if (err) return done(err);
          socket.on(JSON.parse(body).room, (dt) => {
            if (dt != 'close') {
              const data = JSON.parse(dt);
              ID.push(data);
              counter++;
              process.stdout.write('.');
              assert.notEqual(data.realWorldIdentifier, undefined);
              assert.notEqual(data.amount, undefined);
              assert.notEqual(data.note, undefined);
              assert.notEqual(data.tags, undefined);
              assert.notEqual(data.cdate, undefined);
              assert.notEqual(data.mdate, undefined);
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

    it('GET getCharityEvent/hash', async() => {
      if (testOrg) {
        const options = {
          method: 'GET',
          uri: mainURL + '/api/dapp/getCharityEvent/' + CE[0].address +'?how=bc'
        };
        const response = await rp(options);
        const responseData = JSON.parse(response);
        assert.equal(responseData.name, CE[0].name);
        assert.equal(responseData.target, CE[0].target);
        assert.equal(responseData.payed, CE[0].payed);
        assert.equal(responseData.raised, CE[0].raised);
        assert.equal(responseData.tags, CE[0].tags);
        assert.equal(responseData.cdate, CE[0].cdate);
        assert.equal(responseData.address, CE[0].address);
      } else {
        console.log('There is no test organization');
      }
    });

    it('GET getIncomingDonation/hash', async() => {
      if (testOrg) {
        const options = {
          method: 'GET',
          uri: mainURL + '/api/dapp/getIncomingDonation/' + ID[0].address+'?how=bc'
        };
        const response = await rp(options);
        const responseData = JSON.parse(response);
        assert.equal(responseData.realWorldIdentifier, ID[0].realWorldIdentifier);
        assert.equal(responseData.note, ID[0].note);
        assert.equal(responseData.amount, ID[0].amount);
        assert.equal(responseData.tags, ID[0].tags);
        assert.equal(responseData.cdate, ID[0].cdate);
        assert.equal(responseData.address, ID[0].address);
      } else {
        console.log('There is no test organization');
      }
    });

    it('POST getCharityEvents', (done) => {
      if (testOrg) {
        const body = {
          ORGaddress: testOrg.ORGaddress,
          name: {
            include: CE[0].name
          },
          cdate: {
            range: [CE[0].cdate, CE[0].cdate]
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
            const obj = JSON.parse(body);
            assert.equal(obj[0].address, CE[0].address);
            done();
          })
          .catch((err) => {
            if (err) return done(err);
          });
      } else {
        console.log('There is no test organization');
      }
    });

    it('POST search/', (done) => {
      const search = {
        searchRequest: 'test',
        type: 'charityEvent',
        pageSize: 50,
        how: 'bc',
      };
      const options = {
        method: 'POST',
        uri: mainURL + '/api/dapp/search',
        body: JSON.stringify(search),
        headers: {
          'Content-Type' : 'application/json'
        }
      };

      let counter=0;
      let test = true;
      rp.post(options)
        .then((body) => {
          socket.on(JSON.parse(body).room, (dt) => {
            if (dt!='close') {
              const data = JSON.parse(dt);
              counter++;
              if (dt.toLowerCase().indexOf(search.searchRequest)==-1) {process.stdout.write('-')} else {process.stdout.write('+')}
              assert.equal(data.name!=undefined, true);
            } else {
              if (counter==Number(JSON.parse(body).quantity)) done();
            }
          });
        })
        .catch((err) => {
          if (err) return done(err);
        });
    });

  });
});
