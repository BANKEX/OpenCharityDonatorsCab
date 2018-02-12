
const includeTest = (ceField, reqField) => {
  if (reqField.include!=undefined) {
    if (typeof reqField.include == 'string') {
      return (ceField.toLowerCase().indexOf(reqField.include.toLowerCase()) != -1);
    } else return false;
  } else return true;
};

const rangeTest = (ceField, reqField) => {
  if (reqField.range!=undefined) {
    if (Array.isArray(reqField.range)) {
      if (reqField.range.length == 2) {
        if (Date.parse(ceField)) {
          if (Date.parse(reqField.range[0]) && Date.parse(reqField.range[1])) {
            return (Date.parse(ceField) >= Date.parse(reqField.range[0]) && Date.parse(ceField) <= Date.parse(reqField.range[1]));
          } else return false;
        } else {
          if (!isNaN(Number(reqField.range[0])) && !isNaN(Number(reqField.range[1]))) {
            return (Number(ceField) >= Number(reqField.range[0]) && Number(ceField) <= Number(reqField.range[1]));
          } else return false;
        }
      } else return false;
    } else return false;
  } else return true;
};

const enumTest = (ceField, reqField) => {
  if (reqField.enum!=undefined) {
    if (Array.isArray(reqField.enum)) {
      let test = false;
      reqField.enum.forEach((elem) => {
        if (typeof elem == 'string') {
          test = test || (ceField.toLowerCase() == elem.toLowerCase());
        }
      });
      return test;
    } else return false;
  } else return true;
};

export default {
  cardOrganization: ['name', 'charityEventCount', 'incomingDonationCount', 'address'],
  cardCharityEvent: ['name', 'payed', 'target', 'raised', 'tags', 'date', 'address'],
  cardIncomingDonation: ['realWorldIdentifier', 'amount', 'note', 'tags', 'date', 'address'],
  filter(ce, reqFields) {
    let test = true;
    Object.getOwnPropertyNames(reqFields).forEach((fieldName) => {
      test = test
        && includeTest(ce[fieldName], reqFields[fieldName])
        && rangeTest(ce[fieldName], reqFields[fieldName])
        && enumTest(ce[fieldName], reqFields[fieldName]);
    });
    return (test) ? ce : false;
  },
};

