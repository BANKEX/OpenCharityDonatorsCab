import { DappService } from '../services';
import { Organization } from '../models';

const syncOrganizations = async () => {
  const _ORGAddressList = await DappService.getOrganizationAddressList();

  return Promise.all(_ORGAddressList.map(async (ORGaddress) => {
    const orgData = await DappService.singleOrganization(ORGaddress);
    const orgFromDB = await Organization.findOne({ ORGaddress });
    if (orgFromDB) {
      await Organization.update({ ORGaddress }, orgData);
      console.log('updated '+ORGaddress);
    } else {
      orgData.ORGaddress = ORGaddress;
      await Organization.create(orgData);
      console.log('created ' +ORGaddress);
    }
    return ORGaddress;
  }));
};

const refreshLists = async (_ORGAddressList) => {
  _ORGAddressList.forEach(async (ORGaddress) => {
    const _CEAddressList = await DappService.getCharityEventAddressList(ORGaddress);
    const _IDAddressList = await DappService.getIncomingDonationAddressList(ORGaddress);
    const CEAddressList = await Promise.all(_CEAddressList.map(async (CEaddress) => {
      const date = await DappService.getDate(ORGaddress, CEaddress, 'charityEvent');
      return JSON.stringify({ CEaddress, date });
    }));
    const IDAddressList = await Promise.all(_IDAddressList.map(async (IDaddress) => {
      const date = await DappService.getDate(ORGaddress, IDaddress, 'incomingDonation');
      return JSON.stringify({ IDaddress, date });
    }));
    await Organization.update({ORGaddress}, { CEAddressList, IDAddressList });
    console.log('refresh lists ' + ORGaddress);
  });
};

const doWithAllCE = (org, callback) => {
  org.CEAddressList.forEach(async (elem) => {
    const CEelem = JSON.parse(elem);
    const charityEvent = await DappService.singleCharityEvent(CEelem.CEaddress);
    charityEvent.address = CEelem.CEaddress;
    charityEvent.date = CEelem.date;
    callback(charityEvent);
  });
};

const doWithAllID = (org, callback) => {
  org.IDAddressList.forEach(async (elem) => {
    const IDelem = JSON.parse(elem);
    const incomingDonation = await DappService.singleIncomingDonation(IDelem.IDaddress);
    incomingDonation.address = IDelem.IDaddress;
    incomingDonation.date = IDelem.date;
    callback(incomingDonation);
  });
};

const getDateFromDB = async (address) => {
  const org = await Organization.findOne().or([{
      CEAddressList: new RegExp(address, 'i'),
    }, {
      IDAddressList: new RegExp(address, 'i'),
    }]
  );
  const obj = org.CEAddressList.find((elem) => (elem.indexOf(address)!=-1)) ||
    org.IDAddressList.find((elem) => (elem.indexOf(address)!=-1));
  return JSON.parse(obj);
};

export {
  syncOrganizations,
  refreshLists,
  doWithAllCE,
  doWithAllID,
  getDateFromDB,
};
