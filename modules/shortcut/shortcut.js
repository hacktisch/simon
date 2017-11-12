SIMON.Shortcut = class extends SIMON.Singleton {

    constructor(...args) {
        super(...args);
        let t = this;
        t.shortcuts = {};

        document.addEventListener("keydown", function (e) {
            if(!~["INPUT", "TEXTAREA"].indexOf(e.target.tagName)) {
                if (t.shortcuts[e.keyCode]) {
                    t.shortcuts[e.keyCode]();
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        });
    }

    bind(k, f) {
        this.shortcuts[k] = f;
    }

    unbind(k) {
        delete this.shortcuts[k];
    }

};