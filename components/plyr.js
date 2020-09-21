import requireAsync from './cjs-loader.js'

const version = '3.6.2',
    url = `https://cdn.plyr.io/${version}/plyr`;

const css = document.createElement('link');
css.setAttribute('rel', 'stylesheet');
css.setAttribute('href', url + '.css');
document.head.appendChild(css);

export default requireAsync(url + '.js')
