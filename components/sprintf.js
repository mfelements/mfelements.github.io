const types = {
    string: '%s',
    number: '%d',
}

export default (text, ...replacements) => {
    for(const replacement of replacements){
        text = text.replace(types[typeof replacement], replacement)
    }
    return text
}
