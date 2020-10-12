export default class extends Error{
    constructor(message){
        super(message);
        this.name = Object.getPrototypeOf(this).constructor.name || 'Error';
    }
}
