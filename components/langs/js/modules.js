// list of predefined modules

module._precompiled = {
	'bitcoinjs-lib': 'https://cdn.jsdelivr.net/gh/mfelements/bitcoinjs-lib@v4.0.3-2/dist/index.js',
	'bitcoinjs-message': 'https://cdn.jsdelivr.net/gh/mfelements/bitcoinjs-message@v2.1.3-1/dist/index.js',
	'markdown-it': 'https://cdn.jsdelivr.net/npm/markdown-it@11.0.0/dist/markdown-it.min.js',
	logger: 'https://cdn.jsdelivr.net/gh/mfelements/logger@0.0.4/index.min.js',
};

module._preconfigured = {
	'electrumx-api': '',
	'wallet-api': 'https://cdn.jsdelivr.net/gh/mfelements/client-api@c1d46f2/node.min.js',
	'logger/decorated': 'https://cdn.jsdelivr.net/gh/mfelements/logger@0.0.4/decorated.min.js',
	bit64: 'https://cdn.jsdelivr.net/gh/mfelements/bit64@v0.0.1/index.min.js',
	hostname: 'https://cdn.jsdelivr.net/gh/mfelements/hostname@v0.0.1/index.min.js',
	fetch: new URL('../../components/fetch.js', location.href).href,
	stream: new URL('../../components/stream.js', location.href).href,
	'user-media/canvas-wrapper': 'https://cdn.jsdelivr.net/gh/mfelements/UserMedia@v0.0.3/canvas-wrapped.min.js',
};

