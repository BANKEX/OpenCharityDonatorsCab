import emailLib from 'emailjs/email.js';
import { ADDRESS, EMAIL } from 'configuration';

const mailServer = emailLib.server.connect({
  user: EMAIL.user,
  password: EMAIL.password,
  host: EMAIL.host,
  ssl: EMAIL.ssl,
});

export default (user, type, data) => {
  return new Promise( (resolve, reject) => {
    let textEmail = '';
    let subject = '';
    let t=[];
    t[0]='<html>';
    t[1]='<body align="center"> <div style="max-width:600px; border:solid; background-color: #252525; color: white; border-radius: 8px; border-width: 1px; padding: 15px;" align="center">';
    t[2]='';
    t[3]='<img src="'+ADDRESS.external+'/api/logo.png" style="max-height: 100px;">';
    t[4]='<div align="left">';
    t[5]=''; // приветствие
    t[6]='';
    t[7]='';
    t[8]=''; // конкретика
    t[9]=''; // конкретика
    t[10]=''; // конкретика
    t[11]=''; // конкретика
    t[12]=''; // конкретика
    t[13]='</div></div></body></html>';

    switch (type) {
      case 'passwordCreate':
        subject = 'Успешная регистрация';
        t[5]='<h3>Здравствуйте, '+user.firstName+'!</h3>';
        t[6]='<p>Вы успешно зарегистрировались на сайте <a href="'+ADDRESS.external+'" style="color: #2ad">'+ADDRESS.external+'</a></p>';
        t[9]='<p>Ваш пароль: '+ data.newPassword + '</p>';
        t[10]='<p>Рекомендуем изменить пароль и настроить свой аккаунт в "Личном кабинете"</p>';
        textEmail=t.join('');
        break;
      case 'passwordForgot':
        subject = 'Восстановление пароля';
        t[5]='<h3>Здравствуйте, '+user.firstName+'!</h3>';
        t[6]='<p>Вы запросили восстановление пароля на сайте <a href="'+ADDRESS.external+'" style="color: #2ad">'+ADDRESS.external+'</a></p>';
        t[9]='<p>Ваш новый пароль: '+ data.newPassword + '</p>';
        t[10]='<p>Рекомендуем изменить пароль и настроить свой аккаунт в "Личном кабинете"</p>';
        textEmail=t.join('');
        break;
    }

    const message = {
      text: '',
      from: EMAIL.user,
      to: user.email,
      subject: 'OpenCharity - ' + subject,
      attachment: [{
        data: textEmail, 
        alternative: true,
      }],
    };

    mailServer.send(message, (err, mes) => {
      if (err) reject(err);
      resolve('Ok');
    });
  });
};
