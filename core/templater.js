

SIMON.Templater = class extends SIMON.Object {
    get defaults() {
        return {
            cache: {},
        };
    }

    load(tpl, inlineTpl) {
        let t = this;
        if (!this.cache[tpl]) {
            this.cache[tpl] = new SIMON.Promise(function (y, n) {

                let renderFunc = function (html) {
                    y(new Function("obj",
                            //   "var p=[],print=function(){p.push.apply(p,arguments);};" +
                            "var p=[];" +
                            "with(obj){p.push('" +
                            html

                            .replace(/[\r\t\n]/g, " ")
                            .replace(/<template[^>]*>([\s\S]*?)<\/template>/g, function (m, a) {
                                let r = m.replace(a, '');
                                t.load(r.match(/tpl="([^"]*)"/)[1], a);//only cache inline tpl and remove from parent tpl
                                return r;
                            })
                            .split("'").join("&#39;")
                            .split("\t").join("'")

                            .replace(/{{(.+?)}}/g, "',(function(){try{return $1}catch(e){console.log(e);return ''}}()),'")
                            .split("{%").join("');")
                            .split("%}").join("p.push('")
                            + "');}return p.join('')"


                            ));
                };

                inlineTpl ? renderFunc(inlineTpl): new SIMON.Request({
                    base: SIMON.s.tpl_url,
                    method: 'GET',
                    endpoint : tpl + '.tpl',
                }).send().then(function () {
                    renderFunc(this.response)
                }, n);
            });
        }
        return this.cache[tpl];
    }
};