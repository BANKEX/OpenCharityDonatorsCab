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
Получить все charityEvents указанной организации или всех организаций.<br/>
Принимает адрес организации в :org или 'all'.<br/>
При указании дополнительного параметра how=db будет использовать кэш базы данных. Иначе будет обращение к блокчейн.<br/>
Пример: `/api/dapp/getCharityEvents/all?how=db`<br/>
При запросе к DB вернет массив {charityEventObject}.<br/>
При запросе к блокчейн вернет объект { roomID, quantity } для сокет-подписки. Необходимо подписаться на событие 'data' в данной комнате. Сокет присылает объекты {charityEventObject}
```
charityEventObject: { name, payed, target, raised, metaStorageHash, tags, date, address, ORGaddress }
```
По окончании списка придет data = 'close'. Рекомендуется удалить listener.

### GET /api/dapp/getIncomingDonations/:org
Как GET /api/dapp/getCharityEvents/:org только для IncomingDonation
```
incomingDonationsObject: { realWorldIdentifier, amount, note, tags, date, address, ORGaddress }
```
### GET /api/dapp/getCharityEvent/:hash
Вернет JSON данного CharityEvent по hash.<br/>
Вернет {charityEventObject} расширенный полем history<br/>
Поле history содержит массив JSON-строк { incomingDonation, amount, date, transactionHash }<br/>
Запрос из кэша DB осуществляется аналогчно getCharityEvents.

### GET /api/dapp/getIncomingDonation/:hash
Вернет JSON данного IncomingDonation по hash.<br/>
Вернет {incomingDonationsObject} расширенный полем history<br/>
Поле history содержит массив JSON-строк { charityEvent, amount, date, transactionHash }<br/>
Запрос из кэша DB осуществляется аналогчно getCharityEvents.

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
Принимает поля:
    * searchRequest(String) - пользовательский запрос как есть
    * type - одно из [organization, charityEvent, incomingDonation]
    * addition (Array of Strings)- дополнительные данные от фронтэнд (например, адрес организации)
    * pageSize (Integer)- размер страницы вывода результатов
    * page (Integer) - страница
    * how - метод получения информации: 'db' - из кэша DB, иначе - из блокчейн.
Возвращает данные аналогчно getCharityEvents: либо массив из DB, либо сокет-подписка.

### Онлайн-подписка на новые charityEvents и incomingDonations
```
socket.on('newCharityEvent', console.log);
socket.on('newIncomingDonation', console.log);
socket.on('moveFunds', console.log);
```