
import got from 'got'

const stringify = obj => JSON.stringify(obj, null, 2)
const parse = str => JSON.parse(str, (_, v) => {
    if (
        v !== null &&
        typeof v === 'object' &&
        'type' in v &&
        v.type === 'Buffer' &&
        'data' in v &&
        Array.isArray(v.data)) {
        return Buffer.from(v.data)
    }
    return v
})
class CloudDBAdapter {
    constructor(url, {
        serialize = stringify,
        deserialize = parse,
        fetchOptions = {}
    } = {}) {
        this.url = url
        this.serialize = serialize
        this.deserialize = deserialize
        this.fetchOptions = fetchOptions
    }

    async read() {
        try {
            let res = await got(this.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;q=0.9,text/plain'
                },
                ...this.fetchOptions
            })
            if (res.statusCode !== 200) throw res.statusMessage
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
            return this.deserialize(res.body)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        } catch (e) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
            return null
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        }
    }

    async write(obj) {
        let res = await got(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            ...this.fetchOptions,

            body: this.serialize(obj)
        })
        if (res.statusCode !== 200) throw res.statusMessage
        return res.body
    }
}

export default CloudDBAdapter

