import { DAPP, INTERVALS } from 'configuration';
import app from 'app';
import { Organization, CharityEvent, IncomingDonation } from '../modules/dapp';

const subscribtions = {};

const init = async () => {
  const getMinBlock = async () => {
    const creationBlocks = await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
      const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
      return Number(await ORGcontract.methods.creationBlockNumber().call());
    }));
    return app.state.web3.utils.toHex(Math.min.apply(null, creationBlocks));
  };
  const refreshCollections = async (ORGaddress, type) => {
    const options = {
      'CE': {
        collection: CharityEvent,
        addedEvent: 'CharityEventAdded',
      },
      'ID': {
        collection: IncomingDonation,
        addedEvent: 'IncomingDonationAdded',
      },
    };

    const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
    const added = await ORGcontract.getPastEvents(options[type].addedEvent, {fromBlock: app.state.minBlock});
    await Promise.all(added.map(async (event) => {
      const objBC = await getFullObject(null, event, type, null);
      const objDB = await options[type].collection.findOne({address: objBC.address});
      if (!objDB) {
        await options[type].collection.create(objBC);
      } else {
        await options[type].collection.update({address: objBC.address}, objBC);
      }
      return null;
    }));
  };
  const subscribe = async (_ORGAddressList) => {
    const objAdded = async (event, type) => {
      const options = {
        'CE': {
          type: 'charityEvent',
          collection: CharityEvent,
          addedEvent: 'CharityEventAdded',
          count: 'charityEventCount',
          newEvent: 'newCharityEvent',
        },
        'ID': {
          type: 'incomingDonation',
          collection: IncomingDonation,
          addedEvent: 'IncomingDonationAdded',
          count: 'incomingDonationCount',
          newEvent: 'newIncomingDonation',
        },
      };

      console.log(new Date().toLocaleString() + ' ' + type + ' added');
      const objBC = await getFullObject(null, event, type, null);
      const orgFromDB = await Organization.findOne({ ORGaddress: objBC.ORGaddress });
      if (orgFromDB) {
        const count = orgFromDB[options[type].count]+1;
        await Organization.update({ ORGaddress: objBC.ORGaddress }, { [options[type].count]: count });
        app.io.emit(options[type].newEvent, JSON.stringify(objBC));
      } else {
        console.error('Organization not found');
      }
      const objDB = await options[type].collection.findOne({address: objBC.address});
      if (!objDB) {
        await options[type].collection.create(objBC);
      } else {
        console.log(type + ' already exists');
      }
      console.log(objBC);
    };
    const objEdited = async (event, type) => {
      const options = {
        'CE': {
          type: 'charityEvent',
          collection: CharityEvent,
          addedEvent: 'CharityEventAdded',
          newEvent: 'newCharityEvent',
          editEvent: 'editCharityEvent',
        },
        'ID': {
          type: 'incomingDonation',
          collection: IncomingDonation,
          addedEvent: 'IncomingDonationAdded',
          newEvent: 'newIncomingDonation',
          editEvent: 'editIncomingDonation',
        },
      };

      console.log(new Date().toLocaleString() + ' ' + type + ' edited');
      const objBC = await getFullObject(null, event, type, null);
      const objDB = await options[type].collection.findOne({address: objBC.address});
      if (!objDB) {
        await options[type].collection.create(objBC);
        app.io.emit(options[type].newEvent, JSON.stringify(objBC));
      } else {
        await options[type].collection.update({address: objBC.address}, objBC);
        app.io.emit(options[type].editedEvent, JSON.stringify(objBC));
      }
    };
    const charityEventAdded = async (event) => {
      await objAdded(event, 'CE');
    };
    const incomingDonationAdded = async (event) => {
      await objAdded(event, 'ID');
    };
    const fundsMovedToCharityEvent = async (event) => {
      console.log(new Date().toLocaleString() + ' move funds');
      const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
      const date = timestamp*1000;
      const ORGaddress = event.address;
      const { incomingDonation, charityEvent, amount } = event.returnValues;
      const ce = await CharityEvent.findOne({ address: charityEvent });
      const id = await IncomingDonation.findOne({ address: incomingDonation });
      if (ce && id) {
        await CharityEvent.update({address: ce.address}, {raised: ce.raised + Number(amount)});
        await IncomingDonation.update({address: id.address}, {amount: id.amount - Number(amount)});
        app.io.emit('moveFunds', JSON.stringify({ORGaddress, incomingDonation, charityEvent, amount, date}));
        console.log(`${incomingDonation}--(${amount})-->${charityEvent}`);
      } else {
        if (!ce) console.log(charityEvent + ' - CE not in DB');
        if (!id) console.log(incomingDonation + ' - ID not in DB');
      }
    };
    const metaStorageHashUpdated = async (event) => {
      console.log(new Date().toLocaleString() + ' MetaUpdated');
      const { ownerAddress, metaStorageHash } = event.returnValues;
      const address = ownerAddress;
      const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
      const mdate = timestamp*1000;
      // edit DB
      const res = await CharityEvent.update({ address }, { metaStorageHash, mdate });
      if (res.n == 0) {
        await IncomingDonation.update({address}, { metaStorageHash, mdate });
      }
    };
    const charityEventEdited = async (event) => {
      await objEdited(event, 'CE');
    };
    const incomingDonationEdited = async (event) => {
      await objEdited(event, 'ID');
    };

    _ORGAddressList.forEach(async (ORGaddress) => {
      subscribtions[ORGaddress] = [];
      const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
      subscribtions[ORGaddress][0] = ORGcontract.events.CharityEventAdded({ fromBlock: 'latest' }).on('data', charityEventAdded);
      subscribtions[ORGaddress][1] = ORGcontract.events.IncomingDonationAdded({ fromBlock: 'latest' }).on('data', incomingDonationAdded);
      subscribtions[ORGaddress][2] = ORGcontract.events.FundsMovedToCharityEvent({ fromBlock: 'latest' }).on('data', fundsMovedToCharityEvent);
      subscribtions[ORGaddress][3] = ORGcontract.events.MetaStorageHashUpdated({ fromBlock: 'latest' }).on('data', metaStorageHashUpdated);
      subscribtions[ORGaddress][4] = ORGcontract.events.CharityEventEdited({ fromBlock: 'latest' }).on('data', charityEventEdited);
      // ORGcontract.events.IncomingDonationEdited({ fromBlock: 'latest' }).on('data', incomingDonationEdited);
    });
  };
  const unsubscribe = async (_ORGAddressList) => {
    await Promise.all(_ORGAddressList.map(async (ORGaddress) => {
      await Promise.all(subscribtions[ORGaddress].map(async (subs) => {
        await new Promise((resolve) => {
          subs.unsubscribe((err, res) => {
            process.stdout.write((res) ? 'U' : 'E');
            resolve();
          });
        });
        return null;
      }));
      return null;
    }));
  };

  app.state.previousORG = app.state.actualORG;
  app.state.actualORG = app.state.initList.list;
  app.state.token = new app.state.web3.eth.Contract(app.state.initList.abis['OpenCharityToken'], DAPP.token);
  app.state.minBlock = await getMinBlock();
  // Collections create/update
  await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
    const orgData = await singleOrganization(ORGaddress);
    orgData.ORGaddress = ORGaddress;
    const orgFromDB = await Organization.findOne({ ORGaddress });
    if (!orgFromDB) {
      await Organization.create(orgData);
    } else {
      await Organization.update({ ORGaddress }, orgData);
    }
    await refreshCollections(ORGaddress, 'CE');
    await refreshCollections(ORGaddress, 'ID');
    return null;
  }));
  // deleting not actual Orgs, CEs, IDs
  await Organization.deleteMany({ORGaddress: { '$nin': app.state.initList.list }});
  await CharityEvent.deleteMany({ORGaddress: { '$nin': app.state.initList.list }});
  await IncomingDonation.deleteMany({ORGaddress: { '$nin': app.state.initList.list }});
  // subscribe for added orgs
  const newORGs = app.state.actualORG.filter(el => (!app.state.previousORG.includes(el)));
  subscribe(newORGs);
  // unsubscribe not actual Orgs
  const delORG = app.state.previousORG.filter(el => (!app.state.actualORG.includes(el)));
  await unsubscribe(delORG);
};

