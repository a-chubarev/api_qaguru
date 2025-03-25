import {faker} from "@faker-js/faker"


function createTodoPayload(title, doneStatus, description){
    return {
        title: title,
        doneStatus: doneStatus,
        description: description
    }
}

function createInvalidTodoPayload(title){
    return {
        title: title,
        priority: title
    }
}

function updateTitlePayload(title){
    return {
        title: title
    }
}

function updateDescriptionPayload(description){
    return {
        description: description
    }
}

function updateTodoPayload(id, title, doneStatus, description){
    return {
        id: id,
        title: title,
        doneStatus: doneStatus,
        description: description
    }
}


export function createValidTodo(){
    let title = faker.lorem.word()
    let doneStatus = true
    let description = faker.lorem.sentence({min: 0, max: 8})

    return createTodoPayload(title, doneStatus, description)
}

export function createTodoWithInvalidDoneStatus(){
    let title = faker.lorem.word()
    let doneStatus = faker.lorem.word()
    let description = faker.lorem.sentence({min: 0, max: 8})

    return createTodoPayload(title, doneStatus, description)
}

export function createTodoWithLongTitle(){
    let title = faker.lorem.sentence({min: 50, max :9999}).slice(0,51)
    let doneStatus = faker.datatype.boolean()
    let description = faker.lorem.sentence({min: 0, max: 8})

    return createTodoPayload(title, doneStatus, description)
}

export function createTodoWithLongDescription(){
    let title = faker.lorem.word()
    let doneStatus = faker.datatype.boolean()
    let description = faker.lorem.sentence({min: 200, max :9999}).slice(0,201)

    return createTodoPayload(title, doneStatus, description)
}

export function createTodoWithMaxDescriptionMaxTitle(){
    let title = faker.lorem.sentence({min: 50, max :9999}).slice(0,50)
    let doneStatus = faker.datatype.boolean()
    let description = faker.lorem.sentence({min: 200, max :9999}).slice(0,200)

    return createTodoPayload(title, doneStatus, description)
}

export function createTodoWithLongContentLength(){
    let title = faker.lorem.sentence({min: 50, max :9999}).slice(0,50)
    let doneStatus = faker.datatype.boolean()
    let description = faker.lorem.sentence({min: 5000, max :9999}).slice(0,5001)

    return createTodoPayload(title, doneStatus, description)
}

export function createTodoWithInvalidKey(){
    let title = faker.lorem.word()
    let doneStatus = faker.datatype.boolean()
    let description = faker.lorem.sentence({min: 0, max: 8})

    return createInvalidTodoPayload(title, doneStatus, description)
}

export function updateTitle(){
    let title = faker.lorem.word()

    return updateTitlePayload(title)
}

export function updateDescription(){
    let description = faker.lorem.sentence({min: 1, max: 8})

    return updateDescriptionPayload(description)
}

export function fullUpdateTodo(id){
    let title = faker.lorem.word()
    let doneStatus = faker.datatype.boolean()
    let description = faker.lorem.sentence({min: 1, max: 8})

    return updateTodoPayload(id, title, doneStatus, description)
}

export function createXmlTodo(){
    const title = faker.lorem.word()
    const doneStatus = faker.datatype.boolean()
    return `<todo><doneStatus>${doneStatus}</doneStatus><title>${title}</title></todo>`
}

export function restoreProgressBody(challengeStatus, token){
    return {
        xChallenger: token,
        secretNote: '',
        challengeStatus: challengeStatus
    }
}