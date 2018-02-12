const socket = io();

const userSignup = () => {
  respSU.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/user/signup');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = {
    email: emailSU.value,
    firstName: firstNameSU.value,
    lastName: lastNameSU.value,
    password: passwordSU.value
  };
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    respSU.innerHTML = event.target.responseText;
  };
};

const userLogin = () => {
  respLG.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/user/login');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = {
    email: emailLG.value,
    password: passwordLG.value
  };
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    respLG.innerHTML = event.target.responseText;
  };
};

const userLogout = () => {
  respLGT.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/user/logout');
  xhr.send();
  xhr.onload = (event) => {
    respLGT.innerHTML = event.target.responseText;
  };
};

const userGet = () => {
  respGT.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/user');
  xhr.send();
  xhr.onload = (event) => {
    respGT.innerHTML = event.target.responseText;
  };
};

const userChange = () => {
  respCH.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/user/change');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = {
    firstName: (firstNameCH.value) ? firstNameCH.value : undefined,
    lastName: (lastNameCH.value) ? lastNameCH.value : undefined,
    tags: (tagsCH.value) ? tagsCH.value : undefined,
    trans: (transCH.value) ? transCH.value : undefined,
    password: (passwordCH.value) ? passwordCH.value : undefined,
    newpassword: (newpasswordCH.value) ? newpasswordCH.value : undefined
  };
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    respCH.innerHTML = event.target.responseText;
  };
};

const userDelete = () => {
  respDL.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/user/delete');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = {
    password: passwordDL.value
  };
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    respDL.innerHTML = event.target.responseText;
  };
};

const userForgot = () => {
  respFG.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/user/forgot');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = {
    email: emailFG.value
  };
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    const link = JSON.parse(event.target.responseText).data;
    respFG.innerHTML = '<a href="'+link+'" target="_blank">'+link+'</a>';
  };
};

const getOrganization = () => {
  respORG.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getOrganization');
  xhr.send();
  xhr.onload = (event) => {
    respORG.innerHTML = event.target.responseText;
  };
};

const addDataCE = (data) => {
  respCE.innerHTML = respCE.innerHTML + data + ',';
};

const getCharityEvents = () => {
  respCE.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getCharityEvents');
  xhr.send();
  xhr.onload = (event) => {
    console.log(event.target.responseText);
    socket.on(event.target.responseText, addDataCE);
    setTimeout((listener) => {
      socket.removeListener(listener, addDataCE);
      console.log('socket removed - ' + listener);
    },20000, event.target.responseText);
  };
};

const addDataID = (data) => {
  respID.innerHTML = respID.innerHTML + data + ',';
};

const getIncomingDonations = () => {
  respID.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getIncomingDonations');
  xhr.send();
  xhr.onload = (event) => {
    console.log(event.target.responseText);
    socket.on(event.target.responseText, addDataID);
    setTimeout((listener) => {
      socket.removeListener(listener, addDataID);
      console.log('socket removed - ' + listener);
    },20000, event.target.responseText);
  };
};

const getCharityEvent1 = () => {
  respCE1.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getCharityEvent/'+hashCE1.value);
  xhr.send();
  xhr.onload = (event) => {
    respCE1.innerHTML = event.target.responseText;
  };
};

const getIncomingDonation1 = () => {
  respCE1.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getIncomingDonation/'+hashID1.value);
  xhr.send();
  xhr.onload = (event) => {
    respID1.innerHTML = event.target.responseText;
  };
};

const addDataFCE = (data) => {
  respFCE.innerHTML = respFCE.innerHTML + data + ',';
};

const filterCharityEvent = () => {
  respFCE.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/dapp/getCharityEvents');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = JSON.parse(filterCE.value);
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    console.log(event.target.responseText);
    socket.on(event.target.responseText, addDataFCE);
    setTimeout((listener) => {
      socket.removeListener(listener, addDataFCE);
      console.log('socket removed - ' + listener);
    },20000, event.target.responseText);
  };
};

const addDataFID = (data) => {
  respFID.innerHTML = respFID.innerHTML + data + ',';
};

const filterIncomingDonation = () => {
  respFID.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/dapp/getIncomingDonations');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = JSON.parse(filterID.value);
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    console.log(event.target.responseText);
    socket.on(event.target.responseText, addDataFID);
    setTimeout((listener) => {
      socket.removeListener(listener, addDataFID);
      console.log('socket removed - ' + listener);
    },20000, event.target.responseText);
  };
};