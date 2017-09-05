SIMON.Request = class extends SIMON.Object {

    get defaults() {
        return {
            base: SIMON.s.api_url,
            endpoint: '',
            method: 'POST' //TODO vaker GET dan POST? omkeren?
        };
    }
    send() {
        var t = this;
        this.pr = new SIMON.Promise(function (y, n) {
            let r = new XMLHttpRequest();
            r.open(t.method, t.base + t.endpoint);
            r.onreadystatechange = function () {
                if (r.readyState === 4) {
                    t.response = r.responseText;
                    if(r.getResponseHeader('content-type')=='application/json'){
                        t.response=JSON.parse(t.response);
                    }
                    if (r.status === 200) {
                        y();
                    } else {
                        n();
                    }
                }
            };
            r.send();
        });
        return this;
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