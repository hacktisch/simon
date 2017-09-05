SIMON.Object = class {
    set(...args) {
        let    set = {};
        switch (typeof arguments[0]) {
            case 'object':
                set = arguments[0];
                break;
            case 'string':
                if (!arguments[1]) {
                    return this;
                }
                set[arguments[0]] = arguments[1];
                break;
            default:
                return this;
        }
        for (let k in set) {
            this[k] = set[k];
        }
        return this;
    }
    constructor(...args) {
        this.handlers = {};
        this.set(this.defaults);
        this.set.apply(this, arguments);
    }
    trigger(e) {
        if (this.handlers[e]) {
            for (var i in this.handlers[e]) {
                this.handlers[e][i].apply(this);
            }
        }
        return this;
    }
    bind(e, f) {
        this.handlers[e] ? this.handlers[e].push(f) : this.handlers[e] = [f];
        return this;
    }
    /* getName() {
     var funcNameRegex = /function (.{1,})\(/;
     var results = (funcNameRegex).exec((this).constructor.toString());
     return (results && results.length > 1) ? results[1] : "";
     }*/
};

SIMON.Singleton = class extends SIMON.Object {
    constructor(...args) {
        super(...args);
        if (!SIMON.instances) {
            SIMON.instances = {};
        }
        let c = this.className || '';
        if (SIMON.instances[c]) {
            throw new Error('E01');
        }
        SIMON.instances[c] = this;
    }
};