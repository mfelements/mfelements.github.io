# mfelements.github.io

**MFElements** is a Web UI Framework As A Service made for creating applications in uniform style Metapolis Freeland (ex Virtual State of Freeland: [https://freeland.land/](https://freeland.land/)).

# How it works?

Client is requesting the method API getIndex(), with no parameters, witch returns an object of main page.

The structure of the main page:
```
{
  type: 'page'
  children: (Element | string)[]
  title: string
}
```

**Element** — all elements can be found by this link: https://github.com/mfelements/service-demo/blob/master/index.mjs

**string** — any text, will be represented as a text node.

**title** - not implemented yet. Could be passed.

# Usage

## Request

Client need to make a request to: server_name/method_name with mandatory http headers:
```
Content-Type: application/json
Origin: https://mfelements.github.io
```

If the request doesn't contain those headers it will be refused.

Request could be: **GET**, **POST** or **OPTIONS** (last one automatically made by browsers before POST for optimization).

On **OPTIONS** the response jest need to reply with 200 code.

On **POST** should read the body and parse JSON. It contains an array of arguments that must be passed to method.

On **GET** method will be processed without arguments.

## Response

The response should contain http headers:
```
Content-Type: application/json
Access-Control-Allow-Origin: https://mfelements.github.io
Access-Control-Allow-Headers: content-type
```

Response body - encoded object in JSON with just one field - **error** or **data**.

**error** should be returned only when exception occurs on backend side and represents a string with error description for user. Example:

`{"error":"User VPupkin does not exist"}`

data should be returned when the execution was success. It represents the massive of elements, lines or pages, that will be displayed as a result. Example:

`{"data":{"type":"page","children":["Some page text",{"type":"button","onClick":{"action":"getPage","args":["main"]},"text":"⬅️ Back"}]}}`
