// list of predefined modules

module._precompiled = {
	'bitcoinjs-lib': 'https://cdn.jsdelivr.net/gh/mfelements/bitcoinjs-lib@v4.0.3-2/dist/index.js',
	'bitcoinjs-message': 'https://cdn.jsdelivr.net/gh/mfelements/bitcoinjs-message@v2.1.3-1/dist/index.js',
	'markdown-it': 'https://cdn.jsdelivr.net/npm/markdown-it@11.0.0/dist/markdown-it.min.js',
	logger: 'https://cdn.jsdelivr.net/gh/mfelements/logger@0.0.4/index.min.js',
};

module._preconfigured = {
	'electrumx-api': '',
	'wallet-api': '',
	'logger/decorated': 'https://cdn.jsdelivr.net/gh/mfelements/logger@0.0.4/decorated.min.js',
	bit64: 'https://cdn.jsdelivr.net/gh/mfelements/bit64@v0.0.1/index.min.js',
	hostname: 'https://cdn.jsdelivr.net/gh/mfelements/hostname@v0.0.1/index.min.js',
	fetch: new URL('../../components/fetch.js', location.href).href,
	stream: new URL('../../components/stream.js', location.href).href,
};

module._predefined = (() => {
	function rand(d){
		const res = Math.random().toString(36).substring(2, 15);
		return d ? res + rand(d - 1) : res
	}

	function generateActionStorageId(){
		const id = rand();
		if(id in module.actionStorage) return generateActionStorageId();
		return id
	}

	function mainThreadAction(method, ...args){
		return new Promise((resolve, reject) => {
			const id = generateActionStorageId();
			module.actionStorage[id] = { resolve, reject };
			postMessage({
				resultableAction: method,
				args,
				id,
			})
		})
	}

	function __esModule(obj){
		return Object.defineProperty(obj, '__esModule', { value: true })
	}

	function sleep(ms){
		return new Promise(r => setTimeout(r, ms))
	}

	async function importModule(name){
		await sleep();
		return requireAsync.call({}, name)
	}

	const logger = importModule('@mfelements/logger');

	/** @namespace */
	const ServiceAPI = {
		downloadModules(){
			ServiceAPI.modules = {
				hostname: importModule('@mfelements/hostname').then(v => v.default),
				fetch: importModule('@mfelements/fetch').then(v => v.default),
			};
			ServiceAPI.url = ServiceAPI.getApiUrl()
		},
		async getApiUrl(){
			if(!ServiceAPI.modules) ServiceAPI.downloadModules();
			const serviceLink = await mainThreadAction('getServiceLink');
			const Hostname = await ServiceAPI.modules.hostname;
			const url = new URL('https://' + decodeURIComponent(serviceLink));
			if(new Hostname(url.hostname).local) url.protocol = 'http';
			let { href } = url;
			if(!href.endsWith('/')) href += '/';
			return href
		},
		APICallOptions: class APICallOptions{
			constructor(opts){
				Object.assign(this, opts)
			}
		},
		mainInterface: logger.then(logger => ({
			proxy: new Proxy(Object.create((class API{
				constructor(){
					throw new TypeError('Cannot construct API object directly')
				}
			}).prototype), {
				get(_, p){
					return logger.default(console => logger.withName('API.' + p, async function(...data){
						const apiUrl = await ServiceAPI.url;
						const fetch = await ServiceAPI.modules.fetch;
						const callOpts = {
							silent: false,
						};
						if(this instanceof ServiceAPI.APICallOptions) Object.assign(callOpts, this);
						if(await mainThreadAction('isIntercepted', p)){
							console.info('Intercepted action');
							try{
								return mainThreadAction('callIntercepted', p, data)
							} catch(e){
								if(!callOpts.silent) mainThreadAction('errorLog', e);
								throw e
							}
						}
						const targetUrl = apiUrl + encodeURIComponent(p);
						const options = {
							method: data.length ? 'POST' : 'GET',
							mode: 'cors',
							cache: 'no-cache',
							redirect: 'follow',
						};
						if(data.length) options.body = JSON.stringify(data);
						return fetch(targetUrl, options)
							.then(async r => {
								try{
									return await r.json()
								} catch(e){
									throw new TypeError('response is not in JSON format')
								}
							})
							.catch(e => {
								e.message = `Cannot communicate with ${targetUrl}: ${e.message}`;
								throw e
							})
							.then(r => mainThreadAction('parseResult', r))
							.catch(e => {
								e.name = `API ${e.name}`;
								if(!callOpts.silent) mainThreadAction('errorLog', e);
								throw e
							})
					}))
				}
			})
		})),
	}

	const canvaskitCDNRoot = 'https://unpkg.com/canvaskit-wasm@0.18.1/bin/';

	const moduleCache = Object.create(null);

	const moduleRoot = {
		userMedia: 'https://cdn.jsdelivr.net/gh/mfelements/UserMedia@v0.0.1/index.min.js',
	};

	return {
		rand,
		get 'service-api'(){
			ServiceAPI.downloadModules();
			return ServiceAPI.mainInterface.then(({ proxy: v }) => ServiceAPI.url.then(url => __esModule({
				default: v,
				callWithOptions: (options, method, ...args) => v[method].apply(new ServiceAPI.APICallOptions(options), args),
				url,
			})))
		},
		'request-auth'(keys){
			return new Promise((resolve, reject) => {
				const id = generateActionStorageId();
				module.actionStorage[id] = { resolve, reject };
				postMessage({
					resultableAction: 'requestAuth',
					args: [ keys ],
					id
				});
			})
		},
		async 'download-file'(blob, name){
			const url = URL.createObjectURL(blob);
			mainThreadAction('downloadFile', url, name);
			await sleep(50);
			URL.revokeObjectURL(url)
		},
		get canvaskit(){
			if(!('canvaskit' in moduleCache)){
				const document = {
					createElement(){
						const e = {
							click(){
								mainThreadAction('downloadFile', e.href, e.download)
							},
							remove(){}
						}
						return e
					},
					body: {
						appendChild(){}
					}
				};
				function F(...args){
					return new Function('window', ...args).bind(self, self)
				}
				F.prototype = Object.create(Function);
				Object.defineProperty(F, Symbol.hasInstance, { value: i => i instanceof Function });
				moduleCache.canvaskit = requireAsync.call({ skipTransform: true, additionalScope: { Function: F, window: self, document } }, canvaskitCDNRoot + 'canvaskit.js')
					.then(init => init({ locateFile: f => canvaskitCDNRoot + f }))
					.then(v => __esModule({ default: v }));
			}
			return moduleCache.canvaskit
		},
		get 'user-media'(){
			if(!('userMedia' in moduleCache)) moduleCache.userMedia = requireAsync.call({
				additionalScope: {
					streamStorage: module.streamStorage,
					mainThreadAction,
					endStream(id){
						postMessage({
							stream: id,
							method: 'end',
							args: [],
						})
					},
				}
			}, moduleRoot.userMedia);
			return moduleCache.userMedia
		}
	}
})();
