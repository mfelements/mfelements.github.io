# mfelements.github.io

**MFElements** is a Web UI Platform As A Service made for creating service applications.<br>
Originally created to provide to developers an easy access for [Metapolis Freeland](https://freeland.land/) infrastructure.

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

## Modules

You also can use client-side code to generate pages/components/etc similar to server-side generation.

### API

The design of the modules is inspired by CommonJS system, but is not its exact implementation. See notes below:

#### Notes:

* To handle actions you need to use <pre><code lang="typescript">registerAction(name: string, callback: (...args: any[]) => any | Promise&lt;any>): Promise&lt;void></code></pre>
* You can use **top-level await** in your modules
* Like CommonJS, MFElements Module System (MfeMS) does **not** evaluating same module file twice so changes made to exported object will be transferred to any other modules that using same exported object
* `requireAsync` is default module loader due to unusability of its sync version in Internet
* `AsyncFunction` constructor is available at the current module scope
* `AsyncFunction` and `Function` constructors creates functions at the current module scope
* No `window` variable. Modules are evaluated in separated workers/threads. To check if some global variable exists use <code lang="javascript">typeof variableName !== "undefined"</code> expression
* `__filename`, `__dirname`, `module`, `module.exports` and `exports` are defined and accessible like in CommonJS
* `module` object has no more props
* Separated workers are created for each module specified in the page template but not for its children
* You have no direct access to worker's methods and objects like
        `onmessage`,
        `onerror`,
        `onmessageerror`,
        `postMessage`,
        `terminate`,
        `importScripts` and
        `globalThis`.
* Global `API` object to access API controller from main thread. Try to not to spawn deadlocks with `registerAction` 😄

#### Global and local variables and functions accessible in modules:

##### `registerAction(name: string, callback: (...args: any[]) => any | Promise<any>)`

Function to register an API listener internally by a script (prevents requests to API server). You can define your own actions and use them in page template. You can also redefine "standard" methods like `getIndex()` — all you need is jast a

```javascript
function nextIndexHandler(){
    return {
        type: 'page',
        children: ['Hello from script']
    }
}

registerAction('getIndex', nextIndexHandler);
```

A-a-and... It's done) just try to load first page after visiting the second one

##### `requireAsync(modulePath: string): Promise<any>`

The main module loader.
Any module loaded can contain top-level await directive.
Supports relative paths.
Supported module types (by MIME):

```
application/javascript
```

\* WASM and JSON modules planned to be supported in the near future

**Best practices**:

If you need to load few modules best you can do is to load them parallel way:

```javascript
const [ { module1Method1, module1Method2 }, module2, module3 ] = await Promise.all([
    './module1.js',
    './module2.wasm',
    './module3.json'
].map(requireAsync));
```

Using `await`s for each `requireAsync` call is the same with using sync `require`: modules will be downloaded and evaluated only after previvious module done. This will increase waiting time and decrease chance to register action handler before user interacts with page. So next code will be evaluated but is **COMPLETELY WRONG**. Do not do something like this:

```javascript
const module1 = await requireAsync('module1.js');
const module2 = await requireAsync('module2.wasm');
const module3 = await requireAsync('module3.json');
```

##### `require(modulePath: string): any`

Sync version of requireAsync. Supports all the same like last one do. Is not recommended to use, works just as a fallback. Will be deprecated since 1.0.0 release and completely removed in 2.0.0

##### `__filename` and `__dirname`

Strings which contains full URL to the module and its directory respectively (`https://...` and so on). Is the same like in CommonJS

##### `module`, `module.exports` and `exports`

`module` object differs from CommonJS standard: it has no properties except `exports`

`module.exports` and `exports` is one object, like in CommonJS. It means you can export named variables directly to `exports`. But if you reassign `module.exports` to something else all the named variables will be lost. To achieve the best development practice, just do export only named variables or only default export from one module. To achieve the problem try something like this:

**Module**

```javascript
module.exports = { key: 'reassigned module.exports' };
exports.myVar = 'test export';
```

**Main**

```javascript
const module = await requireAsync('./module.js');
console.log(module); // { key: 'reassigned module.exports' }
```

##### `AsyncFunction` and `Function`

This constructors just creates functions in module scope. The new `AsyncFunction` constructor creates asynchronous function with support for `await` directives. How to use such constructors and advantages/disadvantages you may find [at MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function).

##### `API`

Is just a Proxy object, works the same as API controller in the main thread.

**Usage**:
```javascript
const result = await API.getIndexFallback();
```
