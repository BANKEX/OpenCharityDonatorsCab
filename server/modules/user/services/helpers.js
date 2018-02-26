
const generateKey = (len) => {
  const str = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM012345678901234567890';
  const strLength = str.length;
  let key = '';
  let ind;
  for (let i=0; i<len; i++) {
    ind = Math.floor(Math.random()*strLength);
    key += str[ind];
  }
  return key;
};

export {
  generateKey,
};
