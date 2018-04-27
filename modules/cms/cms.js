const sign = new SIMON.Cookie("sign");
const whoami = () => sign.value.split(":").slice(1).join("");

const labels = [["g", "#61BD4F"], ["y", "#F2D600"], ["o", "#FFAB4A"], ["r", "#EB5A46"], ["p", "#C377E0"], ["b", "#0079BF"]];

(function (gl) {

    gl.base = location.origin + location.pathname;
    gl.cdnBase = (o => o && o.href)(document.querySelector('base'));
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
    gl.region = prefString("region");

    gl.clone = function (a) {
        //TODO MEET EFFICIENTIE
        return JSON.parse(JSON.stringify(a));
    };
    gl.passJson = function (s) {
        return JSON.stringify(s).replace(/"/g, '#');
    };

    const
            d = document,
            w = window,
            cssVars = ((r, c, l) => {
                for (let s of l) {
                    r[s] = c.getPropertyValue(s);
                }
                return r;
            })({}, w.getComputedStyle(_("cssvars")), ["color"]),
            shortcut = new SIMON.Shortcut(),
            templater = new SIMON.Templater({fetch: (tpl) => {
                    return new SIMON.Promise((y, n) => {
                        new SIMON.Request({
                            base: SIMON.s.tpl_url,
                            method: 'GET',
                            endpoint: tpl + '.tpl'
                        }).send().then(function () {
                            y(this.response)
                        }, n)
                    });
                }}),
            populator = new SIMON.Populator({

                load: function (resource, reload) {
                    let ep = "resource/" + resource;
                    if (!sign.value && resource.charAt(0) != "_") {
                        return new SIMON.Promise((y, n) => n());
                    }

                    if (!this.cache[resource] || reload) {
                        this.cache[resource] = new SIMON.Promise((y, n) => {
                            new SIMON.Request({
                                endpoint: ep,
                                auth: sign.value + "/" + region
                            }).send().then(function () {
                                this.response.res ? y(this.response.res) : n();
                            }, n)
                        });
                    }
                    return this.cache[resource];
                },

                openSocket: function (timeframe, resources) {//todo also needed on shop? in that case: move function directly to class
                    let t = this;
                    (function poll(c) {
                        setTimeout(function () {
                            let h = [], r;
                            for (r in resources) {
                                if (!(c % resources[r][0]) && t.cache[r] && t.cache[r].resolved) {
                                    h.push(r);
                                }
                            }
                            if (sign.value) {
                                new SIMON.Request({
                                    endpoint: "resourceCollect",
                                    auth: sign.value + "/" + region
                                }).send(h).then(function () {
                                    let res = this.response.res;
                                    for (let g in res) {
                                        let isnew = !!t.cache[g];
                                        (t.cache[g] || t.load(g)).then(function () {
                                            if (isnew || JSON.stringify(t.cache[g].ret) != JSON.stringify(res[g])) {
                                                t.cache[g].ret = res[g];

                                                resources[g][1](res[g]);
                                                /**************** TODO conn AAAAAAif (!this.latest) {
                                                 resources[g][1](res[g]);
                                                 }
                                                 delete this.latest;*********/
                                            }

                                        });


                                    }
                                    poll(++c);
                                    load.success(1);
                                }, function () {
                                    poll(++c);
                                    load.success(0);
                                });
                            } else {
                                poll(++c);
                            }

                        }, timeframe);
                    })(1);
                }
            }),
            dom = new SIMON.Dom(),
            run = {
                base: function () {
                    router.bind("change", function () {
                        populator.load('_env').then(function () {
                            let s = router.path, b = s.split("/")[0];
                            _("dynstyle").innerHTML = "[href$='" + router.hash + s + "']:not(.no-ac),[href$='" + router.hash + b + "']:not(.no-ac){color:" + cssVars.color + " !important}";
                        });
                        let p;
                        (p = _("pin-btn")) && p.rerender();
                    }).trigger("change");
                },
                page: function () {

                    let q = this.parentNode, sw = function () {
                        q.rerender(function (p) {
                            p.page = router.route;
                            for (let v in router.args) {
                                p[v] = router.args[v];
                            }
                            return p;
                        });
                    };

                    router.getRoutes.then(function () {
                        sw();
                        router.bind('change', sw);
                    });



                },
                loadEntity: function () {
                    let t = this, d = JSON.parse(t.innerHTML);

                    load.run("get", d).then(function (r) {
                        if (typeof r != "undefined") {
                            populator.load('_env').then(function (env) {
                                t.parentNode.rerender(function (p) {
                                    p.ent = r;
                                    return p;
                                });

                            });
                        }
                    });

                },
                loadPreview: function () {
                    let t = this, d = JSON.parse(t.innerHTML), ds = d.id.split(":");

                    if (ds.length - 1) {
                        new SIMON.Video().preview(ds[0], ds[1]).then(r => {
                            t.parentNode.rerender(function (p) {
                                p.ent = {
                                    type: "img",
                                    filename: ds[0],
                                    mime: "image/jpeg"
                                };
                                p.href = r.url;
                                p.preview = r.preview;
                                return p;
                            });
                        });
                    } else {
                        load.run("get", d).then(function (r) {
                            if (typeof r != "undefined") {
                                populator.load('_env').then(function (env) {
                                    t.parentNode.rerender(function (p) {
                                        p.ent = r;
                                        p.href = r.baseurl + (r.dir ? r.dir + "/" : "") + r.filename;
                                        p.preview = p.href + "/s";
                                        return p;
                                    });

                                });
                            }
                        });
                    }


                },
                bindShortcuts: function () {
                    $("[shortcut]", this.parentNode).each(function () {
                        let s = this.getAttribute("code");
                        s = s ? ~~s : this.getAttribute("shortcut").charCodeAt(0);
                        shortcut.bind(s, () => document.body.contains(this) ? this.click() : shortcut.unbind(s));
                    });
                },
                reload: function () {
                    this.parentNode.rerender();
                },
                fetch: function () {
                    let t = this, f = JSON.parse(this.innerHTML);
                    for (let k in f) {
                        new SIMON.Request({
                            base: f[k],
                            method: 'GET'
                        }).send().then(function () {
                            t.parentNode.rerender(p => (p[k] = this.response) && p);
                        })
                    }
                },
                scrollHere: function () {
                    _("view").scrollTop = this.getBoundingClientRect().top - 100;
                },
                sortable: function () {
                    let l = this;
                    Sortable.create(l, {
                        animation: 150,
                        onUpdate: () => {
                            let v = [];
                            $("input", l).each(function () {
                                v.push(this.value);
                            });
                            (o => {
                                o.value = v.join(",");
                                triggerChange(o);
                                o.ac("t")
                            })($1("input", l.closest("section")));
                        }
                    });
                },
                graphs: function () {
                    load.run("sessions").then((r) => {
                        this.parentNode.rerender(function (p) {
                            p.sessions = r;
                            return p;
                        });
                    });
                }
            };

    gl.transOptions = function (p, a) {
        let t = this;
        load.run("options", keep(p, ["id", "kind", "key", "source"])).then(function (r) {
            if (typeof r != "undefined") {
                p.options = r;
                a.render.apply(t, [p, 1]);
            }
        });
    };

    gl.transEntHist = function (p, a) {
        let t = this;
        load.run("getHist", {
            kind: p.kind,
            id: p.id
        }).then(function (r) {
            if (typeof r != "undefined") {
                p.hist = r;
                a.render.apply(t, [p, 1]);
            }
        });
    };



    class Sound {
        constructor(lib) {
            this.ext = d.createElement('audio').canPlayType('audio/mp3').replace(/no/, '') ? "mp3" : "ogg";
            this.lib = lib;
            this.cache = {};
        }
        play(n) {
            if (!_("mute").checked) {
                if (this.cache[n]) {
                    this.cache[n].play();
                }
            }
        }
        preload() {
            this.lib.forEach((n) => {
                this.cache[n] = (a => {
                    a.volume = .5;
                    a.load();
                    return a
                })(new Audio("sfx/" + n + "." + this.ext));
            });
            return this;
        }
    }

    gl.sound = new Sound(["delete", "error", "restore", "save", "tick0", "tick1", "trash", "spark"]).preload();
    let prld = () => {
        d.removeEventListener("touchstart", prld);
        gl.sound.preload();
    };
    d.addEventListener("touchstart", prld);
    gl.exit = () => new SIMON.Promise((y, n) => {
            sound.play("spark");
            _("main").ac("o0");
            setTimeout(y, 900);
        });

    function setStats(s) {
        for (let st in s) {
            _("stat-" + st).innerHTML = s[st] ? s[st] : "";
        }
    }

    class Load {
        constructor(s) {
            this.c = 0;
            this.s = s;
            this.o = 1;
        }
        count(d) {
            this.s.tc("dn", !(this.c = Math.max(0, this.c + (d || -1))));
        }
        run(ep, s) {
            if (!sign.value && ep.charAt(0) != "_") {
                $(".signout-update").rerender();
                return new SIMON.Promise((y, n) => {
                    n()
                });
            }
            this.count(1);
            let
                    f = (o) => (() => (this.count() & this.success(o))),
                    req = new SIMON.Request({
                        endpoint: ep,
                        auth: sign.value + "/" + region
                    }).send(s),
                    r = new SIMON.Promise(function (y, n) {
                        req.then(f(1), f(0)).then(function () {
                            let a = this.response.auth;
                            if (typeof a != "undefined") {
                                let sv = sign.value;
                                a && sign.save(a.sign, a.days) || sign.destroy();
                                n();
                                if (!sv) {
                                    $(".signout-update").rerender();
                                }
                            }
                            let res = this.response.res;
                            if (res && res.e) {
                                sound.play("error");
                                errorCode(res.e, res.extra);
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
        success(o) {
            if (this.o != o) {
                $(".downNotify").tc("offline", !(this.o = o));

            }
        }
    }
    let load = new Load(_("spinner"));


    gl.router = new SIMON.Router({
        hash: '#',
        getRoutes: populator.load('_env').then(function (ret) {
            let r = ret.routes, m = new Map();
            for (let i = 0; i < r.length; i++) {
                let h = {
                    rt: r[i][1],
                    vars: []
                };
                h.rx = new RegExp('^' + h.rt.replace(/:[^\s/]+/g, function (a) {
                    h.vars.push(a.substring(1));
                    return '([\\w-@.]+)';
                }) + '$');
                m.set(r[i][0], h);
            }
            router.routes = m;
            router.aliasRev = {};
            for (var k in router.alias) {
                router.aliasRev[router.alias[k]] = k;
            }
        }),
        build: function (r, rp, pm) {
            let a = this.aliasRev[r + (rp ? '/' + rp.map(function (a) {
                return a[1];
            }).join('/') : '')];
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

    gl.refresh = function () {
        router.goto(location.hash);
    };


    gl.passJson = function (s) {
        return JSON.stringify(s).replace(/"/g, '#');
    };


    dom.propagate(d.body, templater, populator, function () {
        $('[run]', this).each(function () {
            run[this.getAttribute('run')].apply(this);
        });
    });






    gl.nr = function (n) {
        return n.toLocaleString(router.lang, {minimumFractionDigits: 0, maximumFractionDigits: 1});
    };

    gl.bulk = function (a, f, callback) {
        if (f.hc('lock')) {
            return;
        }
        f.ac('lock');
        let send = new FormData(f);
        send.append("action", a);
        load.run("bulk", send).then((r) => {
            sound.play(a);
            f.rc('lock');
            for (let d in r.l) {
                entityUpdated({kind: r.kind, id: r.l[d].id}, 1);
                gl.pinPage(1, router.build("edit", [["kind", r.kind], ["id", r.l[d].id]]), 1);
            }
            callback();
        });
    };

    d.addEventListener("invalid", function (e) {
        sound.play("error");
    }, true);

    let sstm;
    function showsuccess(o) {
        sound.play("save");
        let c = "i-success";
        o.ac(c);
        clearTimeout(sstm);
        sstm = setTimeout(() => {
            o.rc(c)
        }, 1500)
    }

    let fsret = {
        _auth: (r, f) => {
            if (r && r.msg) {
                sound.play("error");
                _("authmsg").innerHTML = r.msg;
            }
        },
        _forgot: (r, f) => {
            _("prompt").rerender();
        },
        save: (r, f) => {
            // clearTimeout(echTm);
            if (r && r.id) {
                f.rc("draft");
                $(".t", f).rc("t");
                delete gl.drafts[f.getAttribute("fid")];
                saveDrafts();
                gl.curPage = r.kind + ":" + r.id;
                router.goto(router.hash + router.build("edit", [["id", r.id], ["kind", r.kind]]));
                entityUpdated(r);
                showsuccess($(".update", f));
                (o => o && o.rerender((p) => {
                        p.id = r.id;
                        return p;
                    }))(_("entHist"));
            }
        },
        "cdn/uploadConfirm": (r, f) => {
            if (r) {
                sound.play("save");
                _("tmp").rerender();
                (o => o && o.rerender((p) => {
                        p.cdn.dir = r.dir;
                        return p;
                    }))(_("explorer"));
            }
        },
        settings:(r)=>{
            console.log(r);
        }
    };

    function renderLink(p, t) {
        return '<a href="' + base + router.hash + p + '">/' + (t || p) + '</a>';
    }

    gl.renderConstraints = d => d.map(r => renderLink(router.build("edit", [["kind", r.kind], ["id", r.id]])) + " <b class='di'>(field <em>" + r.field + "</em>)</b>").join("<br>");

    function errorCode(c, d) {
        _("prompt").rerender((p) => {
            let f = ({
                5: ["We could not send the message. Does this email address exist?"],
                8: ["This entity could not be deleted because it is constrained by:", d => "<br>" + renderConstraints(d)],
                9: ["Duplicate file(s) detected. We do not accept a file if it has already been uploaded:", d => "<br>" + d.map(d => "<s>" + d[0] + "</s> <b class='di'>(<em>" + renderLink(router.build("files", [], [d[1].split("/").slice(0, -1).join("/")]), d[1]) + "</em>)</b>").join("<br>")],
                10: ["The file name is already taken in that directory"],
                18: ["This token has expired"],
                404: ["This entity has been deleted while you were working on this draft"],
                409: ["A unique field value is already registered for another entity"]
            }[c] || ["Unknown error code: " + c]);
            p.msg = f[0] + (f[1] ? f[1](d) : "");
            return p
        })
    }

    gl.formSubmit = function (e, a) {
        e.preventDefault();
        let f = e.target;
        if (f.hc('lock') || (f.getAttribute("draft") && !f.hc('draft'))) {
            return;
        }
        f.ac('lock');
        
        load.run(a, new FormData(e.target)).then((r) => {
            f.rc('lock');
            fsret[a] && fsret[a](r, f);
        }, () => {
            f.rc('lock')
        });
    };

    gl.htmlAttrs = function (p) {
        let r = [];
        for (let k in p) {
            r.push(k + '="' + p[k] + '"');
        }
        return r.join(" ");
    };

    gl.transPage = function (p, a) {
        let
                t = this,
                cp = p.kind + ":" + p.id;

        if (p.page == "add") {
            p.id = 0;
        }
        if (p.page == "list") {
            if (gl.listreq) {
                load.count();
                gl.listreq.abort();
            }
            let pm = router.params, flt = {};
            try {
                if (pm[3]) {
                    flt = JSON.parse(atob(pm[3]));
                }
            } catch (e) {
            }
            gl.listreq = load.run("list", {kind: p.kind, pm: pm, rpp: pref("rpp"), order: prefString("order-" + p.kind), filter: flt}).then((r) => {
                a.render.apply(t, [assign(p, r), 1]);
            });
        } else if (p.page == "edit") {
            if (p.kind == "agent" && p.id == whoami()) {
                p.when = "me";
            }
            if (gl.curPage == cp && gl.curRoute != "revision") {
                $(".formUpdate").rerender(function () {
                    return p;
                });
            } else {
                a.render.apply(this, [p, 1]);
                addHistory(p);
            }

        } else {
            a.render.apply(this, [p, 1]);
        }
        gl.curPage = cp;
        gl.curRoute = p.page;
        // this.prevp = p.page;
    };

    gl.transDrafts = function (p, a) {
        let s = size(drafts);
        if (!this.childElementCount || !s) {
            a.render.apply(this, [p, 1]);
        } else {
            _("draftsMenu").rerender();
            $1(".stat", this).innerHTML = s;
        }
    };


    gl.pinPage = function (del, pin, bs) {
        if (typeof pin == "undefined") {
            pin = router.path;
        }
        !bs && sound.play("tick" + (del ? 0 : 1));

        load.run("pin", {
            pin: pin,
            del: del
        });
        populator.load("pins").then(function (r) {
            let s = size(r);
            if (del) {
                delete r[pin];
            } else {
                r[pin] = 1;
            }
            if (size(r) != s) {
                /////this.latest = 1;//TODO conn AAAAAA
                $('.pin-update').rerender(function (p) {
                    p.pins = r;
                    return p;
                });
            }
        });
    };

    gl.size = function (a) {
        return Object.keys(a).length;
    };



    gl.trash = function (k, id) {
        let ent = {
            kind: k,
            id: id
        };
        load.run("trash", ent).then(() => {
            sound.play("trash");
            entityUpdated(ent, 1);
            gl.pinPage(1, router.build("edit", [["kind", k], ["id", id]]), 1);
            curPage == k + ":" + id ? router.goto(router.hash + router.build('list', [['kind', k]])) : refresh();
        });
    };

    gl.rusure = (cb, tx) => {
        _("prompt").rerender((p) => {
            p.msg = tx;
            gl.confcb = () => {
                cb();
                _('prompt').rerender()
            };
            p.conf = "DELETE";
            return p;
        });
        return false;
    };

    gl.entityAction = function (endpoint, ent, conf) {
        let cb = () => {
            load.run(endpoint, ent).then((r) => {
                sound.play(endpoint);
                entityUpdated(ent, 1);
                refresh();
            });
        };
        if (!conf) {
            cb();
        } else {
            rusure(cb, conf);
        }
    };


    gl.listCheck = function (o) {
        let
                e = o.form.elements,
                s = $(".sel", o.form),
                lv,
                l = s.length,
                cn = 0,
                m = _("entity-s");
        if (o.name === "all") {
            let a = o.checked;
            a && (cn = l);
            s.each(function () {
                this.checked = a;
            });

        } else {
            s.each(function () {
                this.checked && (lv = this.value) && cn++;
            });
            e.all.checked = cn === l;
        }
        if (cn === 1) {
            let ent = {
                kind: e.kind.value,
                id: lv
            };
            gl.showDetails(ent);
        } else {
            _("details-toggle").checked = 0;
        }
        o.form.tc("has-sel", cn);
        _("am-sel").setAttribute("c", cn);

    };


    gl.showDetails = function (ent) {

        let ds = ent.id.split(":");

        if (ds.length - 1) {
            new SIMON.Video().preview(ds[0], ds[1]).then(r => {
                _("details").rerender(function (p) {
                    p.html = '<div class="videoc pr"><iframe class="db pa w100 h100 t0" src="' + r.embed + '"></iframe></div>';
                    return p;
                });
            });
        } else {
            load.run("get", ent).then((d) => {
                ent.details = d;
                _("details").rerender(function (p) {
                    p.ent = ent;
                    return p;
                });
            });
        }

        _("details-toggle").checked = 1;
    };

    gl.transMe = function (p, a) {
        populator.load("me", 1).then((r) => {
            p.me = r;
            a.render.apply(this, [p, 1]);
        })
    };



    function entityUpdated(ent, dead) {
        $("[eid='" + ent.id + "'][kind='" + ent.kind + "']").each(function () {
            let pr = this.parentNode;
            if (dead || pr.getAttribute("transition")) {
                pr.rerender();
            } else {
                load.run("get", ent).then((d) => {
                    ent.details = d;
                    pr.rerender(function (p) {
                        p.ent = ent;
                        return p;
                    });
                });
            }
        });
    }

    let ld = _("loading");
    populator.load("_env").then(function () {

        setTimeout(() => populator.load('stats').then(setStats), 1e3);



        populator.openSocket(2e3, {
            pins: [2, function (nw) {
                    $('.pin-update').each(function () {
                        this.rerender(function (p) {
                            p.pins = nw;
                            return p;
                        });
                    });
                }],
            stats: [1, setStats]
        });

        new timeline().add(250, () => ld.ac("o0")).add(500, () => ld.remove()).run();
    }, () => ld.ac("offline"));






    function addHistory(ent) {
        const k = "viewHist";
        gl[k] = JSON.parse(prefString(k + "-" + region) || "[]");
        if (ent) {
            gl[k] = gl[k].filter(r => r.id !== ent.id);
            ent.time = new Date().getTime();
            gl[k].unshift(ent);
            gl[k] = gl[k].slice(0, 5);
            prefString(k + "-" + region, JSON.stringify(gl[k]));
            _("history").rerender();
        }
    }
    addHistory();
    d.addEventListener("change", function (e) {
        let t = e.target;
        //if (~["INPUT", "TEXTAREA"].indexOf(t.tagName)) {
        if (t.type == "number") {
            let h = ["defaultValue", "value"], v = 2 + ~t.validity.valid;
            t[h[v]] = t[h[2 + ~v]];
        }

    }, true);





    gl.drafts = (JSON.parse(prefString("drafts-" + region) || "{}"));
    gl.deleteDraft = (e, dr) => {
        e.preventDefault();
        delete drafts[dr];
        $('[draft="' + dr + '"]').rc("draft");
        saveDrafts();
    };
    function saveDrafts() {
        prefString("drafts-" + region, JSON.stringify(drafts));
        $('.draft-update').rerender();
        if (router.route == "revision") {
            router.goto(router.hash + router.build('edit', [['kind', router.args.kind], ['id', router.args.id]]));
        }
    }
    function fieldVal(o) {
        return o[o.type == "checkbox" ? "checked" : "value"]
    }

    gl.entityChanged = (e, k) => {
        // clearTimeout(echTm);
        let t = e.target, f = t.form;
        if (!t.hc("no-ent")) {
            f.ac("draft");
            if (f.getAttribute("draft")) {
                //     echTm = setTimeout(() => {
                if (t.name && t.type != "password") {
                    updateDraft(f, k, t);
                }
                //   }, 500);
            }
        }
    };

    function setFileField(tg, i) {
        let ef = _("entityForm"), ti = ef.elements[tg];
        ti.closest("section").rerender((p) => {
            if (typeof i != "undefined") {
                let v = ti.value.split(",");
                v.splice(i, 1);
                p.value = v.join(",");
            } else {
                let nv = selectedFiles.map(a => a.id).join(",");
                p.value = ti.multiple && ti.value ? ti.value + "," + nv : nv;
                p.sc = 1;
            }
            p.changed = 1;
            console.log(p.value);
            return p;
        });

        setTimeout(triggerChange, 50, ef.elements[tg]);
    }
    function triggerChange(o) {
        o.dispatchEvent(new Event('change', {bubbles: true}))
    }
    gl.fileToField = (f) => {
        _("fileBrOpen").checked = 0;
        setFileField(f.elements.target.value);
    };
    gl.fileRemoveField = (key, i) => {
        setFileField(key, i);
    };


    gl.updateDraft = (fr, k, t) => {
        fr.ac("draft");
        let once = {};
        let g = ((f, ch) => {
            let path = f.name.split(":");
            if (path.length - 1) {
                if (f.type == "checkbox") {
                    if (typeof ch[path[0]] == "undefined") {
                        ch[path[0]] = [];
                    }
                    f.checked ? ch[path[0]].push(path[1]) : ch[path[0]].splice(ch[path[0]].indexOf(path[1]), 1);
                } else if (!once[path[0]]) {
                    once[path[0]] = 1;
                    let fetch = [];
                    $('.gr-' + k.split(":")[0] + "-" + path[0], f.closest(".group-list")).each(function(i) {
                        let sub={};
                        $("[name]",this).each(function(){
                            sub[this.name.split(":")[1]]=this.value;
                        });
                        fetch[i]=sub;
                    });
                    ch[path[0]] = fetch;
                }
            } else {
                ch[path[0]] = fieldVal(f);
            }
        });
        if (!drafts[k] || !t) {
            drafts[k] = {};
            for (let f of fr.elements) {
                if (f.name && !~["hidden", "password"].indexOf(f.type)) {
                    g(f, drafts[k]);
                }
            }
        } else {
            g(t, drafts[k]);
        }
        console.log(drafts[k]);
        saveDrafts();
    };

    gl.invite = (inv, bt) => {
        load.run("invite", {
            invited: inv,
            url: location.origin + "/" + router.hash + router.build("token")
        }).then((r) => {
            showsuccess($(".inv", bt));
        });
    };


    gl.useToken = (t) => {
        load.run("_token", {
            token: t
        }).then((r) => {
            router.goto("/")
        }, () => {
            router.goto("/")
        });
    };

    gl.getFields = (schema, when, groups) => {
        when = when || "_";
        let r = groups ? new Map() : [];
        for (let f of schema.fields) {
            if (~(f.when || ["_"]).indexOf(when)) {
                if (groups) {
                    let g = f.group || "_";
                    if (!r.get(g)) {
                        r.set(g, [])
                    }
                    r.get(g).push(f)
                } else {
                    r.push(f)
                }
            }
        }
        return r;
    };

    gl.files2tmp = (fs) => {
        if (fs.length) {
            let fd = new FormData(), c = 0;
            for (let i = 0; i < fs.length; i++) {
                if (fs[i].kind) {
                    if (fs[i].kind == "file") {
                        fd.append(i, fs[i].getAsFile());
                        c++;
                    }
                } else {
                    fd.append(i, fs[i]);
                    c++;
                }
            }
            if (c) {
                d.body.ac("upl");
                load.run("cdn/upload", fd).then((r) => {
                    _("tmp").rerender();
                }, () => {
                    _("tmp").rerender();
                    d.body.rc("upl");
                });
            } else {
                d.body.rc("drag");
            }
        }
    };

    gl.selectedFiles = [];
    gl.fileSelect = (inp, tl) => {
        _("fileBrOpen").checked = 1;
        _("formFiles").rerender((p) => {
            selectedFiles = [];
            p.field = {title: tl, name: inp.name, multi: inp.multiple, accept: inp.getAttribute("accept")};
            p.load = 1;
            return p;
        });
    };

    gl.filesDir = (e, d) => {
        e.preventDefault();
        _("explorer").rerender((p) => {
            p.cdn.dir = d;
            return p;
        });
    };

    gl.fileChecked = (e) => {
        let t = e.target;
        if (t.checked) {
            if (t.type == "radio") {
                gl.selectedFiles = [];
            }
            gl.selectedFiles.push({
                id: t.value,
                url: t.getAttribute("f-url"),
                type: t.getAttribute("f-type")
            });
        } else {
            gl.selectedFiles = gl.selectedFiles.filter(a => a.id != t.value);
        }
        _("selectedFiles").rerender();
    };

    gl.fselSlice = (lb, fid) => {
        setTimeout(() => {
            if (d.body.contains(lb)) {
                gl.selectedFiles = gl.selectedFiles.filter(a => a.id != fid);
                _("selectedFiles").rerender();
            }
        }, 30);
    };



    gl.drop = function (e) {
        e.preventDefault();
        var dt = e.dataTransfer;
        files2tmp(dt.items);
    };

    gl.transFiles = function (p, a) {
        let t = this;
        if (p.accept) {
            p.cdn.filter = {type: p.accept.split(",").map(s => s.trim())}
        }
        load.run("cdn/list", p.cdn).then(r => {
            if (p.cdn.bucket == "tmp") {
                let l = r.files.length;
                _("file-toggle").checked = !!l;
                _("stat-tmp").innerHTML = l || "";
                d.body.rc("upl").rc("drag");
            } else {
                p.dir = router.params[0];
            }
            if (r) {
                a.render.apply(t, [assign(p, r), 1]);
            }
        })
    };
    /*gl.setDir = (o, to) => {
     o.closest("section").rerender((p) => {
     p.cdn.dir = to;
     return p;
     })
     };*/

    gl.tmpDel = (fl) => {
        load.run("cdn/tmpdel", {
            file: fl
        }).then(r => {
            sound.play("trash");
            _("tmp").rerender();
        })
    };

    gl.sort = (f) => {
        let fe = f.elements;
        localStorage.setItem("sort", JSON.stringify({
            by: fe.by.value,
            rev: fe.rev.checked
        }));
        _("exp-ct").rerender();
    };

    gl.formatDate = (a, g) => (new Date(a).toLocaleString("en", assign({weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false}, g || {})));


    gl.listFilter = (k, rpp) => {
        _("prompt").rerender((p) => {
            p.msg = {tpl: "filter", params: {kind: k}};
            p.conf = "FILTER";
            gl.confcb = () => {
                let flt = {};
                for (var q of $("#filterForm select")) {
                    if (q.value) {
                        flt[q.name] = (flt[q.name] || []).concat([[q.value, q.nextElementSibling.value]]);
                    }
                }
                let g = router.params;
                g[0] = rpp;
                g[1] = 0;
                g[2] = g[2] || "";
                router.goto(router.hash + router.build(router.route, [['kind', k]], g.slice(0, 3).concat(size(flt) ? [btoa(JSON.stringify(flt))] : [])));
                _('prompt').rerender();
            };
            return p;
        });
    };

    gl.invSess = (t, w) => {
        load.run("sessionInvalidate", w).then(r => {
            t.closest("section").rerender();
        });
    };

    gl.parseUrl = (url) => {
        new SIMON.Video().parse(url).then(r => {
            _("preview").rerender(p => {
                console.log(r || {});
                p.found = r || {};
                selectedFiles = r ? [{id: r.type + ":" + r.id}] : [];
                return p
            })
        });

    };
    gl.insertLink = (a) => {
        console.log(a);



        setFileField("showcase");


        /*
         function setFileField(tg, i) {
         let ef = _("entityForm"), ti = ef.elements[tg];
         ti.closest("section").rerender((p) => {
         if (typeof i != "undefined") {
         let v = ti.value.split(",");
         v.splice(i, 1);
         p.value = v.join(",");
         } else {
         let nv = selectedFiles.map(a => a.id).join(",");
         p.value = ti.multiple && ti.value ? ti.value + "," + nv : nv;
         p.sc = 1;
         }
         p.changed = 1;
         return p;
         });
         setTimeout(triggerChange, 50, ef.elements[tg]);
         }*/






    };


    gl.addGroup = function (p, a) {
        a.render.apply(this, [p, 1]);
        let cl = this.parentNode.cloneNode(true);
        cl.rc("dn");
        $1(".group-list", cl.parentNode).appendChild(cl);
        this.innerHTML="";
    };


    return gl;
})(this);