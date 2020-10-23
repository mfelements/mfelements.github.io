function normalizeHex(v){
    if(v.length === 3 || v.length === 4) return v.split('').map(v => v + v).join('');
    return v
}

const white = { r: 255, g: 255, b: 255, a: 1 },
    black = { r: 0, g: 0, b: 0, a: 1 };

export function toColor(v){
    if(v.startsWith('#')){
        v = normalizeHex(v.slice(1));
        if(/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v)){
            let [ r, g, b, a ] = v.match(/.{2}/g).map(v => parseInt(v, 16));
            return { r, g, b, a: a === undefined ? 1 : a }
        }
    }
    throw new TypeError(`Color ${JSON.stringify(v)} is not valid`)
}

function fixAlpha(a){
    a = a * 256;
    return a > 255 ? 255 : a
}

export function toString(v){
    const { r, g, b, a } = v;
    return '#' + [ r, g, b, fixAlpha(a) ].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

export function isDark({ r, g, b }){
    return (r + g + b) / 3 < 127.5
}

export function textColor(v){
    return isDark(v) ? white : black
}

function limited(v){
    for(const i in v) if(v[i] > 255) v[i] = 255;
    return v
}

export function normalizeColor({ r, g, b, a }){
    const coef = 127.5 - (r + g + b) / 3;
    return limited({
        r: r + coef,
        g: g + coef,
        b: b + coef,
        a,
    })
}

const step = 44;

export function darker({ r, g, b, a }){
    return limited({
        r: r - step,
        g: g - step,
        b: b - step,
        a,
    })
}

export function lighter({ r, g, b, a }){
    return limited({
        r: r + step,
        g: g + step,
        b: b + step,
        a,
    })
}

export function getThemeColor(){
    let val = '';
    for(const sheet of document.styleSheets){
        try{
            for(const rule of sheet.cssRules) if(rule.type === rule.STYLE_RULE && rule.selectorText === ':root'){
                const pval = rule.style.getPropertyValue('--theme-color');
                if(pval) val = `${pval}`;
            }
        } catch(e){}
    }
    return toColor(val.trim())
}

export function setThemeColor(v){
    const themeColor = isDark(v) ? v : normalizeColor(v),
        lightColor = toString(lighter(themeColor)),
        darkColor = toString(darker(themeColor)),
        darkThemeColor = isDark(v) ? normalizeColor(v) : v,
        darkThemeLightColor = toString(lighter(darkThemeColor)),
        darkThemeDarkColor = toString(darker(darkThemeColor));

    const style = document.createElement('style');
    style.innerHTML = `
    html{
        --theme-color: ${toString(themeColor)};
        --theme-light-color: ${lightColor};
        --theme-dark-color: ${darkColor};
    }
    html.dark-theme{
        --theme-color: ${toString(darkThemeColor)};
        --theme-light-color: ${darkThemeLightColor};
        --theme-dark-color: ${darkThemeDarkColor};
    }`;
    document.head.append(style)
}
