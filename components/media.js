const hlsMime = [
    'audio/mpegurl',
    'audio/x-mpegurl',
    'application/x-mpegurl',
    'application/vnd.apple.mpegURL',
];

export function isHls(type){
    return hlsMime.includes(type)
}
