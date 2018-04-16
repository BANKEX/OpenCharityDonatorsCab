## Работа с DAPP

### GET /api/dapp/getOrganizations
Вернет массив всех организаций.</br>
```
    organizationObject: { name, charityEventCount, incomingDonationCount, ORGaddress }
```
При добавлении `?how=bc` будет читать данные с блокчейна и возвращать через сокет.<br/>

### GET /api/dapp/getCharityEvents/:org
Получить все charityEvents указанной организации или всех организаций.<br/>
Принимает адрес организации в :org или 'all'.<br/>
```
    charityEventObject: { name, payed, target, raised, metaStorageHash, tags, cdate, mdate, address, ORGaddress }
```
При добавлении `?how=bc` будет читать данные с блокчейна и возвращать через сокет.<br/>

### GET /api/dapp/getIncomingDonations/:org
Получить все incomingDonation указанной организации или всех организаций.<br/>
Принимает адрес организации в :org или 'all'.<br/> 
```
    incomingDonationObject: { realWorldIdentifier, amount, note, metaStorageHash, tags, cdate, mdate, address, ORGaddress }
```
При добавлении `?how=bc` будет читать данные с блокчейна и возвращать через сокет.<br/>

### GET /api/dapp/getCharityEvent/:hash
Вернет JSON данного CharityEvent по hash.<br/>
Вернет { charityEventObject } расширенный полем history<br/>
Поле history содержит массив { incomingDonation, amount, date, transactionHash }<br/>
При добавлении `?how=bc` будет читать данные с блокчейна и возвращать через сокет.<br/>

### GET /api/dapp/getIncomingDonation/:hash
Вернет JSON данного IncomingDonation по hash.<br/>
Вернет { incomingDonationsObject } расширенный полем history<br/>
Поле history содержит массив { charityEvent, amount, date, transactionHash }<br/>
При добавлении `?how=bc` будет читать данные с блокчейна и возвращать через сокет.<br/>

### POST /api/dapp/getCharityEvents
Выдает отфильтрованные CharityEvents.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
JSON запроса может включать ORGaddress (один элемент или массив элементов). Если ORGaddress == undefined, фильтрация производится по всем организаиям.<br/>
Фильтрация производится по всем полям { charityEventObject } <br/>
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
            "range": [1523877900000, 1523899900000]
        },
        "name": {
            "include": "test"
        },
        "tags": {
            "enum": ["0x23", "0x06"]
        }
    }
```
Вернет массив charityEventObject <br/>

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
    * how - метод получения информации: 'bc' - из блокчейн, иначе - из DB.
При `how==bc` будет читать данные с блокчейна и возвращать через сокет.<br/>

### Сокет-подписка
> Подписка на сокеты '/api/ws': `const socket = io({path: '/api/ws'})`

В ответ на запрос с параметром чтения из блокчейн вернет { roomID, quantity }. <br/>
Необходимо подписаться на событие 'data' в данной комнате. Сокет присылает в одном сообщении один объект.<br/>
По окончании списка придет data = 'close'. Рекомендуется удалить listener.

```
socket.on('newCharityEvent', console.log);
socket.on('newIncomingDonation', console.log);
socket.on('editCharityEvent', console.log);
socket.on('editIncomingDonation', console.log);
socket.on('moveFunds', console.log);
```