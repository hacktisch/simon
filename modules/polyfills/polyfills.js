
/*
 if (!('registerElement' in document
 && 'import' in document.createElement('link')
 && 'content' in document.createElement('template'))) {
 var e = document.createElement('script');
 e.src = 'https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.1/webcomponents-lite.js';
 document.body.appendChild(e);
 }
 */

SIMON.Promise = class {

    /*
     * Very simple non-ES6 compliant Promise simulator
     */

    constructor(func) {
        let t = this;
        t.resolved = false;
        t.q = [[], []];
        func(function (ret) {
            t.resolved = 1;
            t.ret = ret;
            t.processq();
        }, function (ret) {
            t.resolved = 2;
            t.ret = ret;
            t.processq();
        })
    }

    then(...args) {
        if (this.resolved) {
            if (arguments.length >= this.resolved) {
                arguments[this.resolved - 1](this.ret);
            }
        } else {
            for (let i = 0; i < arguments.length; i++) {
                this.q[i].push(arguments[i]);
            }
        }
        return this;
    }

    processq() {
        var q = this.q[this.resolved - 1];
        for (let i in q) {
            q[i](this.ret);
        }
    }
};