// singles for init, controller, helper, events
const singleOrganization = async (ORGaddress) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const name = await ORGcontract.methods.name().call();
  const charityEventCount = await ORGcontract.methods.charityEventCount().call();
  const incomingDonationCount = await ORGcontract.methods.incomingDonationCount().call();
  return { name, charityEventCount, incomingDonationCount };
};
const singleCharityEvent = async (CEaddress) => {
  const CEcontract = new app.state.web3.eth.Contract(app.state.initList.abis['CharityEvent'], CEaddress);
  const name = await CEcontract.methods.name().call();
  const payed = await CEcontract.methods.payed().call();
  const target = await CEcontract.methods.target().call();
  const tags = await CEcontract.methods.tags().call();
  const metaStorageHash = await CEcontract.methods.metaStorageHash().call();
  const raised = await app.state.token.methods.balanceOf(CEaddress).call();
  return { name, payed, target, raised, tags, metaStorageHash };
};
const singleIncomingDonation = async (IDaddress) => {
  const IDcontract = new app.state.web3.eth.Contract(app.state.initList.abis['IncomingDonation'], IDaddress);
  const realWorldIdentifier = await IDcontract.methods.realWorldIdentifier().call();
  const note = await IDcontract.methods.note().call();
  const tags = await IDcontract.methods.tags().call();
  const amount = await app.state.token.methods.balanceOf(IDaddress).call();
  return { realWorldIdentifier, amount, note, tags };
};

