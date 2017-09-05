SIMON.Router = class extends SIMON.Singleton {

    get defaults() {
        let
                r = (navigator.languages || [navigator.language]), //browser preferred languages
                l = ['nl', 'en']//website available languages
                .sort(function (a, b) {
                    return -1 / r.indexOf(a) + 1 / r.indexOf(b)
                });//sorted by preference
        return {
            className: 'router',
            route: '',
            hash: '#!/',
            lang: l
        };
    }

    constructor(...args) {
        super(...args);
        let t = this;

        t.setByUrl();
        window.onhashchange = function () {
            t.setByUrl();
        };

        document.body.addEventListener('click', function (e) {
            if (e.target.nodeName == 'A' && !e.ctrlKey && !e.target.target) {
                let c = e.target.getAttribute('c');
                if (c) {
                    e.preventDefault();
                    window[c](e.target);
                } else if (!e.target.hash && location.hostname == e.target.hostname) {
                    e.preventDefault();
                    t.goto(e.target.pathname);
                }

            }
        }, false);

        window.onbeforeunload = function (e) {
            localStorage.setItem("y", getY());
            localStorage.setItem("url", location.href);
        };

    }

    setByUrl() {
        let t = this;
        t.getRoutes.then(function () {
            let p = '', a = {};
            window.location.hash.substring(0, 3) == '#!/' && (p = window.location.hash.substring(3));
            let f = t.alias ? t.alias[p] : 0;
            if (f) {
                f = f.split('/');
                p = f.shift();
                let v = t.routes.get(p).vars;
                for (let i = 0; i < v.length; i++) {
                    a[v[i]] = f[i];
                }
            } else {
                for (let [rt, m] of t.routes) {
                    let ma = p.match(m.rx);
                    if (ma) {
                        p = rt;
                        for (let i = 0; i < m.vars.length; i++) {
                            a[m.vars[i]] = ma[i + 1];
                        }
                        break;
                    }
                }
            }
            t.args = a;
            t.route = p;
            t.trigger('change');
        });
        return t;
    }

    goto(to) {
        if (to != window.location.pathname + window.location.hash) {
            history.pushState({}, "", to);
            this.setByUrl();
        }
        return this;
    }

};