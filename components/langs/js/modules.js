// list of predefined modules

module._precompiled = {
	'bitcoinjs-lib': 'https://cdn.jsdelivr.net/gh/mfelements/bitcoinjs-lib@v4.0.3-1/dist/index.js',
	'markdown-it': 'https://cdn.jsdelivr.net/npm/markdown-it@11.0.0/dist/markdown-it.min.js',
	logger: 'https://cdn.jsdelivr.net/gh/mfelements/logger@0.0.1/index.min.js',
};

module._preconfigured = {
	'logger/decorated': 'https://cdn.jsdelivr.net/gh/mfelements/logger@0.0.1/decorated.min.js',
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

	return {
		rand,
		'service-api': new Proxy(Object.create(null), {
			get(_, name){
				return (...args) => new Promise((resolve, reject) => {
					const id = generateActionStorageId();
					module.actionStorage[id] = { resolve, reject };
					postMessage({
						resultableAction: 'apiCall',
						args: [{ name, args }],
						id,
					});
				})
			}
		}),
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
	}
})();
