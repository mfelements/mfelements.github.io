const MFC = new class MFC{};

MFC.blockchainAPI = (() => {
    const nodes = [
        'http://127.0.0.1/',
    ],
        nodeRefreshInterval = 10000,
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
        for(const node of shuffleArray(nodes)) res.push(sendRequest(node, rand(2), 'getinfo').then(r => {
            if(!r || !r.result) return null;
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
        console.log(res);
        return res[0].node
    }

    async function refreshCurrentNode(){
        currentNode = await selectNode()
    }

    async function sendRequest(node, id, method, params = []){
        try{
            return await fetch(node, {
                method: 'POST',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method,
                    params,
                    id,
                })
            }).then(r => r.json())
        } catch(e){
            return null
        }
    }

    refreshCurrentNode() && setInterval(refreshCurrentNode, nodeRefreshInterval);

    return new Proxy(Object.create(null), {
        get(_, method){
            if(!_[method]) Object.assign(_, {
                async [method](...params){
                    const id = rand(12);
                    const data = await sendRequest(currentNode, id, method, params);
                    if(!data){
                        await refreshCurrentNode();
                        return _[method](...params)
                    }
                    if(data.error) throw new Error(data.error);
                    if(data.id !== id) throw new Error('System error: returned info does not match requested one');
                    return data.result
                }
            });
            return _[method]
        }
    })
})();
