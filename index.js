import './containers/head.js'
import './containers/body.js'

navigator.serviceWorker.register('./sw.js', {
    scope: './',
})
