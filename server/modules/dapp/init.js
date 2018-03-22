import { DappService } from './services';
import { Organization, CharityEvent, IncomingDonation, Metamap } from './models';
import { INTERVALS, DIRS } from 'configuration';
let refInt;

const syncOrganizations = async () => {
  await Organization.remove();
  await CharityEvent.remove();
  await IncomingDonation.remove();
  await Metamap.remove();
  const _ORGAddressList = await DappService.getOrganizationAddressList();

  await Promise.all(_ORGAddressList.map(async (ORGaddress) => {
    const orgData = await DappService.singleOrganization(ORGaddress);
    const orgFromDB = await Organization.findOne({ ORGaddress });
    if (orgFromDB) {
      await Organization.update({ ORGaddress }, orgData);
      // console.log('updated '+ORGaddress);
    } else {
      orgData.ORGaddress = ORGaddress;
      await Organization.create(orgData);
      // console.log('created ' +ORGaddress);
    }
    return true;
  }));
  
  await Promise.all(_ORGAddressList.map(async (ORGaddress) => {
    const CEAddressList = await DappService.getCharityEventAddressList(ORGaddress);
    const IDAddressList = await DappService.getIncomingDonationAddressList(ORGaddress);
    await Organization.update({ORGaddress}, { CEAddressList, IDAddressList });
    // console.log('refresh lists ' + ORGaddress);
    return true;
  }));
  
  return _ORGAddressList;
};

export default async (first) => {
  if (refInt) clearInterval(refInt);
  refInt = setInterval(syncOrganizations, INTERVALS.dapp.refreshOrganization);
  const ORGAddressList = await syncOrganizations();
  if (first) DappService.subscribe(ORGAddressList);

  // нужна функци переподписки на новые организации по рефрешу.
  return true;
};
