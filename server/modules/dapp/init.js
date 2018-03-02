import { DappService } from './services';
import { Organization } from './models';
import { INTERVALS } from 'configuration';

const syncOrganizations = async () => {
  const _ORGAddressList = await DappService.getOrganizationAddressList();

  await Promise.all(_ORGAddressList.map(async (ORGaddress) => {
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
    return true;
  }));
  
  await Promise.all(_ORGAddressList.map(async (ORGaddress) => {
    const CEAddressList = await DappService.getCharityEventAddressList(ORGaddress);
    const IDAddressList = await DappService.getIncomingDonationAddressList(ORGaddress);
    await Organization.update({ORGaddress}, { CEAddressList, IDAddressList });
    console.log('refresh lists ' + ORGaddress);
    return true;
  }));
  
  return _ORGAddressList;
};

let refInt;

const init = async () => {
  if (refInt) {
    console.log('clear refInt');
    clearInterval(refInt);
  }
  refInt = setInterval(syncOrganizations, INTERVALS.dapp.refreshOrganization);
  DappService.subscribe(await syncOrganizations());
};

export default init;
