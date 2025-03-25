import {expect, test} from "@playwright/test";
import * as dotenv from 'dotenv';
import {ApiClient} from "../apiClient";
import {
    createTodoWithInvalidDoneStatus,
    createTodoWithLongDescription,
    createTodoWithMaxDescriptionMaxTitle,
    createTodoWithLongTitle,
    createValidTodo,
    createTodoWithLongContentLength,
    createTodoWithInvalidKey,
    updateTitle,
    fullUpdateTodo,
    updateDescription, createXmlTodo, restoreProgressBody
} from "../payloads";
import {
    createNewTodo,
    filterChecker,
    getClientProgress, getRandomTodoObject,
    getTodosLength,
    getTodosList, getTodosListToRestore,
    parseStringToJson
} from "../helpers";
import {faker} from "@faker-js/faker"

dotenv.config();

test.describe.serial("Api challenge", () => {
    const URL = process.env.BASE_URL;
    let token;
    let apiClient
    let apiRequestContext
    let todoObjectLength
    let secondApiClient
    let secondApiContext


    test.beforeAll('01 POST /challenger (201)',async ({ playwright }) => {
        apiRequestContext = await playwright.request.newContext({
            baseURL: URL,
        });
        apiClient = new ApiClient(URL, apiRequestContext);
        await apiClient.authenticate();
    });

    test.afterAll('Уничтожить контекст', async () => {
        await apiRequestContext.dispose();
    });

    test('02 GET /challenges (200)',  {tag: '@get'},async () =>{
        const response = await apiClient.get('challenges');
        const responseBody = await response.json();
        expect(response.status()).toBe(200);
        expect(responseBody.challenges.length).toBe(parseInt(process.env.CHALLENGES_COUNT));
    });

    test(`03 GET /todos (200)`,  {tag: '@get'},async () =>{
        const response = await apiClient.get('todos');
        const responseBody = await response.json();
        expect(response.status()).toBe(200);
        expect(Array.isArray(responseBody.todos)).toBe(true);

    });

    test('04 GET /todo (404) not plural', {tag: '@get'},async () =>{
        const response = await apiClient.get(`todo`);
        expect(response.status()).toBe(404);
    })

    test('05 GET /todos/{id} (200)', {tag: '@get'},async () =>{
        const randomTodoObject = await getRandomTodoObject(apiClient)
        const response = await apiClient.get(`todos/${randomTodoObject.id}`);
        const responseBody = await response.json();
        expect(response.status()).toBe(200);
        expect(responseBody.todos[0]).toEqual(randomTodoObject)
    })

    test('06 GET /todos/{id} (404)', {tag: '@get'},async () =>{
        const response = await apiClient.get(`todos/${todoObjectLength + Math.floor(Math.random() * 100)}`);
        expect(response.status()).toBe(404);
    })

    test('07 GET /todos (200) ?filter', {tag: '@get'},async () =>{
        const payload = createValidTodo()
        const createTodo = await apiClient.post(`todos`, payload)
        const doneStatus = process.env.DONE_STATUS;
        const response = await apiClient.get(`todos?doneStatus=${doneStatus}`);
        const responseBody = await response.json()
        expect(response.status()).toBe(200);
        expect(Array.isArray(responseBody.todos)).toBe(true);
        //проверить что все задачи соответствуют фильтру
        let errors = filterChecker(responseBody, doneStatus)
        if (errors.length > 0) {
            expect(errors).toEqual([]);
        }
    })

    test('08 HEAD /todos (200)', {tag: '@head'},async () =>{
        const response = await apiClient.head(`todos`);
        expect(response.status()).toBe(200);
    })

    test('09 POST /todos (201)', {tag: '@post'},async () =>{
        const payload = createValidTodo()
        const response = await apiClient.post(`todos`, payload);
        const createTodoResponseBody = await response.json();
        const createdTodoId = createTodoResponseBody.id
        expect(response.status()).toBe(201);
        //Копия createTodoResponseBody, в которой удален ключ id.
        // Добавил отдельной переменной, т.к. в следующих экспектах проверяю по полному сравнению двух объектов
        let createdTodo = {...createTodoResponseBody}
        delete createdTodo.id
        expect(payload).toEqual(createdTodo)
        //По фильтру получаю созданную задачу и сравниваю её с отправленным запросом на создание задачи
        let todoResponse = await apiClient.get(`todos?id=${createdTodoId}`);
        expect(todoResponse.status()).toBe(200)
        let todosResponseBody = await todoResponse.json();
        todosResponseBody = todosResponseBody.todos[0]
        expect(createTodoResponseBody).toEqual(todosResponseBody)
    })

    test('10 POST /todos (400) doneStatus', {tag: '@post'},async () =>{
        //Получаем количество задач до теста
        const todosCount = await getTodosLength(apiClient)
        //Запрос на создание инвалидной задачи
        const payload = createTodoWithInvalidDoneStatus()
        const response = await apiClient.post(`todos`, payload);
        expect(response.status()).toBe(400);
        //Получаем количество задач после попытки создания инвалидной задачи
        const todosAfterPostCount = await getTodosLength(apiClient)
        expect(todosCount).toBe(todosAfterPostCount)
    })

    test('11 POST /todos (400) title too long', {tag: '@post'},async () =>{
        //Получаем количество задач до теста
        const todosCount = await getTodosLength(apiClient)
        //Запрос на создание инвалидной задачи
        const payload = createTodoWithLongTitle()
        const response = await apiClient.post(`todos`, payload);
        expect(response.status()).toBe(400);
        //Получаем количество задач после попытки создания инвалидной задачи
        const todosAfterPostCount = await getTodosLength(apiClient)
        expect(todosCount).toBe(todosAfterPostCount)
    })

    test('12 POST /todos (400) description too long', {tag: '@post'},async () =>{
        //Получаем количество задач до теста
        const todosCount = await getTodosLength(apiClient)
        //Запрос на создание инвалидной задачи
        const payload = createTodoWithLongDescription()
        const response = await apiClient.post(`todos`, payload);
        expect(response.status()).toBe(400);
        //Получаем количество задач после попытки создания инвалидной задачи
        const todosAfterPostCount = await getTodosLength(apiClient)
        expect(todosCount).toBe(todosAfterPostCount)
    })

    test('13 POST /todos (201) max out content', {tag: '@post'},async () =>{
        //Запрос на создание задачи с максимальным количеством символов в контенте
        const payload = createTodoWithMaxDescriptionMaxTitle()
        const response = await apiClient.post(`todos`, payload);
        const createTodoResponseBody = await response.json();
        const createdTodoId = createTodoResponseBody.id
        expect(response.status()).toBe(201);
        //Копия createTodoResponseBody, в которой удален ключ id.
        // Добавил отдельной переменной, т.к. в следующих экспектах проверяю по полному сравнению двух объектов
        let createdTodo = {...createTodoResponseBody}
        delete createdTodo.id
        expect(payload).toEqual(createdTodo)
        //По фильтру получаю созданную задачу и сравниваю её с отправленным запросом на создание задачи
        let todoResponse = await apiClient.get(`todos?id=${createdTodoId}`);
        expect(todoResponse.status()).toBe(200)
        let todosResponseBody = await todoResponse.json();
        todosResponseBody = todosResponseBody.todos[0]
        expect(createTodoResponseBody).toEqual(todosResponseBody)
    })

    test('14 POST /todos (413) content too long', {tag: '@post'},async () =>{
        //Получаем количество задач до теста
        const todosCount = await getTodosLength(apiClient)
        //Запрос на создание инвалидной задачи
        const payload = createTodoWithLongContentLength()
        const response = await apiClient.post(`todos`, payload);
        expect(response.status()).toBe(413);
        //Получаем количество задач после попытки создания инвалидной задачи
        const todosAfterPostCount = await getTodosLength(apiClient)
        expect(todosCount).toBe(todosAfterPostCount)
    })

    test('15 POST /todos (400) extra', {tag: '@post'},async () =>{
        //Получаем количество задач до теста
        const todosCount = await getTodosLength(apiClient)
        //Запрос на создание инвалидной задачи
        const payload = createTodoWithInvalidKey()
        const response = await apiClient.post(`todos`, payload);
        expect(response.status()).toBe(400);
        //Получаем количество задач после попытки создания инвалидной задачи
        const todosAfterPostCount = await getTodosLength(apiClient)
        expect(todosCount).toBe(todosAfterPostCount)
    })

    test('16 PUT /todos/{id} (400)', {tag: '@put'},async () =>{
        //Получаем количество задач до теста
        const todosCount = await getTodosLength(apiClient)
        const randomTodoId = todosCount + Math.floor(Math.random() * 100)
        const payload = createValidTodo()
        const response = await apiClient.put(`todos/${randomTodoId}`, payload);
        expect(response.status()).toBe(400);
        //Проверяем что объект не создан
        const getResponse = await apiClient.get(`todos/${randomTodoId}`);
        expect(response.status()).toBe(400);
    })

    test('17 POST /todos/{id} (200)', {tag: '@post'},async () =>{
        //Получаем массив задач
        const todosListResponse = await apiClient.get(`todos`);
        const todosResponseBody = await todosListResponse.json();
        const todosArray = todosResponseBody.todos
        //Выбираем рандомную задачу
        let randomTodo = todosArray[Math.floor(Math.random() * todosArray.length)]
        //Меняем title
        const payload = updateTitle()
        //Меняем title в исходном запросе, чтобы можно было сравнить с ответом на обновление задачи
        randomTodo.title = payload.title
        //Запрос на обновление задачи
        const response = await apiClient.post(`todos/${randomTodo.id}`, payload);
        const responseBody = await response.json();
        expect(response.status()).toBe(200);
        //Сравниваем что title совпадает
        expect(responseBody).toEqual(randomTodo)
    })

    test('18 POST /todos/{id} (404)', {tag: '@post'},async () =>{
        const responseTodos = await apiClient.get('todos');
        const todoObjectLength = await getTodosLength(apiClient)
        const payload = updateTitle()
        const response = await apiClient.post(`todos/${(todoObjectLength + 1)}`, payload);
        expect(response.status()).toBe(404);
    })

    test('19 PUT /todos/{id} full (200)', {tag: '@put'},async () =>{
        //создать задачу
        const createdTodo = await createNewTodo(apiClient)
        //Получить ее id
        const createdTodoId = createdTodo.id
        //Создать новый payload
        const payload = fullUpdateTodo(createdTodoId)
        //Отправить запрос на обновление
        const response = await apiClient.put(`todos/${createdTodoId}`, payload);
        //Проверить что ответ 200
        expect(response.status()).toBe(200);
        //Получить по ключу её и сравнить с payload
        const responseBody = await response.json();
        expect(responseBody).toEqual(payload)
    })

    test('20 PUT /todos/{id} partial (200)', {tag: '@put'},async () =>{
        //создать задачу
        const createdTodo = await createNewTodo(apiClient)
        //Получить ее id
        const createdTodoId = createdTodo.id
        //Создать новый payload
        const payload = updateTitle()
        //Отправить запрос на обновление
        const response = await apiClient.put(`todos/${createdTodoId}`, payload);
        //Проверить что ответ 200
        expect(response.status()).toBe(200);
        //Получить по ключу её и сравнить с payload
        const responseBody = await response.json();
        expect(responseBody.title).toEqual(payload.title)
    })

    test('21 PUT /todos/{id} no title (400)', {tag: '@put'},async () =>{
        //создать задачу
        const createdTodo = await createNewTodo(apiClient)
        //Получить ее id
        const createdTodoId = createdTodo.id
        //Создать новый payload
        const payload = updateDescription()
        //Отправить запрос на обновление
        const response = await apiClient.put(`todos/${createdTodoId}`, payload);
        //Проверить что ответ 200
        expect(response.status()).toBe(400);
        //Получить по ключу её и сравнить с payload
        const responseUpdatedTodo = await apiClient.get(`todos/${createdTodoId}`)
        const responseUpdatedTodoBody = await responseUpdatedTodo.json()
        expect(responseUpdatedTodoBody.todos[0]).toEqual(createdTodo)
    })

    test('22 PUT /todos/{id} no amend id (400)', {tag: '@put'},async () =>{
        //создать задачу
        const createdTodo = await createNewTodo(apiClient)
        //Получить ее id
        const createdTodoId = createdTodo.id
        //Создать новый payload
        const payload = fullUpdateTodo(createdTodoId+1)
        //Отправить запрос на обновление
        const response = await apiClient.put(`todos/${createdTodoId}`, payload);
        //Проверить что ответ 200
        expect(response.status()).toBe(400);
    })

    test('23 DELETE /todos/{id} (200)', {tag: '@delete'},async () =>{
        //создать задачу
        const createdTodo = await createNewTodo(apiClient)
        //Получить ее id
        const createdTodoId = createdTodo.id
        //Отправить запрос на удаление
        const response = await apiClient.delete(`todos/${createdTodoId}`);
        //Проверить что ответ 200
        expect(response.status()).toBe(200);
        //Проверить что при запросе удаленного задания вернется 404
        const getDeletedTodoResponse = await apiClient.get(`todos/${createdTodoId}`)
        expect(getDeletedTodoResponse.status()).toBe(404)
    })

    test(`24 OPTIONS /todos (200)`,  {tag: '@options'},async () =>{
        const response = await apiClient.options('todos');
        expect(response.status()).toBe(200)
    });

    test(`25 GET /todos (200) XML`,  {tag: '@get'},async () => {
        const response = await apiClient.getWithCustomAccept('todos', 'application/xml');
        expect(response.status()).toBe(200);
        const headers = response.headers();
        const contentType = headers['content-type']
        expect(contentType).toContain('application/xml');
    })

    test(`26 GET /todos (200) JSON`,  {tag: '@get'},async () => {
        const response = await apiClient.getWithCustomAccept('todos', 'application/json');
        expect(response.status()).toBe(200);
        const headers = response.headers();
        const contentType = headers['content-type']
        expect(contentType).toContain('application/json');
    })

    test(`27 GET /todos (200) ANY`,  {tag: '@get'},async () => {
        const response = await apiClient.getWithCustomAccept('todos', '*/*');
        expect(response.status()).toBe(200);
        const headers = response.headers();
        const contentType = headers['content-type']
        expect(contentType).toContain('application/json');
    })

    test(`28 GET /todos (200) XML pref`,  {tag: '@get'},async () => {
        const response = await apiClient.getWithCustomAccept('todos', 'application/xml,application/json');
        expect(response.status()).toBe(200);
        const headers = response.headers();
        const contentType = headers['content-type']
        expect(contentType).toContain('application/xml');
    })

    test(`29 GET /todos (200) no accept`,  {tag: '@get'},async () => {
        const response = await apiClient.getWithCustomAccept('todos', '');
        expect(response.status()).toBe(200);
        const headers = response.headers();
        const contentType = headers['content-type']
        expect(contentType).toContain('application/json');
    })

    test(`30 GET /todos (406)`,  {tag: '@get'},async () => {
        const response = await apiClient.getWithCustomAccept('todos', 'application/gzip');
        expect(response.status()).toBe(406);
    })

    test('31 POST /todos XML', {tag: '@post'},async () =>{
        const payload = createXmlTodo()
        const response = await apiClient.postWithCustomAcceptAndContentType(`todos`, payload, 'application/xml', 'application/xml');
        expect(response.status()).toBe(201);
        let createTodoResponseBodyText = await response.text();
        let createTodoResponseBody = await parseStringToJson(createTodoResponseBodyText)
        createTodoResponseBody = createTodoResponseBody.todo
        const createdTodoId = createTodoResponseBody.id[0]
        //По фильтру получаю созданную задачу и сравниваю её с отправленным запросом на создание задачи
        let todoResponse = await apiClient.get(`todos?id=${createdTodoId}`);
        expect(todoResponse.status()).toBe(200)
    })

    test('32 POST /todos JSON', {tag: '@post'},async () =>{
        const payload = createValidTodo()
        const response = await apiClient.postWithCustomAcceptAndContentType(`todos`, payload, 'application/json', 'application/json');
        const createTodoResponseBody = await response.json();
        const createdTodoId = createTodoResponseBody.id
        expect(response.status()).toBe(201);
        //Копия createTodoResponseBody, в которой удален ключ id.
        // Добавил отдельной переменной, т.к. в следующих экспектах проверяю по полному сравнению двух объектов
        let createdTodo = {...createTodoResponseBody}
        delete createdTodo.id
        expect(payload).toEqual(createdTodo)
        //По фильтру получаю созданную задачу и сравниваю её с отправленным запросом на создание задачи
        let todoResponse = await apiClient.get(`todos?id=${createdTodoId}`);
        expect(todoResponse.status()).toBe(200)
        let todosResponseBody = await todoResponse.json();
        todosResponseBody = todosResponseBody.todos[0]
        expect(createTodoResponseBody).toEqual(todosResponseBody)
    })

    test('33 POST /todos (415)', {tag: '@post'},async () =>{
        const payload = createXmlTodo()
        const response = await apiClient.postWithCustomAcceptAndContentType(`todos`, payload, '*/*', 'kaban4ikom/metnis');
        expect(response.status()).toBe(415);
    })

    test('34 GET /challenger/guid (existing X-CHALLENGER)', {tag: '@get'},async ({}) =>{
        const challengesListResponse = await apiClient.get(`challenger/${apiClient.token}`)
        expect(challengesListResponse.status()).toBe(200)
        const challengerListResponseBody = await challengesListResponse.json()
        expect(challengerListResponseBody).toHaveProperty('challengeStatus')
    })

    test('35 PUT /challenger/guid RESTORE', {tag: '@put'},async ({playwright}) =>{
        const challengeStatus = await getClientProgress(apiClient)
        //перезаписываю прогресс пользователя
        const requestBody = restoreProgressBody(challengeStatus, apiClient.token)
        const restoreProgressResponse = await apiClient.put(`challenger/${apiClient.token}`, requestBody)
        expect(restoreProgressResponse.status()).toBe(200)
        //Получаю список челленджей второго юзера
        let secondClientChallengeStatus = await getClientProgress(apiClient)
        secondClientChallengeStatus[`PUT_RESTORABLE_CHALLENGER_PROGRESS_STATUS`] = false
        expect(challengeStatus).toEqual(secondClientChallengeStatus)


    })

    test('36 PUT /challenger/guid CREATE', {tag: '@put'},async ({}) =>{
        //Получить прогресс клиента
        const challengeStatus = await getClientProgress(apiClient)
        //Генерируем guid нового пользователя
        const createdClientGuid = faker.string.uuid()
        console.log(`Uuid second client: ${createdClientGuid}`)
        //Тело запроса для добавления нового пользователя
        const requestBody = restoreProgressBody(challengeStatus, createdClientGuid)
        //Запрос на создание нового пользователя с прогрессом apiClient-a
        const createClientResponse = await apiClient.put(`challenger/${createdClientGuid}`, requestBody)
        expect(createClientResponse.status()).toBe(201)
    })

    test('37 GET /challenger/database/guid (200)', {tag: '@get'},async ({}) =>{
        //Получить список задач (запрос 03)
        const todosList = await getTodosList(apiClient)
        //Получаю ответ на запрос и вытаскиваю массив задач
        const databaseResponse = await apiClient.get(`challenger/database/${apiClient.token}`)
        expect(databaseResponse.status()).toBe(200)
        const databaseResponseBody = await databaseResponse.json()
        const responseTodosList = databaseResponseBody.todos
        expect(todosList.length).toBe(responseTodosList.length)
    })

    test('38 PUT /challenger/database/guid (Update)', {tag: '@put'},async ({}) =>{
        //Получить список задач (запрос 03)
        const requestBody = await getTodosListToRestore(apiClient)
        //Получаю ответ на запрос и вытаскиваю массив задач
        const databaseRestore = await apiClient.put(`challenger/database/${apiClient.token}`, requestBody)
        expect(databaseRestore.status()).toBe(204)
    })

    test('39 POST /todos XML to JSON', {tag: '@post'},async () =>{
        const payload = createXmlTodo()
        const response = await apiClient.postWithCustomAcceptAndContentType(`todos`, payload, 'application/json', 'application/xml');
        expect(response.status()).toBe(201);
        const responseHeaders = await response.headers();
        expect(responseHeaders['content-type']).toContain('application/json');
    })

    test('40 POST /todos JSON to XML', {tag: '@post'},async () => {
        //Добавил удаление рандомной задачи из-за ошибки
        // ERROR: Cannot add instance, maximum limit of 20 reached
        const randomTodo = await getRandomTodoObject(apiClient)
        const randomTodoId = randomTodo.id
        const deleteTodoResponse = await apiClient.delete(`todos/${randomTodoId}`);

        const payload = createValidTodo()
        const response = await apiClient.postWithCustomAcceptAndContentType(`todos`, payload, 'application/xml', 'application/json');
        expect(response.status()).toBe(201);
        const responseHeaders = await response.headers();
        expect(await responseHeaders['content-type']).toContain('application/xml');
    })
})