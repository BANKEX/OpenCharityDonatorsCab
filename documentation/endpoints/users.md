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