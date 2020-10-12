import { errors, updateErrors } from '../containers/body.js'

export default _e => {
    let e = _e;
    if(e && e.message){
        if(e.name) e = `${e.name}: ${e.message}`;
        else e = e.message
    }
    const idx = errors.push(e) - 1;
    updateErrors();
    setTimeout(() => {
        delete errors[idx];
        updateErrors()
    }, 5000);
    return _e
}
