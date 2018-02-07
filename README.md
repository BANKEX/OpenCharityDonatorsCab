# OpenCharityDonatorsCab

## Установка
1. склонировать репозиторий
2. npm install
3. настроить файлы config: development.yaml, staging.yaml и production.yaml
```
    env: development
    address:
      protocol: http
      ip: 'localhost'
      port: 8080
    dirs:
      main: 'C:/NodeJS/oc_donators_cab'
      public: 'C:/NodeJS/oc_donators_cab/public/'
      abi: 'C:/NodeJS/oc_donators_cab/abi/'
    mongoURI: 'mongodb://user:password@ds119268.mlab.com:19268/opch-test'
    dapp:
      provider: 'http://52.166.13.111:8535'
      token: '0x9Dee536694e1f0Adc640972E61826732666345b3'
```
4. Для запуска в development-окружении: npm run development
5. Для запуска в staging или production -окружениях:
    * создать пустую папку build в корне проекта
    * npm run build
    * npm run staging или npm run production

## Тестирование
1. Установить mocha глобально: npm i mocha -g
2. Тестирование:
    * запустить сервер в требуемом окружении (development | staging | production)
    * запустить тестирование npm run testDev | testStage | testProd

## Работа с пользователями

### POST /api/user/signup
Регистрация пользователя на сервере.<br/>
Вернет ошибку если пользователь уже авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
В JSON должны находиться обзательные поля для создания пользователя.<br/>
В данный момент это ['email', 'firstName', 'lastName', 'password']<br/>
Возвращает JSON-объект {data: user}

### POST /api/user/login
Авторизация пользователя на сервер.<br/>
Вернет ошибку если пользователь уже авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
В JSON должны находиться обзательные поля для логина - ['email', 'password'].<br/>
Возвращает JSON-объект {data: token}<br/>
Кроме того, записывает token в cookie.jwt.

### GET /api/user/logout
Логаут пользователя.<br/>
Вернет ошибку если пользователь не авторизован.<br/>
Удаляет cookie.jwt и headers.authorization.<br/>
Редирект на '/'.

### GET /api/user
Вернет ошибку если пользователь не авторизован.<br/>
Возвращает JSON-объект {data: user}<br/>
```
{
    "data": {
        "tags": [
            "тэг",
            "#openCharity",
            "#наПеченькиДетям"
        ],
        "trans": [
            "516568816",
            "3423434"
        ],
        "_id": "5a6f09b2d2879918385caa68",
        "email": "asd@asd.asd",
        "firstName": "Пётр",
        "lastName": "Иванов",
        "hash": "d347487c-cb2f-47f1-a7a5-964876e70861"
    }
}
```
### Распознавание авторизации пользователя
Авториация распознается по 4 параметрам:
1. get запрос с параметром &jwt=key
2. post запрос json, в теле которого есть jwt: key
3. headers.authorization = key
4. cookie.jwt = key

### POST /api/user/change
Вернет ошибку если пользователь не авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Из JSON будут взяты в обработку поля (на данный момент это):
['firstName', 'lastName', 'tags', 'trans']<br/>
Если в JSON имеется поле 'newpassword' (новый пароль),
то требуется также поле 'password' (существующий пароль).<br/>
Возвращает JSON-объект {data: updatedUser}

### POST /api/user/delete
Удаление пользователя.<br/>
Вернет ошибку если пользователь не авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательное поле password.<br/>
Удаляет cookie.jwt и headers.authorization.<br/>
Редирект на '/'.

### POST /api/user/forgot
Пользователь забыл пароль, ввел в поле свой email, отправил данные.<br/>
Формирует временный токен (время жизни 20 минут).<br/>
Вернет ошибку если пользователь авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательное поле email.<br/>
Сейчас возвращает JSON {data: link}, позже будет отправлять email пользователю и возвращать Ok.

### GET /api/user/setNewPassword?token=...
При переходе по ссылке в письме (о забывании пароля) отдает страницу для ввода нового пароля<br/>
Вернет ошибку если пользователь авторизован или истекло время жизни временного токена.<br/>

### POST /api/user/setNewPassword?token=...
Изменяет пароль на новый.<br/>
Вернет ошибку если пользователь авторизован или истекло время жизни временного токена.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательное поле password.<br/>
Возвращает 'Ok'.

## Работа с DAPP

### GET /api/dapp/getOrganization
Вернет JSON единственной организации {data: organization}

### GET /api/dapp/getCharityEvents
Вернет JSON всех CharityEvents {data: [{charityEventObject}]}
```
charityEventObject: {
    name, payed, target, raised, tags, date, address
}
```
### GET /api/dapp/getIncomingDonations
Вернет JSON всех IncomingDonations {data: [{incomingDonationsObject}]}
```
incomingDonationsObject: {
    realWorldIdentifier, amount, note, tags, date, address
}
```
### GET /api/dapp/getCharityEvent/:hash
Вернет JSON данного CharityEvent по hash {data: {charityEventObject}}

### GET /api/dapp/getIncomingDonation/:hash
Вернет JSON данного IncomingDonation по hash {data: {incomingDonationsObject}}
