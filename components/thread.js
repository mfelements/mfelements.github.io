import { threads } from './paths.js'
import { registerAction, isIntercepted, callIntercepted, parseResult } from './api.js'
import requestAuth from './auth/index.js'
import logError from './errorMessage.js'
import errorLog from './errorMessage.js'
import Stream from './stream.js'

const actionStorage = Object.create(null);
const streams = Object.create(null);

function createActionId(storage = actionStorage){
    const id = Math.random().toString(36).substring(2, 15);
    if(!(id in storage)) return id;
    return createActionId()
}

function transformMediaStreamToBinary(worker, ms, streamId, type){
    const mediaRecorder = new MediaRecorder(ms, { mimeType: type });
    mediaRecorder.ondataavailable = e => {
        if(e.data && e.data.size > 0){
            worker.postMessage({
                stream: streamId,
                method: 'write',
                args: [ e.data ],
            });
        }
    };
    mediaRecorder.onerror = ({ error: { name, message } }) => {
        delete streams[streamId];
        worker.postMessage({
            stream: streamId,
            method: 'throwError',
            args: [ { name, message } ],
        })
    };
    mediaRecorder.onstop = () => {
        ms.getTracks().forEach(track => track.stop());
        delete streams[streamId];
        worker.postMessage({
            stream: streamId,
            method: 'end',
            args: [],
        })
    }
    streams[streamId].on('end', () => {
        mediaRecorder.stop()
    });
    mediaRecorder.start(20)
}

const imageDataFPS = 30;

function transformMediaStreamToImageData(worker, ms, streamId, video, videoWidth, videoHeight){
    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
        video.pause();
        ctx.drawImage(video, 0, 0);
        video.play();
        const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
        worker.postMessage({
            stream: streamId,
            method: 'write',
            args: [ imageData ],
        });
    }, 1000 / imageDataFPS);

    streams[streamId].on('end', () => {
        ms.getTracks().forEach(track => track.stop());
        delete streams[streamId];
        clearInterval(interval);
        worker.postMessage({
            stream: streamId,
            method: 'end',
            args: [],
        })
    });
}

function getVideoMetadata(video){
    return new Promise(r => {
        video.addEventListener('loadedmetadata', () => r({
            width: video.videoWidth,
            height: video.videoHeight,
        }))
    })
}

const actions = {
    registerAction({ name }){
        registerAction(this.scriptUrl, name, (...args) => new Promise((resolve, reject) => {
            const id = createActionId();
            actionStorage[id] = {
                resolve: val => {
                    delete actionStorage[id];
                    resolve(val)
                },
                reject: reason => {
                    delete actionStorage[id];
                    reject(reason)
                }
            };
            this.postMessage({ id, action: { name, args } })
        }))
    },
    apiCall({ name, args }){
        return this.api[name](...args)
    },
    requestAuth,
    getServiceLink(){
        return location.pathname.slice(1)
    },
    isIntercepted,
    callIntercepted,
    parseResult,
    errorLog,
    downloadFile(url, name){
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => a.remove(), 50)
    },
    createStream(){
        const id = createActionId(streams);
        streams[id] = new Stream;
        return id
    },
    async getCameraVideo(streamId, options){
        options = options || {};
        const videoOptions = options.frontCamera ? true : {
            facingMode: {
                exact: 'environment'
            }
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: videoOptions,
            audio: options.type !== 'imageData' && !!options.audio
        });
        const videoElement = document.createElement('video');
        videoElement.srcObject = mediaStream;
        videoElement.classList.add('camera-video', options.videoPosition);
        videoElement.muted = true;
        document.body.appendChild(videoElement);
        mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
            document.body.removeChild(videoElement)
        });
        const { width, height } = await getVideoMetadata(videoElement);
        videoElement.play();
        switch(options.type){
            case 'imageData':
                transformMediaStreamToImageData(this, mediaStream, streamId, videoElement, width, height);
                break;
            default:
                transformMediaStreamToBinary(this, mediaStream, streamId, options.type);
                break;
        }
        return { width, height }
    },
}

async function _processActions(worker, params){
    if('action' in params && params.action in actions){
        actions[params.action].call(worker, params);
    } else if('resultableAction' in params && params.resultableAction in actions){
        const { resultableAction: action, id, args } = params;
        try{
            worker.postMessage({
                actionResult: await actions[action].call(worker, ...args),
                id,
            })
        } catch(e){
            worker.postMessage({
                actionErrorName: e.name,
                actionError: e.message,
                id,
            })
        }
    } else if('stream' in params && params.stream in streams){
        const { stream, method, args } = params;
        try{
            streams[stream][method](...args)
        } catch(e){
            postMessage({
                method: 'throwError',
                args: [{ name: e.name, message: e.message }],
                stream,
            })
        }
    } else return false
}

export async function processActions(worker, params){
    return await _processActions(worker, params) !== false
}

export default (url, api, lang, langv) => {
    const worker = new Worker(threads + '/thread.js');
    return {
        loaded: new Promise((resolve, reject) => {
            worker.scriptUrl = url;
            worker.api = api;
            worker.onmessage = async ({ data: params }) => {
                if(params.id && !params.resultableAction){
                    const { data, error, errorName, id } = params;
                    if(id in actionStorage){
                        if(error) {
                            const e = new Error(error);
                            e.name = errorName;
                            actionStorage[id].reject(e)
                        }
                        else actionStorage[id].resolve(data)
                    }
                } else if(await processActions(worker, params));
                else if(params.error){
                    logError({ name: params.errorName, message: params.error })
                }
            };
            const id = createActionId();
            actionStorage[id] = { resolve, reject };
            worker.postMessage({
                requireScript: url,
                id,
                lang,
                langv,
            })
        }),
        destroy: () => worker.terminate(),
    }
}
