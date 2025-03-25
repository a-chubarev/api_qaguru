import {createValidTodo} from "./payloads";
import xml2js from "xml2js";

/**
 *
 * @param apiClient
 * @returns объект с информацией о созданной задаче
 */
export async function createNewTodo(apiClient){
    const payload = createValidTodo()
    const response = await apiClient.post(`todos`, payload);
    return await response.json()
}

export async function parseStringToJson(text) {
    try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(text);
        return result;
    } catch (err) {
        console.error('Error parsing XML:', err);
        throw err; // Передаем ошибку дальше
    }
}

export function filterChecker(responseBody, param){
    let errors = []
    let responseTodosCount = 0
    for (const obj of responseBody.todos){
        responseTodosCount += 1
        if (`${obj.doneStatus}` !== param){
            errors.push(`Задача ${obj.id}. doneStatus: ${obj.doneStatus}`)
        }
    }
    return errors
}

/**
 *
 * @param apiClient
 * @returns количество задач
 */
export async function getTodosLength(apiClient){
    const todosListAfterPost = await apiClient.get(`todos`);
    const todosAfterPostResponseBody = await todosListAfterPost.json();
    return todosAfterPostResponseBody.todos.length
}

export async function getRandomTodoObject(apiClient){
    const response = await apiClient.get('todos');
    const responseBody = await response.json();
    const todosArray = responseBody.todos;
    const todoObjectLength = todosArray.length
    return todosArray[(Math.floor(Math.random() * todoObjectLength))]
}

export async function getClientProgress(apiClient){
    const challengesListResponse = await apiClient.get(`challenger/${apiClient.token}`)
    const challengerListResponseBody = await challengesListResponse.json()
    return challengerListResponseBody.challengeStatus
}

export async function getTodosList(apiClient){
    const response = await apiClient.get('todos');
    const responseBody = await response.json();
    const todosArray = responseBody.todos
    return todosArray.map(({doneStatus, description, ...rest}) => rest);
}

export async function getTodosListToRestore(apiClient){
    const databaseResponse = await apiClient.get(`challenger/database/${apiClient.token}`)
    return await databaseResponse.json()
}