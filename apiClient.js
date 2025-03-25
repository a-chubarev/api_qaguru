
export class ApiClient {
    constructor(baseUrl, apiRequestContext) {
        this.baseUrl = baseUrl;
        this.apiRequestContext = apiRequestContext;
        //this.token = null;
        this.token  = 'bee9d7d7-1634-48e0-8d38-7e35bf77e743'
    }

    async authenticate() {
        const response = await this.apiRequestContext.post(`${this.baseUrl}challenger`);
        if (response.status() !== 201) {
            throw new Error(`Клиент не создан. Код ответа ${response.status()}`);
        }
        const responseHeaders = response.headers();
        this.token = responseHeaders["x-challenger"];
        console.log("Токен получен:", this.token);
    }

    getHeaders() {
        if (!this.token) {
            throw new Error("Токен не получен");
        }
        return {
            "x-challenger": this.token
        };
    }

    getHeadersWithCustomAccept(acceptType){
        if (!this.token) {
            throw new Error("Токен не получен");
        }
        return {
            "x-challenger": this.token,
            "Accept": acceptType
        };
    }

    getHeadersWithCustomAcceptContentType(acceptType, contentType){
        if (!this.token) {
            throw new Error("Токен не получен");
        }
        return {
            "x-challenger": this.token,
            "Accept": acceptType,
            "Content-Type": contentType
        };
    }

    async get(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.get(url, { headers: this.getHeaders() });
    }

    async getWithCustomAccept(endpoint, acceptType) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.get(url, { headers: this.getHeadersWithCustomAccept(acceptType) });
    }

    async head(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.head(url, { headers: this.getHeaders() });
    }

    async post(endpoint, payload) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.post(url, {
            headers: this.getHeaders(),
            data: payload,
        });
    }

    async postWithCustomAcceptAndContentType(endpoint, payload, acceptType, contentType) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.post(url, {
            headers: this.getHeadersWithCustomAcceptContentType(acceptType, contentType),
            data: payload,
        });
    }

    async put(endpoint, payload) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.put(url, {
            headers: this.getHeaders(),
            data: payload,
        });
    }

    async delete(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.delete(url, { headers: this.getHeaders() });
    }

    async options(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;
        return await this.apiRequestContext.fetch(url, {method: "OPTIONS", headers: this.getHeaders() });
    }
}