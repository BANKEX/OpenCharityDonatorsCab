import { DappService } from '../services';
import { Organization } from '../models';

const doWithAllCE = (org, callback) => {
  org.CEAddressList.forEach(async (elem) => {
    const CEelem = JSON.parse(elem);
    const charityEvent = await DappService.singleCharityEvent(CEelem.charityEvent);
    charityEvent.address = CEelem.charityEvent;
    charityEvent.date = CEelem.date;
    charityEvent.ORGaddress = org.ORGaddress;
    callback(charityEvent);
  });
};

const doWithAllID = (org, callback) => {
  org.IDAddressList.forEach(async (elem) => {
    const IDelem = JSON.parse(elem);
    const incomingDonation = await DappService.singleIncomingDonation(IDelem.incomingDonation);
    incomingDonation.address = IDelem.incomingDonation;
    incomingDonation.date = IDelem.date;
    incomingDonation.ORGaddress = org.ORGaddress;
    callback(incomingDonation);
  });
};

const getDataFromDB = async (address) => {
  const org = await Organization.findOne().or([{
      CEAddressList: new RegExp(address, 'i'),
    }, {
      IDAddressList: new RegExp(address, 'i'),
    }]
  );
  const obj = org.CEAddressList.find((elem) => (elem.indexOf(address)!=-1)) ||
    org.IDAddressList.find((elem) => (elem.indexOf(address)!=-1));
  const ext = JSON.parse(obj);
  ext.ORGaddress = org.ORGaddress;
  return ext;
};

export {
  doWithAllCE,
  doWithAllID,
  getDataFromDB,
};
