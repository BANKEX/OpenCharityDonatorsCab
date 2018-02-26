# OpenCharityDonatorsCab

## Установка
1. склонировать репозиторий
2. npm install
3. настроить файлы config: development.yaml, staging.yaml и production.yaml
4. Для запуска в development-окружении: npm run development
5. Для запуска в окружениях staging | production:
    * создать пустую папку build в корне проекта
    * npm run build
    * npm run staging | production

## Тестирование
1. Установить mocha глобально: npm i mocha -g
2. Тестирование:
    * запустить сервер в требуемом окружении (development | staging | production)
    * запустить тестирование npm run testDev | testStage | testProd

## Страница тестирования API
По адресу /api/testAPI доступен интерфейс тестирования всех функций API.<br/>
Все фронтэнд-функции для работы с API см. в /public/api/testAPI.js

## Работа с пользователями

### POST /api/user/signup
Регистрация пользователя на сервере.<br/>
Вернет ошибку если пользователь уже авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
В JSON должны находиться обзательные поля для создания пользователя.<br/>
В данный момент это ['email', 'firstName', 'lastName']<br/>
При успешной регистрации генерируется случайный пароль и отправляется на указанный email.
Возвращает 'Ok'.
Ok - не гарантирует доставки письма или ошибки при несуществующем email.

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
Вернет ошибку если пользователь авторизован.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательное поле email.<br/>
Отправляет на email пользователя новый пароль.
Возвращает Ok.
Ok - не гарантирует доставки письма или ошибки при несуществующем email.

### GET /api/user/setNewPassword?token=... - !deprecated!
При переходе по ссылке в письме (о забывании пароля) отдает страницу для ввода нового пароля<br/>
Вернет ошибку если пользователь авторизован или истекло время жизни временного токена.<br/>

### POST /api/user/setNewPassword?token=... - !deprecated!
Изменяет пароль на новый.<br/>
Вернет ошибку если пользователь авторизован или истекло время жизни временного токена.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательное поле password.<br/>
Возвращает 'Ok'.

## Работа с DAPP
> Подписка на сокеты '/api/ws'
    const socket = io({path: '/api/ws'});

### GET /api/dapp/getOrganizations
Вернет JSON-массив всех организаций:
```
    {
        "CEAddressList":[
            "{\"CEaddress\":\"0x4fEfEB18f51D658ab7Bf71f7613196F9401AF87f\",\"date\":\"2018-2-18 18:55:15\"}",
            "{\"CEaddress\":\"0x36C9723fae0DB884ed216c2b86B09C3206C4b15C\",\"date\":\"2018-2-18 18:59:22\"}",
            "{\"CEaddress\":\"0x01cc0d6f28eF1910069D3B81c70B5ea4a8A39B4F\",\"date\":\"2018-2-18 19:20:13\"}",
            "{\"CEaddress\":\"0x1195d3E480Af739d632e498b8C968eAcC460aF83\",\"date\":\"2018-2-18 19:39:06\"}",
            "{\"CEaddress\":\"0x354161f3d92158D8740C2E5f5D8088366299292C\",\"date\":\"2018-2-18 19:45:29\"}"
        ],
        "IDAddressList":[],
        "name":"Staging Test Organization 2",
        "charityEventCount":5,
        "incomingDonationCount":0,
        "ORGaddress":"0xc9afa3e4e78a678ffb836c4062547b1dc8dd592f"
    }
```
CEAddressList - массив всех charityEvent (только адрес и дата) данной организации - это СТРОКА JSON. Ее надо парсить в объект!

### GET /api/dapp/getCharityEvents/:org
Получить все charityEvents данной организации.<br/>
Принимает адрес организации в :org.<br/>
Вернет roomID для сокет-подписки.<br/>
Необходимо подписаться на событие 'data' в данной комнате.<br/>
Сокет присылает объекты {charityEventObject}
```
charityEventObject: {
    name, payed, target, raised, tags, date, address, ORGaddress
}
```
По окончании списка придет data = 'close'. Рекомендуется удалить listener.

### GET /api/dapp/getIncomingDonations/:org
Как GET /api/dapp/getCharityEvents/:org только для IncomingDonation
```
incomingDonationsObject: {
    realWorldIdentifier, amount, note, tags, date, address, ORGaddress
}
```
### GET /api/dapp/getCharityEvent/:hash
Вернет JSON данного CharityEvent по hash {charityEventObject}

### GET /api/dapp/getIncomingDonation/:hash
Вернет JSON данного IncomingDonation по hash {incomingDonationsObject}

### POST /api/dapp/getCharityEvents
Выдает отфильтрованные CharityEvents.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
JSON запроса может включать ORGaddress (один элемент или массив элементов). Если ORGaddress == undefined, фильтрация производится по всем организаиям.<br/>
Фильтрация производится по всем полям {charityEventObject} <br/>
Фильтрация производится по трем параметрам: <br/>
1. include (значение строка) - поле содержит данную подстроку.
2. enum (значение массив строк) - поле равно одному из значений массива.
3. range (значение массив из двух элементов либо чисел, либо дат) - поле укладывается в указанный диапазон
<br/>
Пример тела запроса:
```
    {
        "ORGaddress": [
            "0xe379894535aa72706396f9a3e1db6f3f5e4c1c15",
            "0xbb8251c7252b6fec412a0a99995ebc1a28e4e103"
        ],
        "date": {
            "range": ["2018-2-8 11:40:51", "2018-2-10 11:45:51"]
        },
        "name": {
            "include": "test"
        },
        "tags": {
            "enum": ["0x23", "0x06"]
        }
    }
```
Вернет roomID для сокет-подписки.<br/>
Необходимо подписаться на событие 'data' в данной комнате.<br/>
Сокет присылает объекты {charityEventObject} или false (если charityEvent не соответствет фильтру)<br/>
По окончании списка придет data = 'close'. Рекомендуется удалить listener.

### POST /api/dapp/getIncomingDonation
Как POST /api/dapp/getCharityEvents только для IncomingDonation

### POST /api/dapp/search
Ищет запрос в проиндексированных данных.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Запрос может быть двух видов:
1. Обычный текстовый запрос. Например, строка 'космос текст' найдет все документы где в теле упоминаются оба этих слова.
2. Запрос JSON по правилам библиотеки search-index (https://github.com/fergiemcdowall/search-index/blob/master/docs/search.md)
Возвращает объект вида:
```
    {multiHash: {document}, multiHash: {document}, ...}
```
multiHash актуален только для метаданных. По нему можно найти соответствующий документ на метасервере.

### Онлайн-подписка на новые charityEvents и incomingDonations
```
socket.on('newCharityEvent', console.log);
socket.on('newIncomingDonation', console.log);
```