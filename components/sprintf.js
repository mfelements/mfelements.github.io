const types = {
    string: '%s',
    number: '%d',
}

export default (text, ...replacements) => {
    let _text = text;
    for(const replacement of replacements){
        _text = _text.replace(types[typeof replacement], replacement)
    }
    return _text
}
