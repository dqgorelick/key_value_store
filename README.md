# Basic Key Value Store

Store key value pairs using `PUT` and access via `GET`.

built with:

- Node.js
- Sqlite3

testing:

- mocha / chai

Addressing multiple clients setting and getting the same key at the same time: sqlite is [transactional](https://www.sqlite.org/transactional.html) and changes to DB are made using an `UPSERT`-like method where inserts and replaces are performed in one query.

## Setup

run `npm install`, twiddle thumbs and wait.

## Usage

run `npm start` and wait for app to start.


##### GET

You can access data by navigating to `http://localhost:8080/keys/:key` in a browser.

Curl method:

```
curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://localhost:8080/keys/hello
```

##### PUT

I would recommend testing this with a program like Postman to format POST requests.

set headers to `application/json`

structure body as raw data as so, following [json api spec](http://jsonapi.org/):

```
{
    "data": {
        "key": "hello",
        "value": "world"
    }
}
```

Curl method:

```
curl -H "Content-Type: application/json" -X PUT -d '{"data":{"key":"hello","value":"world"}}' http://localhost:8080/keys
```

## Testing

Uses Mocha and Chai libraries. There are unit tests, blackbox tests, and end-to-end tests.

run `npm test` or `mocha` to run all tests.
