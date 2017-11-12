SIMON.Cookie = class {

    constructor(key, v) {

        this.key = key;
        this.v = this.read(v);

        return this;
    }

    read(v) {
        this.cache = document.cookie;
        let
                c,
                i,
                k = this.key + "=",
                ca = this.cache.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(k) == 0) {
                v = c.substring(k.length, c.length);
                break;
            }
        }
        return v;
    }

    save(v, days) {
        typeof v != "undefined" && (this.v = v);
        document.cookie = this.key + "=" + this.v + (days ? "; expires=" + new Date(new Date().getTime() + (days * 86400000)).toGMTString() : "") + "; path=/";
        return this;
    }

    destroy() {
        return this.save("", -1)
    }

    get value() {
        if (document.cookie != this.cache) {
            this.v=this.read();
        }
        return this.v;
    }
    set value(v) {
        this.v = v;
    }

};