module._predefined = (() => {
	function rand(d){
		const res = Math.random().toString(36).substring(2, 15);
		return d ? res + rand(d - 1) : res
	}

	function generateActionStorageId(storage = module.actionStorage){
		const id = rand();
		if(id in storage) return generateActionStorageId();
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

	const locationModule = mainThreadAction('getLocation').then(v => new URL(v));

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
			const serviceLink = (await locationModule).pathname.slice(1);
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
		userMedia: 'https://cdn.jsdelivr.net/gh/mfelements/UserMedia@v0.0.5/index.min.js',
		nimiqQrScanner: 'https://cdn.jsdelivr.net/gh/nimiq/qr-scanner@e8a77de/qr-scanner.min.js',
	};

	const hasInstance = Object[Symbol.hasInstance];

	class _internal{
		constructor(){
			const Class = Object.getPrototypeOf(this).constructor;
			if([ ReadableStream, WritableStream, DuplexStream ].includes(Class)) throw new TypeError(`Cannot construct ${Class.name} directly`)
		}
	}

	class ReadableStream extends _internal{
		async *[Symbol.asyncIterator](){}
		async stop(){}
		catch(){}
		static [Symbol.hasInstance](instance){
			return hasInstance.call(ReadableStream, instance) || instance instanceof DuplexStream
		}
	}

	class WritableStream extends _internal{
		async next(){}
		async throw(){}
		async stop(){}
	}

	class DuplexStream extends WritableStream{
		async *[Symbol.asyncIterator](){}
		catch(){}
	}

	function registerCallback(callback){
		const id = generateActionStorageId(module.streamStorage);
		module.streamStorage[id] = { next: callback };
		return id
	}

	function getLocation(){
		return locationModule
	}

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
		},
		'stream-definitions': __esModule({
			ReadableStream,
			WritableStream,
			DuplexStream,
		}),
		get 'nimiq-qr-scanner'(){
			return (async () => {
				const moduleId = await mainThreadAction('nativeImport', moduleRoot.nimiqQrScanner);
				const emptyVal = Symbol();
				return class QrScanner{
					static hasCamera(){
						return mainThreadAction('moduleExec', moduleId, 'return module.default.hasCamera()')
					}
					static scanImage(imageOrFileOrUrl, scanRegion = emptyVal, qrEngine = emptyVal, canvas = emptyVal, fixedCanvasSize = emptyVal, alsoTryWithoutScanRegion = emptyVal){
						if(imageOrFileOrUrl instanceof Blob) imageOrFileOrUrl = URL.createObjectURL(imageOrFileOrUrl);
						else if(imageOrFileOrUrl instanceof Uint8ClampedArray || imageOrFileOrUrl instanceof Uint8Array) imageOrFileOrUrl = Array.from(imageOrFileOrUrl);
						const args = ['imageOrFileOrUrl'];
						[ scanRegion, qrEngine, canvas, fixedCanvasSize, alsoTryWithoutScanRegion ].forEach(val => {
							if(val !== emptyVal) args.push(JSON.stringify(val))
						});
						return mainThreadAction('moduleExec', moduleId, `
							let imageOrFileOrUrl = ${JSON.stringify(imageOrFileOrUrl)};
							if(imageOrFileOrUrl instanceof Array) imageOrFileOrUrl = Uint8ClampedArray.from(imageOrFileOrUrl);
							return module.default.scanImage(${JSON.stringify(args).slice(1, -1)})
						`)
					}
					static async createQrEngine(){
						throw new EvalError('Cannot call createQrEngine from another thread')
					}
					constructor(video, onDecode = emptyVal, canvasSizeOrOnDecodeError = emptyVal, canvasSizeOrCalculateScanRegion = emptyVal, preferredFacingMode = emptyVal){
						this._flashOn = false;
						this._videoId = '_nimiq_qr_video_' + rand();
						this._callbacks = [];
						const constructorArgs = ['videoElement'];
						[onDecode, canvasSizeOrOnDecodeError, canvasSizeOrCalculateScanRegion].forEach(callback => {
							if(callback !== emptyVal){
								const id = registerCallback(callback);
								this._callbacks.push(id);
								constructorArgs.push(`getCallback(${JSON.stringify(id)})`)
							}
						});
						if(preferredFacingMode !== emptyVal) constructorArgs.push(JSON.stringify(preferredFacingMode));
						this._init = mainThreadAction('moduleExec', moduleId, `
							const videoElement = document.createElement('video');
							videoElement.id = '${this._videoId}';
							videoElement.classList.add('camera-video', 'fullscreen');
							videoElement.muted = true;
							document.body.appendChild(videoElement);
							moduleStorage.${this._videoId} = new module.default(${constructorArgs.join(', ')});
						`);
					}
					async _callMethod(name, ...args){
						await this._init;
						return mainThreadAction('moduleExec', moduleId, `return moduleStorage.${this._videoId}.${name}(${JSON.stringify(args).slice(1, -1)})`)
					}
					_setFlash(state){
						return this._callMethod('_setFlash', state)
					}
					hasFlash(){
						return this._callMethod('hasFlash')
					}
					isFlashOn(){
						return this._flashOn;
					}
					toggleFlash(){
						return this._setFlash(!this._flashOn)
					}
					turnFlashOff(){
						return this._setFlash(false)
					}
					turnFlashOn(){
						return this._setFlash(true)
					}
					destroy(){
						this._callMethod('destroy');
						mainThreadAction('moduleExec', moduleId, `const e = '${this._videoId}'; e.parentElement.removeChild(e)`);
						this._callbacks.forEach(id => mainThreadAction('unregisterCallback', id))
					}
					start(){
						return this._callMethod('start')
					}
					stop(){
						this._callMethod('stop')
					}
					pause(){
						this._callMethod('pause')
					}
					setGrayscaleWeights(...args){
						this._callMethod('setGrayscaleWeights', ...args)
					}
					setInversionMode(...args){
						this._callMethod('setInversionMode', ...args)
					}
				}
			})()
		},
		service: __esModule({
			getLocation,
			async getArgs(){
				const text = (await locationModule).search.slice(1);
				const res = {};
				for(const arg of text.split('&')){
					const splitted = arg.split('=');
					res[decodeURIComponent(splitted.shift())] = decodeURIComponent(splitted.join('='))
				}
				return res
			}
		}),
	}
})();
