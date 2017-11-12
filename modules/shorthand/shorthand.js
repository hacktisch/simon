function $(s, d) {
    d = d || document.body;
    return d.querySelectorAll(s)
}
function $1(s, d) {
    d = d || document.body;
    return d.querySelector(s)
}
function _(s) {
    return document.getElementById(s);
}
function assign(o, d) {
    for (let k in d) {
        o[k] = d[k];
    }
    return o;
}

(function () {
    let el = {
        css: function (s) {
            assign(this.style, s);
            return this;
        },
        ac: function (c) {
            this.classList.add(c);
            return this;
        },
        rc: function (c) {
            this.classList.remove(c);
            return this;
        },
        tc:function(c,v){
            v?this.ac(c):this.rc(c);
            return this;
        },
        hc: function (c) {
            return this.classList.contains(c);
        },
        bind: function (e, f) {
            this.addEventListener(e, f);
            return this;
        },
        trigger: function (e) {
            this.dispatchEvent(new Event(e));
            return this;
        },
        each: function (...args) {
            arguments[0].apply(this, Array.prototype.slice.call(arguments, 1));
            return this;
        },
    };
    assign(Element.prototype, el);
    for (let f in el) {
        NodeList.prototype[f] = function (...args) {
            for (let i = 0; i < this.length; i++) {
                let pass = Array.prototype.slice.call(arguments, 0);
                pass.push(i);
                el[f].apply(this[i], pass);
            }
            return this;
        };
    }

  
})();