// only for controller
const getHistory = async (ORGaddress, address, type) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const filter = (type=='CE')
  ? { charityEvent: address }
  : { incomingDonation: address };
  const events = await ORGcontract.getPastEvents('FundsMovedToCharityEvent', {
    fromBlock: app.state.minBlock,
    filter,
  });
  return await Promise.all(events.map(async (event) => {
    const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
    const date = timestamp*1000;
    const transactionHash = event.transactionHash;
    const { incomingDonation, charityEvent, amount } = event.returnValues;
    const data = (type=='CE')
    ? { incomingDonation, amount, date, transactionHash }
    : { charityEvent, amount, date, transactionHash };
    return data;
  }));
};
const getAddresses = async (ORGaddress, type) => {
  const options = {
    'CE': {
      countFunc: 'charityEventCount',
      indexFunc: 'charityEventIndex',
    },
    'ID': {
      countFunc: 'incomingDonationCount',
      indexFunc: 'incomingDonationIndex',
    },
  };
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const count = await ORGcontract.methods[options[type].countFunc]().call();
  const res = [];
  for (let i=0; i<count; i++) {
    res[i] = await ORGcontract.methods[options[type].indexFunc](i).call();
  }
  return res;
};

// main object forming
const getDates = async (ORGaddress, address, type) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const options = {
    'CE': {
      addedEvent: 'CharityEventAdded',
      editedEvent: 'CharityEventEdited',
      filter: { charityEvent: address },
    },
    'ID': {
      addedEvent: 'IncomingDonationAdded',
      editedEvent: 'IncomingDonationEdited',
      filter: { incomingDonation: address },
    },
  };
  const added = await ORGcontract.getPastEvents(options[type].addedEvent, { fromBlock: app.state.minBlock, filter: options[type].filter });
  const blockAdd = await app.state.web3.eth.getBlock(added[0].blockHash);
  const cdate = blockAdd.timestamp*1000;
  let mdate = cdate;
  // до тех пор пока нет редактирования ID - потом убрать этот if
  if (type == 'CE') {
    const edited = await ORGcontract.getPastEvents(options[type].editedEvent, { fromBlock: app.state.minBlock, filter: options[type].filter });
    if (edited.length) {
      const blockEd = await app.state.web3.eth.getBlock(edited[edited.length - 1].blockHash);
      mdate = blockEd.timestamp*1000;
    }
  }
  return { cdate, mdate };
};
const getORGaddress = async (address, type) => {
  const options = {
    'CE': {
      addedEvent: 'CharityEventAdded',
      sha3: 'CharityEventAdded(address)',
    },
    'ID': {
      addedEvent: 'IncomingDonationAdded',
      sha3: 'IncomingDonationAdded(address,uint256,uint256)',
    },
  };
  const topic1 = app.state.web3.utils.sha3(options[type].sha3);
  const topic2 = app.state.web3.utils.padLeft(address, 64);
  const opts = {
    address: app.state.initList.list,
    topics: [topic1, topic2],
    fromBlock: app.state.minBlock,
  };
  const logs = await app.state.web3.eth.getPastLogs(opts);
  return (logs[0]) ? logs[0].address : false;
};
const getFullObject = async (address, event, type, ORGaddress) => {
  const options = {
    'CE': {
      eventValue: 'charityEvent',
      singleFunc: singleCharityEvent,
    },
    'ID': {
      eventValue: 'incomingDonation',
      singleFunc: singleIncomingDonation,
    },
  };

  const _this = {};
  if (address && !event) {
    _this.address = address;
    _this.ORGaddress = ORGaddress || await getORGaddress(address, type);
    if (_this.ORGaddress) {
      const {cdate, mdate} = await getDates(_this.ORGaddress, _this.address, type);
      _this.cdate = cdate;
      _this.mdate = mdate;
    } else {
      _this.cdate = 0;
      _this.mdate = 0;
    }
    const singleObject = await options[type].singleFunc(_this.address);
    Object.getOwnPropertyNames(singleObject).forEach((key) => {
      _this[key] = singleObject[key];
    });
  }

  if (!address && event) {
    _this.address = event.returnValues[options[type].eventValue];
    _this.ORGaddress = event.address;
    const { cdate, mdate } = await getDates(_this.ORGaddress, _this.address, type);
    _this.cdate = cdate;
    _this.mdate = mdate;
    const singleObject = await options[type].singleFunc(_this.address);
    Object.getOwnPropertyNames(singleObject).forEach((key) => {
      _this[key] = singleObject[key];
    });
  }

  return _this;
};

export default {
  init,
  singleOrganization,
  getHistory,
  getAddresses,
  getFullObject,
};
