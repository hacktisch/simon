(function (gl) {
    gl.base = location.origin + location.pathname;
    gl.clone = function (obj) {
        if (!obj || true == obj) {
            return obj;
        }
        var objType = typeof (obj);
        if ("number" == objType || "string" == objType) {
            return obj;
        }
        var result;
        if (Array.isArray(obj)) {
            result = []
        } else if (obj.constructor) {
            if (obj instanceof SIMON.Singleton) {
                return obj;
            }
            result = new obj.constructor()
        } else {
            result = {}
        }
        if (obj instanceof Map) {
            for (var key of obj.keys()) {
                result.set(key, clone(obj.get(key)));
            }
        }
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = clone(obj[ key ]);
            }
        }
        return result;


    };
    gl.pref = (p, v) => {
        return typeof v == "undefined" ?
                ~~localStorage.getItem(p) :
                localStorage.setItem(p, ~~v);
    };
    gl.prefString = (p, v) => {
        return typeof v == "undefined" ?
                localStorage.getItem(p) :
                localStorage.setItem(p, v);
    };
    gl.passJson = function (s) {
        return JSON.stringify(s).replace(/"/g, '#');
    };

    gl.flt = gl.order = {};
    try {
        gl.flt = JSON.parse(prefString("flt") || "{}");
        gl.order = JSON.parse(prefString("order") || "{}");
    } catch (e) {
    }
    if (!gl.order.products) {
        gl.order.products = []
    }

    let
            d = document,
            w = window,
            mq1 = _('mq1').clientHeight,
            scrollCont = mq1 ? w : _('all'),
            templater = new SIMON.Templater({fetch: (tpl) => {
                    return new SIMON.Promise((y, n) => {
                        new SIMON.Request({
                            base: SIMON.s.tpl_url,
                            method: 'GET',
                            endpoint: tpl + '.tpl',
                        }).send().then(function () {
                            y(this.response)
                        }, n)
                    });
                }}),
            populator = new SIMON.Populator({
                load: function (resource) {

                    if (!this.cache[resource]) {
                        this.cache[resource] = new SIMON.Promise((y, n) => {
                            new SIMON.Request({
                                endpoint: 'resource/' + resource
                            }).send().then(proc).then(function () {
                                let r = this.response.res;
                                if (!r) {
                                    n();
                                }
                                switch (resource) {
                                    case "env":
                                        r.ontology = SIMON.Mapize(r.ontology);
                                        break;
                                    case "matrix":
                                        r.matrix = new Matrix(r.matrix, 5767);
                                        break;
                                }
                                y(r);
                            }, n)
                        });
                    }
                    return this.cache[resource];
                },
            }),
            dom = new SIMON.Dom(),
            run = {
                reload: function () {
                    this.parentNode.rerender();
                },
                header: function () {
                    let f = _('fly'), m = _('menu'), mt, move2 = function () {
                        clearTimeout(mt);
                        let
                                a = this.closest(".li1").firstElementChild,
                                l = m.getBoundingClientRect().left,
                                u = a.firstElementChild.getBoundingClientRect();
                        mt = setTimeout(function () {
                            if (f.hc('s')) {
                                f.css({
                                    width: u.width + "px",
                                    left: (u.left - l) + "px"
                                });
                            } else {
                                f.ac('b');
                                f.css({
                                    width: u.width + "px",
                                    left: (u.left - l) + "px"
                                });
                                new timeline().add(15, function () {
                                    f.rc('b').ac('s');
                                }).run();
                            }
                        }, 170);
                        return true;
                    };

                    function hLine() {
                        $('.active', m).rc('active');
                        let n = $1('[href="' + base + location.hash + '"]', m);
                        n && n.ac('active') && gl.got.fonts.then(function () {
                            move2.apply(n);
                        }) || f.rc('s');
                    }
                    gl.router.bind('change', hLine);
                    hLine.apply(gl.router);

                    gl.got.fonts.then(function () {
                        let a = $1('.active', m);
                        if (a) {
                            move2.apply(a);
                        }
                        $('.l1', m).bind('mouseenter', move2);
                        m.bind('mouseleave', function () {
                            clearTimeout(mt);
                            let a = $1('.active', m);
                            a && move2.apply(a) || f.rc('s');
                        });
                    });
                },

                imgLoad: function () {
                    let im = this, bg = im.style.backgroundImage.match(/url\(["|']?([^"']*)["|']?\)/)[1];
                    if (bg) {
                        new SIMON.Request({
                            base: bg,
                            method: 'GET'
                        }).send().then(function () {
                            im.ac('ready');
                            im.dispatchEvent(new CustomEvent('preloaded'));
                        });
                    }
                },

                reviews: function () {
                    let ct = this;
                    populator.load('reviews').then(function (rvs) {
                        let tm, tms = function ($t) {
                            clearTimeout(tm);
                            tm = setTimeout(function () {
                                if (d.body.contains($t)) {
                                    let p = $t.parentNode, ip = $1('input', p.nextElementSibling || p.parentNode);
                                    ip.checked = true;
                                    ip.trigger('change');
                                }
                            }, 10000);
                        };



                        tms($('input', ct).bind('change', function () {

                            let $t = this;

                            $1('section', ct).rerender(function (pass) {
                                pass.elms = $('.review', ct);
                                pass.v = parseInt($t.value);
                                return pass;
                            });
                            tms($t);

                        })[0]);




                    });


                },
                page: function () {
                    let q = this.parentNode, sw = function () {
                        q.rerender(function (p) {
                            p.page = gl.router.route;
                            for (let v in gl.router.args) {
                                p[v] = gl.router.args[v];
                            }
                            return p;
                        });
                    };
                    gl.router.getRoutes.then(function () {
                        sw();
                        gl.router.bind('change', sw);
                        if (localStorage.getItem("url") == location.href) {
                            gl.got.fonts.then(function () {
                                setTimeout(setY, 10, [localStorage.getItem("y")]);
                            });
                        }
                    });
                },
                preview: function () {
                    let t = this, a = t.attributes, k = a.key.value, h, s;
                    switch (a.type.value) {
                        case "img":
                            h = k;
                            s = h + "/" + a.thumb.value;
                            if (!a.inline) {
                                t.href = h;
                            }

                            break;
                        default:
                            h = a.embed;
                            s = k;
                    }
                    s && t.css({'background-image': 'url(' + s + ')'});

                },
                serp: function () {
                    let t = this;
                    setTimeout(function () {
                        (function k(c) {
                            if (c) {
                                c.ac('jump');
                                let n = c.nextElementSibling;
                                n && setTimeout(k, 130, n);
                            }
                        })(t.firstElementChild);
                    }, 30);
                },
                input: function () {
                    this.trigger("input");
                }
            };

    gl.getY = function () {
        return mq1 ? scrollCont.pageYOffset : scrollCont.scrollTop;
    };
    gl.setY = function (y) {
        if (mq1) {
            scrollCont.scrollTo(0, y);
        } else {
            scrollCont.scrollTop = y;
        }
    };

    function proc() {
        let res = this.response.res;
        if (res && res.do) {
            for (let m of res.do) {
                gl[m[0]](m[1])
            }
            delete res.do;
        }
    }
    class Load {
        run(ep, s) {
            let
                    req = new SIMON.Request({
                        endpoint: ep
                    }).send(s),
                    r = new SIMON.Promise(function (y, n) {
                        req.then(proc).then(function () {
                            let res = this.response.res;
                            if (res && res.e) {
                                //errorCode(res.e, res.extra);
                                n();
                            } else {
                                y(res);
                            }


                        }, n);

                    });
            r.abort = () => {
                req.abort();
            };
            return r;
        }
    }
    gl.load = new Load();




    gl.router = new SIMON.Router({
        getRoutes: populator.load('env').then(function (rt) {
            let r = rt.routes, m = new Map();
            for (let i = 0; i < r.length; i++) {
                let h = {
                    rt: r[i][1],
                    vars: []
                };
                h.rx = new RegExp('^' + h.rt.replace(/:[^\s/]+/g, function (a) {
                    h.vars.push(a.substring(1));
                    return '([\\w-]+)';
                }) + '$');
                m.set(r[i][0], h);
            }
            gl.router.routes = m;
            gl.router.alias = rt.alias;
            gl.router.aliasRev = {};
            for (var k in gl.router.alias) {
                gl.router.aliasRev[gl.router.alias[k]] = k;
            }
        }),
        build: function (r, rp, pm) {
            let a = this.aliasRev[r + '/' + (rp || []).map(function (a) {
                return a[1];
            }).join('/')];
            if (!a) {
                a = this.routes.get(r).rt;
                if (rp) {
                    for (let i = 0; i < rp.length; i++) {
                        a = a.replace(':' + rp[i][0], rp[i][1]);
                    }
                }
            }
            if (pm) {
                a += this.end + pm.join(this.sep);
            }
            return a;
        }

    });
    w.onbeforeunload = function (e) {
        localStorage.setItem("y", getY());
        localStorage.setItem("url", location.href);
    };

    d.getElementsByTagName('html')[0].lang = gl.router.lang[0];



    gl.got = {
        fonts: new FontFaceObserver('Poppins', {
            weight: 500
        }).load(),

    };


    /*
     for (var i = 65; i <= 90; i++) {//todo a - z nodig?
     document.registerElement(String.fromCharCode(i).toLowerCase() + '-', {
     prototype: Object.create(HTMLElement.prototype)
     });
     }*/


    dom.propagate(d.body, templater, populator, function () {
        $('[run]', this).each(function () {
            run[this.getAttribute('run')].apply(this);
        });
    });




    /*
     * mdQueue
     */

    gl.mdQ = [];
    gl.mdEnQ = function (f, a) {
        gl.mdQ.push([f, a]);
    };
    gl.mdOut = function (c) {
        if (c.parentNode.contains(this)) {
            if (this.hc('deselect')) {
                return true;
            }
        } else {
            _('no-flt').checked = true;
            return true;
        }
    };
    d.body.bind('mousedown', function (e) {//todo: inefficient??
        for (let i = mdQ.length - 1; i >= 0; i--) {
            if (gl[mdQ[i][0]].apply(e.target, mdQ[i][1])) {
                mdQ.splice(i, 1);
            }
        }
    });


    let hm = 0;
    function sc() {
        let s = gl.getY();
        if (s > 150) {
            if (!hm) {
                hm = 1;
                _('mm').ac('mhtmin');
            }
        } else if (s < 50) {
            if (hm) {
                hm = 0;
                _('mm').rc('mhtmin');
            }
        }
    }
    scrollCont.addEventListener('scroll', sc);





    gl.nr = function (n) {
        return n.toLocaleString(gl.router.lang, {minimumFractionDigits: 0, maximumFractionDigits: 1});
    };





    gl.transReviews = function (p) {
        var q = this;
        q.tms = q.tms || [[], []];
        for (var i = 0; i < q.tms[0].length; i++) {
            q.tms[0][i].stop();
            clearTimeout(q.tms[1][i]);
        }

        p.elms.each(function (i) {
            let t = this, rv = p.reviews.sel[p.v * p.elms.length + i], w = 130 * i;

            q.tms[0][i] = new timeline().add(w, function () {
                t.ac('tr');
                t.ac('rfd');
            }).add(w + 205, function () {
                if (rv) {
                    t.rc('tr');
                    $1('.r0', t).css({width: (100 - rv.rating + 2) + '%'});
                    $1('.r1', t).css({width: rv.rating + '%'});
                    $1('.rt-score', t).innerHTML = (rv.rating * 0.05).toFixed(1);

                    let f = function (to, tail) {
                        to += 3;
                        tail[0][0].innerHTML = rv[tail[0][1]].substring(0, to);

                        if (to < rv[tail[0][1]].length || (tail.shift() && (tail.length | (to = 0)))) {
                            q.tms[1][i] = setTimeout(f, 10, to, tail);
                        }
                    };
                    f(0, [
                        ['h5', 'author'],
                        ['a', 'product'],
                        ['blockquote', 'text']
                    ].map(function (a) {
                        a[0] = $1(a[0], t);
                        a[0].innerHTML = '&nbsp;';
                        return a;
                    }));
                    t.rc('rfd');


                }
            }).run();

        });

    };

    gl.transPage = function (p, a) {
        let t = this, same = t.prevp == p.page;
        $('#banner section').each(function () {
            this.rerender(function (pp) {
                pp = p;
                pp.same = same;
                pp.prevp = t.prevp;
                return pp;
            });
        });


        if (same) {
            let mst = _('main').offsetTop - _('mm').clientHeight - _('top').clientHeight;
            if (getY() > mst) {
                setY(mst);
            }
        } else {
            setY(0);
            if (t.prevp) {
                let m = _('main');
                m.ac('trans');
                clearTimeout(this.mt);
                this.mt = setTimeout(function () {
                    m.rc('trans');
                }, 2000);//todo zet juiste timeoutlengte
            }
        }

        switch (p.page) {
            case "c":
                gl.flt = {};
                for (let pm of router.params) {
                    (s => s.length == 2 && (gl.flt[s[0]] = s[1]))(pm.split("="))
                }



                console.log("yo", p);
                prefString("flt", JSON.stringify(gl.flt));



                let id = p.cat ? p.env.ontology.get("category").$.get(p.cat).id : false;



                if (same) {
                    let c = $1('#fltm [value="' + id + '"]');
                    if (c && !c.checked) {
                        c.checked = true;
                        c.trigger('change');
                    }
                    _('prologue').rerender();
                    _('breadcrumb').rerender();
                    _('serp').rerender();
                } else {
                    a.render.apply(this, [p, 1]);
                }

                break;
            case "p":
                load.run("get", {kind: "product", id: router.args.prod}).then((r) => {
                    p.product = r;
                    a.render.apply(this, [p, 1]);
                });
                break;
            default:
                a.render.apply(this, [p, 1]);
        }



        this.prevp = p.page;
        d.body.setAttribute('pg', p.page);
    };

    gl.transBanner = function (p, a) {
        let t = this, b = _('bnrcont'), x = b.hc('pop-c') ? (p.same ? 250 : 1400) : 50;
        if (t.tm) {
            t.tm.stop();
        }
        t.tm = new timeline().add(0, function () {
            b.rc('pop-c');
        }).add(60 + x, function () {
            t.innerHTML = a.fn(p);
        }).add(70 + x, function () {
            a.prop(t, p);
            b.ac('pop-c');
        }).run();

    };
    gl.transBannerImg = function (p, a) {
        let r = this.lastElementChild;
        this.insertAdjacentHTML('beforeend', a.fn(p));
        let l = this.lastElementChild;
        l.firstElementChild.bind('preloaded', function () {
            let d = p.prevp == 'home' ? 1000 : 5, t = this, tm = new timeline().add(0 + d, function () {
                t.ac('bms');
            });
            if (r) {
                tm.add(700 + d, function () {//todo goeie timing?
                    r.remove();
                });
            }
            tm.run();
        });
        a.callback.apply(l);
    };

    gl.setFlt = function (e) {
        let t = e.target;
        if (t.name.substring(0, 4) != "flt-") {
            let el = t.form.elements;
            gl.flt[t.name] = t.value || null;
            prefString("flt", JSON.stringify(gl.flt));
        }
    };

    gl.serp = function (e) {
        let t = e.target;
        if (t.name.substring(0, 4) != "flt-") {
            let el = t.form.elements, p = [];
            for (let k of ["occasion", "location", "budget", "rating"]) {
                if (el[k].value) {
                    p.push(k + "=" + el[k].value);
                }
            }
            router.goto(router.hash + router.build(router.route, [["cat", el.category.value || router.args.cat]], p));
        }
    };

    gl.transSerp = function (p, a) {


        populator.load('matrix').then(m => {


            let arr = new Array(m.width).fill(0);
            arr[0] = ~~gl.flt.budget;
            arr[m.locator[router.args.cat]] = 1;
            let
                    filter = new Vector(arr),
                    dist = m.matrix.dist(filter),
                    max = Math.max.apply(null, dist.vec),
                    min = Math.min.apply(null, dist.vec);
            dist.vec = dist.vec.map(max > 0 ? v => (max - v) / (max - min) : v => 1);
            p.sort = dist.sorted;
            p.serp = 1;

            this.firstElementChild.ac('o0');
            new timeline().add(400, () => a.render.apply(this, [p, 1])).run();

        });




        /*
         let t = this, list = load.run("list", {kind: "product", pm: [], filter: {category: [["=", router.args.cat]]}});
         t.firstElementChild.ac('o0');
         new timeline().add(400, function () {
         list.then(function (r) {
         p.rows = r.rows;
         p.match = 1;
         p.serp = 1;
         a.render.apply(t, [p, 1]);
         });
         }).run();*/
    };

    gl.transCards = function (p, a) {
        let t = this, ents = load.run("get", {id: p.ids, kind: "product"});
        new timeline().add(400, function () {
            ents.then(function (r) {
                p.rows = r;
                a.render.apply(t, [p, 1]);
            });
        }).run();
    };



    gl.got.fonts.then(function () {
        d.body.rc('wait-fonts');

        let ct = [null, null];
        gl.casc = function (o) {
            clearTimeout(ct[0]);
            clearTimeout(ct[1]);
            let f = function (o, m) {
                let n = $1('.anims', o.nextElementSibling);
                n.css({height: n.firstElementChild.clientHeight + 'px'});
                ct[m] = setTimeout(function () {
                    m ? n.removeAttribute('style') : n.css({height: 'auto'});
                }, m ? 10 : parseFloat(w.getComputedStyle(n).transitionDuration) * 1000);
                return o.value;
            };
            gl.flt.cat && (f($1('#fltm [value="' + gl.flt.cat + '"]'), 1));
            gl.flt.cat = o ? f(o, 0) : 0;
        };
    });




    gl.prvw = (o, d) => {
        let c = $1(".cur", o.parentNode.parentNode).rc("cur"), n = (d ? c.nextElementSibling || c.parentNode.firstElementChild : c.previousElementSibling || c.parentNode.lastElementChild);
        n.removeAttribute("sl");
        setTimeout(() => {
            n.setAttribute("sl", d);
            n.rc("dn").ac("cur").ac("sl1").style.zIndex = ~~c.style.zIndex + 1;
        }, 1);
    };

    gl.play = function (o) {
        let d = 'curf', a = o.attributes;
        if (a.inline) {
            if (a.embed) {
                o.parentNode.rerender(p => {
                    p.embed = a.embed.value;
                    return p
                })
            }
        } else if (o.id != d) {
            _(d) && (_(d).id = '');
            o.id = d;
            _('player').rerender(p => {
                p.key = a.embed ? a.embed.value : a.key.value;
                p.type = a.type.value;
                return p;
            });
        }
    };

    gl.roll = function (d) {
        let i = 'curRoll', a = _(i), b = d ? a.nextElementSibling : a.previousElementSibling;
        if (b) {
            _('reel').setAttribute('edge', b.previousElementSibling ? (b.nextElementSibling ? '' : 'r') : 'l');
            a.id = '';
            b.id = i;
        }
    };

    gl.money = a => a ? a.toLocaleString('nl', {style: 'currency', currency: 'EUR'}).replace(new RegExp('00$'), '-') : "?";



    gl.favTgl = (pid, set) => {


        /*
         let h = $1('hr', o), v = h.getAttribute('y') == '2', f = _('favs');
         h.setAttribute('y', v ? 3 : 2);
         f.innerHTML = parseInt(f.innerHTML) + (v ? 1 : -1)*/
        set = set || !~order.products.indexOf(pid);
        if (set) {
            order.products.push(pid);
            _('cart').rerender(function (p) {
                p.added = pid;
                return p;
            });
        } else {
            order.products = order.products.filter(a => a != pid);
            _('cart').rerender();
        }
        $(".fav-" + pid).tc("faved", set);
        $('.favs').rerender();
        prefString('order', JSON.stringify(order));
    };

    let loadedCss = {};
    function requireCss(href) {
        if (!loadedCss[href]) {
            loadedCss[href] = 1;
            let l = d.createElement("link");
            l.type = "text/css";
            l.rel = "stylesheet";
            l.href = href;
            d.head.appendChild(l);
        }
    }

    gl.popTgl = function () {
        if (this.checked) {


            requireCss("https://fonts.googleapis.com/css?family=Patrick+Hand+SC");


            _('orderFields').rerender();
            $1('#order-form [text]').focus();
            if (!order.form) {
                order.form = 1;
                _("request").ac("open");
                prefString('order', JSON.stringify(order));
            }
        }
    };

    gl.log = () => {
        console.log("")
    };

    /*
     * -----------------
     * DEBUG BELOW //TODO REMOVE
     * -----------------
     */

    populator.load('matrix').then(m => {
        gl.matrix = m;
    });

    return gl;
})(this);