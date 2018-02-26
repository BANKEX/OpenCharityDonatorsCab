import { DappService } from './services';
import { Organization } from './models';
import { INTERVALS } from 'configuration';


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

const init = () => {
  syncOrganizations().then(async (list) => {
    await refreshLists(list);
    const lastBlock = await DappService.getLastBlock();
    DappService.subscribe(list, lastBlock);
    setInterval(() => {
      syncOrganizations().then(refreshLists);
    }, INTERVALS.dapp.refreshOrganization);
  });
};

export default init;
