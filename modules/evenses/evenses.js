(function (gl) {
    gl.base = location.origin + location.pathname;

    gl.clone = function (a) {
        //TODO MEET EFFICIENTIE
        return JSON.parse(JSON.stringify(a));
    };
    gl.passJson = function (s) {
        return JSON.stringify(s).replace(/"/g, '#');
    };

    gl.flt = {};


    let
            d = document,
            w = window,
            mq1 = _('mq1').clientHeight,
            scrollCont = mq1 ? w : _('all'),
            templater = new SIMON.Templater(),
            populator = new SIMON.Populator(),
            dom = new SIMON.Dom(),
            run = {
                header: function () {
                    let f = _('fly'), m = _('menu'), mt, move2 = function () {
                        clearTimeout(mt);
                        let u = this.firstChild;
                        mt = setTimeout(function () {
                            if (f.hc('s')) {
                                f.css({
                                    width: u.clientWidth + "px",
                                    left: u.offsetLeft + "px"
                                });

                            } else {
                                f.ac('b');
                                f.css({
                                    width: u.clientWidth + "px",
                                    left: u.offsetLeft + "px"
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
                        $('a', m).bind('mouseenter', move2);
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
                    populator.load('reviews').then(function () {
                        let rvs = this.response, tm, tms = function ($t) {
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
                                pass.v = parseInt($t.value)
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
                        case "yt":
                            h = "//www.youtube.com/watch?v=" + k;
                            s = "//img.youtube.com/vi/" + k + "/" + (a.res ? a.res.value : "mqdefault") + ".jpg";
                            break;
                        case "vm":
                            h = "//vimeo.com/" + k;
                            new SIMON.Request(function () {

                            });
                            new SIMON.Request({
                                base: '//vimeo.com/api/v2/video/' + k + '.json',
                                method: 'GET'
                            }).send().then(function () {
                                t.css({'background-image': 'url(' + this.response[0].thumbnail_medium + ')'});
                            });
                            break;
                        default:
                            h = "img/act/" + k + ".jpg";
                            s = "img/act/" + k + ".jpg";
                    }
                    s && t.css({'background-image': 'url(' + s + ')'});
                    t.href = h;
                },
                serp: function () {
                    let t = this;
                    setTimeout(function () {
                        (function k(c) {
                            c.ac('jump');
                            let n=c.nextElementSibling;
                            n&&setTimeout(k, 130, n);
                        })(t.firstElementChild);
                    }, 30);

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
        ;
    };

    gl.router = new SIMON.Router({
        getRoutes: populator.load('env').then(function () {
            let r = this.response.routes, m = new Map();
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
            gl.router.alias = this.response.alias;
            gl.router.aliasRev = {};
            for (var k in gl.router.alias) {
                gl.router.aliasRev[gl.router.alias[k]] = k;
            }
        }),
        build: function (r, rp) {
            let a = this.aliasRev[r + '/' + rp.map(function (a) {
                return a[1];
            }).join('/')];
            if (!a) {
                a = this.routes.get(r).rt;
                for (let i = 0; i < rp.length; i++) {
                    a = a.replace(':' + rp[i][0], rp[i][1]);
                }
            }
            return a;
        }
    });

    d.getElementsByTagName('html')[0].lang = gl.router.lang[0];



    gl.got = {
        fonts: new SIMON.Promise(function (y) {
            /*
             * Testing if font has loaded. this can only be done by checking DOM changes.
             */
            let
                    f = 'Poppins',
                    tf = 'monospace',
                    ts = d.createElement('div'),
                    l = d.createElement('span'),
                    i = d.createElement('i');
            ts.style.cssText = 'position:absolute;left:-2000px;word-wrap:break-word;font-size:30px;overflow:hidden';
            l.style.cssText = 'font-family:' + tf + ';float:left;word-wrap:break-word;max-width:100%';
            l.innerHTML = 'BESbswy';
            ts.appendChild(l);
            d.body.appendChild(ts);
            ts.style.width = (ts.clientWidth + 1) + 'px';
            ts.style.height = (ts.clientHeight + 1) + 'px';
            i.style.cssText = 'width:2px;height:10px;float:left;position:relative';
            i.innerHTML = '<input autofocus style="position:absolute">';
            ts.appendChild(i);
            setTimeout(function () {
                ts.bind('scroll', function () {
                    y();
                    d.body.removeChild(ts);
                });
                l.style.fontFamily = "'" + f + "'," + tf;
                ts.scrollTop = 1000;
            }, 250);
        })

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
        })


        if (same) {
            let mst = _('main').offsetTop - _('mm').clientHeight - _('top').clientHeight;
            if (getY() > mst) {
                setY(mst);
            }

            switch (p.page) {
                case "c":
                    let
                            id = p.env.category[p.cat].id,
                            c = $1('#fltm [value="' + id + '"]');
                    if (c && !c.checked) {
                        c.checked = true;
                        c.trigger('change');
                    }
                    _('prologue').rerender();
                    _('breadcrumb').rerender();
                    _('serp').rerender(function (p) {
                        p.match = Math.random() * 0.1 + 0.9;
                        return p;
                    });
                    break;
                default:
                    a.render.apply(this, [p, 1]);
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


    gl.transSerp = function (p, a) {
        let t = this;
        t.firstElementChild.ac('o0');
        new timeline().add(400, function () {
            a.render.apply(t, [p, 1]);
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
            }
            gl.flt.cat && (f($1('#fltm [value="' + gl.flt.cat + '"]'), 1));
            gl.flt.cat = o ? f(o, 0) : 0;
        };
    });


    gl.fav = function (o) {
        let h = $1('hr', o), v = h.getAttribute('y') == '2', f = _('favs');
        h.setAttribute('y', v ? 3 : 2);
        f.innerHTML = parseInt(f.innerHTML) + (v ? 1 : -1)
    };

    gl.play = function (o) {
        let d = 'curf', a = o.attributes;
        if (o.id != d) {
            _(d) && (_(d).id = '');
            o.id = d;
            _('player').rerender(function (p) {
                p.key = a.key.value;
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

    return gl;
})(this);