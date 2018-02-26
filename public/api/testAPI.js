const socket = io({path: '/api/ws'});

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
    // const link = JSON.parse(event.target.responseText).data;
    // respFG.innerHTML = '<a href="'+link+'" target="_blank">'+link+'</a>';
    respFG.innerHTML = event.target.responseText;
  };
};

const addData = (div, data) => {
  const d = document.createElement('div');
  d.style.whiteSpace = 'nowrap';
  d.innerHTML = data;
  div.appendChild(d);
};

const socketResponse = (event, div) => {
  console.log(event.target.responseText);
  const dataListener = (data) => {
    if (data!='close') {
      addData(div, data);
    } else {
      socket.removeEventListener(event.target.responseText, dataListener);
      console.log(event.target.responseText + ' - removed');
    }
  };

  socket.on(event.target.responseText, dataListener);
};

const getOrganizations = () => {
  respORG.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getOrganizations');
  xhr.send();
  xhr.onload = (event) => {
    JSON.parse(event.target.responseText).forEach((elem) => {
      addData(respORG, JSON.stringify(elem));
    });
  };
};

const getCharityEvents = () => {
  respCE.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getCharityEvents/'+orgCE.value);
  xhr.send();
  xhr.onload = (event) => {
    socketResponse(event, respCE);
  };
};

const getIncomingDonations = () => {
  respID.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getIncomingDonations/'+orgID.value);
  xhr.send();
  xhr.onload = (event) => {
    socketResponse(event, respID);
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
  respID1.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/dapp/getIncomingDonation/'+hashID1.value);
  xhr.send();
  xhr.onload = (event) => {
    respID1.innerHTML = event.target.responseText;
  };
};

const filterCharityEvent = () => {
  respFCE.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/dapp/getCharityEvents');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = JSON.parse(filterCE.value);
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    socketResponse(event, respFCE);
  };
};

const filterIncomingDonation = () => {
  respFID.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/dapp/getIncomingDonations');
  xhr.setRequestHeader('content-type', 'application/json');
  const body = JSON.parse(filterID.value);
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    socketResponse(event, respFID);
  };
};

const search = () => {
  respSI.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/dapp/search');
  xhr.setRequestHeader('content-type', 'application/json');
  let searchReq;
  try {
    searchReq = JSON.parse(textSI.value.toLowerCase())
  } catch(e) {
    searchReq = false;
  }
  body = (searchReq) ? searchReq : {text: textSI.value.toLowerCase()};
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    respSI.innerHTML = event.target.responseText;
  };
};

socket.on('newCharityEvent', (data) => {
  console.log(data);
  newEventCE.style.display = 'block';
  newEventCE.innerHTML = Number(newEventCE.innerHTML)+1;
});

socket.on('newIncomingDonation', (data) => {
  console.log(data);
  newEventID.style.display = 'block';
  newEventID.innerHTML = Number(newEventID.innerHTML)+1;
});