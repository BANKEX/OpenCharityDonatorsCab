const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const config = require('config');
const io = require('socket.io-client');

const ADDRESS = config.get('address');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8'
});

const mainURL = ADDRESS.external;
const organizations = ['0xe379894535aa72706396f9a3e1db6f3f5e4c1c15'];
let charityEventCount, incomingDonationCount;
const CE=[], ID=[];
const socket = io(mainURL, {
  path: '/api/ws'
});

socket.on('error', () => {
  console.log(error);
});

socket.on('connect', () => {
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

    it('Запрос getCharityEvents', (done) => {
      let counter=0;
      request(mainURL + '/api/dapp/getCharityEvents', (err, resp, body) => {
        if (err) return done(err);
        socket.on(body, (dt) => {
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
          if (counter==charityEventCount) done();
        });
      });
    });

    it('Запрос getIncomingDonations', (done) => {
      let counter=0;
      request(mainURL + '/api/dapp/getIncomingDonations', (err, resp, body) => {
        if (err) return done(err);
        socket.on(body, (dt) => {
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
          if (counter==incomingDonationCount) done();
        });
      });

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
      assert.equal(responseData.note, ID[0].note);
      assert.equal(responseData.tags, ID[0].tags);
      assert.equal(responseData.date, ID[0].date);
    });

    it('Фильтр getCharityEvents', (done) => {
      const body = {
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
            const data = JSON.parse(dt);
            counter++;
            process.stdout.write('.');
            if (data!==false) {
              test = test && (data.name.toLowerCase().indexOf('test') != -1);
              test = test && (Number(data.target) >= 100 && Number(data.target) <= 110);
              test = test && (data.name.toLowerCase() == CE[0].name.toLowerCase() || data.name.toLowerCase() == CE[1].name.toLowerCase() || data.name.toLowerCase() == CE[2].name.toLowerCase())
            }
            assert.equal(test, true);
            if (counter==charityEventCount) {socket.disconnect();done();}
          });
        })
        .catch((err) => {
          if (err) return done(err);
        });
    });
  });
});
