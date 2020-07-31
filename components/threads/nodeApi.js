const MFC = Object.assign(new class MFC{}, (() => {
    const nodes = [
        'https://mfc-node-001.bassteam.ml:22825/',
    ],
        nodeRefreshInterval = 10000,
        requestTimeout = 2000,
        rand = module.exports;

    let currentNode = shuffleArray(nodes)[0];

    function shuffleArray(array){
        const newarr = Array.from(array);
        for (let i = newarr.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [newarr[i], newarr[j]] = [newarr[j], newarr[i]];
        }
        return newarr
    }

    function getKeyByVal(obj, val){
        for(const i in obj) if(obj[i] === val) return i
    }

    async function selectNode(){
        const startTime = Date.now();
        let res = [];
        const blockCounter = {};
        for(const node of shuffleArray(nodes)) res.push(sendRequest(node, rand(2), 'getinfo', requestTimeout).then(r => {
            if(!r || !r.result || !r.result.blocks) return null;
            const { blocks } = r.result;
            if(!blockCounter[blocks]) blockCounter[blocks] = 1;
            else blockCounter[blocks]++;
            r.requestTime = Date.now() - startTime;
            r.node = node;
            return r
        }));
        res = (await Promise.all(res)).filter(v => v);
        const blockCountConsensusCount = Math.max(...Object.values(blockCounter));
        const blockCountConsensus = +getKeyByVal(blockCounter, blockCountConsensusCount);
        res = res.filter(r => (r.result.blocks === blockCountConsensus));
        res = res.sort((a, b) => (a.requestTime - b.requestTime));
        return res[0].node
    }

    async function refreshCurrentNode(){
        try{ currentNode = await selectNode() } catch(e){}
    }

    async function sendRequest(node, id, method, timeout, params = []){
        const controller = new AbortController;
        const { signal } = controller;
        let pointer;
        if(timeout !== null) pointer = setTimeout(() => controller.abort(), timeout);
        try{
            return await fetch(node, {
                method: 'POST',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method,
                    params,
                    id,
                }),
                signal,
            }).then(r => {
                if(timeout !== null) clearTimeout(pointer);
                return r.json()
            })
        } catch(e){
            return null
        }
    }

    refreshCurrentNode() && setInterval(refreshCurrentNode, nodeRefreshInterval);

    class BlockchainError extends Error{
        constructor(error){
            super(`${error.code}\n${error.message}`)
        }
    }

    const blockchainAPI = new Proxy(Object.create(null), {
        get(_, method){
            if(!_[method]) Object.assign(_, {
                async [method](...params){
                    const id = rand(12);
                    const data = await sendRequest(currentNode, id, method, requestTimeout, params);
                    if(!data){
                        await refreshCurrentNode();
                        return _[method](...params)
                    }
                    if(data.error) throw new BlockchainError(data.error);
                    if(data.id !== id) throw new Error('System error: returned info does not match requested one');
                    return data.result
                }
            });
            return _[method]
        }
    });

    const isBin = /[\x00-\x08\x0E-\x1F]/;

    function parseNVSValue(value){
        if(/^[^=]*$/.test(value)){
            try{
                return JSON.parse(value)
            } catch(e){
                return value
            }
        }
        const res = {};
        const lines = value.split('\n');
        let line;
        while(line = lines.shift()){
            if(isBin.test(line)){
                const splitted = line.split('=');
                res[splitted.shift()] = splitted.join('=') + lines.join('\n');
                return res
            }
            if(line){
                const splitted = line.split('=');
                res[splitted.shift()] = splitted.join('=')
            }
        }
        return res
    }

    async function getNames(prefix){
        if(!prefix) throw new Error('There is no prefix specified');
        prefix += ':';
        const names = await blockchainAPI.name_scan(prefix, 999999999);
        const res = {};
        for(const { name, value } of names.filter(({ name }) => name.startsWith(prefix))){
            res[name.slice(prefix.length)] = parseNVSValue(value)
        }
        return res
    }

    return {
        blockchainAPI,
        getNames,
    }
})());
