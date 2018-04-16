
const cardOrganization = ['name', 'charityEventCount', 'incomingDonationCount', 'address'];
const cardCharityEvent = ['name', 'payed', 'target', 'raised', 'tags', 'cdate', 'mdate', 'address', 'metaStorageHash'];
const cardIncomingDonation = ['realWorldIdentifier', 'amount', 'note', 'tags', 'cdate', 'mdate', 'address', 'metaStorageHash'];

const includeTest = (dataField, reqField) => {
  if (reqField.include) {
    if (typeof reqField.include == 'string') {
      return (dataField.toLowerCase().indexOf(reqField.include.toLowerCase()) != -1);
    } else return false;
  } else return true;
};

const rangeTest = (dataField, reqField) => {
  if (reqField.range) {
    if (Array.isArray(reqField.range)) {
      if (reqField.range.length == 2) {
        if (!isNaN(Number(dataField)) && !isNaN(Number(reqField.range[0])) && !isNaN(Number(reqField.range[1]))) {
          return (Number(dataField) >= Number(reqField.range[0]) && Number(dataField) <= Number(reqField.range[1]));
        } else return false;
      } else return false;
    } else return false;
  } else return true;
};

const enumTest = (dataField, reqField) => {
  if (reqField.enum) {
    if (Array.isArray(reqField.enum)) {
      let test = false;
      reqField.enum.forEach((elem) => {
        if (typeof elem == 'string') {
          test = test || (dataField.toLowerCase() == elem.toLowerCase());
        }
      });
      return test;
    } else return false;
  } else return true;
};

const filter = (data, reqFields) => {
  let test = true;
  Object.getOwnPropertyNames(reqFields).forEach((fieldName) => {
    test = test
      && includeTest(data[fieldName], reqFields[fieldName])
      && rangeTest(data[fieldName], reqFields[fieldName])
      && enumTest(data[fieldName], reqFields[fieldName]);
  });
  return (test) ? data : false;
};

export default {
  cardOrganization,
  cardCharityEvent,
  cardIncomingDonation,
  filter,
};

