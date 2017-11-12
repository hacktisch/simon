SIMON.Request = class extends SIMON.Object {

    get defaults() {
        return {
            base: SIMON.s.api_url,
            endpoint: '',
            method: 'POST'
        };
    }
    send(d) {
        var t = this;
        t.pr = new SIMON.Promise(function (y, n) {
            let r = new XMLHttpRequest();
            r.open(t.method, t.base + t.endpoint);
            if (t.auth) {
                r.setRequestHeader('Authorization', t.auth);
            }
            r.onreadystatechange = function () {
                if (r.readyState === 4) {
                    if (!t.aborted) {
                        t.response = r.responseText;
                        if (r.getResponseHeader('content-type') == 'application/json') {
                            t.response = JSON.parse(t.response);
                        }
                        if (r.status === 200) {
                            y();
                        } else {
                            n();
                        }
                    }
                }
            };
            if (d && !(d instanceof FormData)) {
                d = JSON.stringify(d);
            }
            r.send(d);
            t.r = r;
        });
        return this;
    }
    abort() {
        this.aborted = 1;
        this.r.abort();
    }

    then(y, n) {
        var t = this;
        this.pr.then(function () {
            y.apply(t);
        }, n ? function () {
            n.apply(t);
        } : false);
        return this;
    }

};