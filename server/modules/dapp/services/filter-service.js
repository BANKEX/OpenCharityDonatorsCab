
const cardOrganization = ['name', 'charityEventCount', 'incomingDonationCount', 'address'];
const cardCharityEvent = ['name', 'payed', 'target', 'raised', 'tags', 'date', 'address'];
const cardIncomingDonation = ['realWorldIdentifier', 'amount', 'note', 'tags', 'date', 'address'];

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
        if (Date.parse(dataField)) {
          if (Date.parse(reqField.range[0]) && Date.parse(reqField.range[1])) {
            return (Date.parse(dataField) >= Date.parse(reqField.range[0]) && Date.parse(dataField) <= Date.parse(reqField.range[1]));
          } else return false;
        } else {
          if (!isNaN(Number(reqField.range[0])) && !isNaN(Number(reqField.range[1]))) {
            return (Number(dataField) >= Number(reqField.range[0]) && Number(dataField) <= Number(reqField.range[1]));
          } else return false;
        }
      } else return false;
    } else return false;
  } else return true;
};

const enumTest = (dataField, reqField) => {
  if (reqField.enum!=undefined) {
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

