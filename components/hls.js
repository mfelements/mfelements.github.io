import requireAsync from './cjs-loader.js'

const version = 'latest',
    url = `https://cdn.jsdelivr.net/npm/hls.js@${version}`;

export default requireAsync(url)
