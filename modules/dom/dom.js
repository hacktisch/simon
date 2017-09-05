
Element.prototype.rerender = function (mutate) {
    let p = {};
    if (mutate) {
        p.detail = mutate;
    }
    this.dispatchEvent(new CustomEvent('rerender', p))
};

SIMON.Dom = class {

    decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    propagate(dom, templater, populator, callback, p) {
        let t = this;
        p = p || {};
        $('slot,template', dom).each(function () {
            let
                    c = this,
                    a = c.attributes,
                    h = c.innerHTML,
                    il = c.nodeName == 'TEMPLATE';
            templater.load(c.getAttribute('tpl'), il ? t.decodeHtml(h) : 0).then(function (fn) {
                if (!a.cache) {
                    let
                            prop = function (o, pass) {
                                t.propagate(o, templater, populator, callback, pass)
                            },
                            s = document.createElement('SECTION');
                    s.id = c.id;
                    s.className = c.className;
                    c.insertAdjacentElement('afterend', s);

                    s.bind('rerender', function (e) {
                        let tr = a.transition;
                        (tr ? window[a.transition.value] : render).apply(s, [e.detail ? e.detail(clone(pass)) : pass, tr ? {render: render, fn: fn, callback: callback, prop: prop} : 1]);
                    });
                    let
                            pass = clone(p),
                            render = function (pass, manual) {
                                this.innerHTML = fn(pass);
                                callback.apply(this);
                                if (manual || !a.noprop) {
                                    prop(this, pass);
                                }
                            }, r = c.getAttribute('require');
                    if (a.pass) {
                        assign(pass, JSON.parse(a.pass.value.replace(/#/g, '"')));
                    }
                    if (!il && h) {
                        assign(pass, JSON.parse(h));
                    }

                    if (r) {
                        //todo compound require (heeft compound promises nodig
                        populator.load(r).then(function () {
                            pass[r] = this.response;
                            render.apply(s, [pass]);
                        });
                    } else {
                        render.apply(s, [pass]);
                    }
                }
                c.remove();
            }, function () {
                c.outerHTML = ''
            });
        });
    }
};