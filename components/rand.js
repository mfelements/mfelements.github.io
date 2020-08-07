export default function rand(d){
    const res = Math.random().toString(36).substring(2, 15);
    return d ? res + rand(d - 1) : res
}
