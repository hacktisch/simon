(function (gl) {

    gl.fC = e => {
        let t = e.target, v = t.value;
        t.tc("filled", v);
        $('[name="' + t.name + '"]').each(function () {
            if (this != t) {
                this.value = v;
                this.tc("filled", v);
            }
        });
        prefString("v-" + t.name, v);
    };
    let fsret = {
        order: (r, f) => {
            router.goto(router.hash + router.build("order-completed"));
            order.products = [];
            order.form = 0;
            prefString('order', JSON.stringify(order));
        }
    };
    let tml, fsstart = {
        order: (f, l) => {

            let ls = _("letter"), re = _("request").style;
            f.style.height = f.clientHeight + "px";
            ls.style.left = "100%"
            new timeline()
                    .add(10, o => {
                        f.style.height = ls.clientHeight + "px";
                    })
                    .add(570, o => {
                        ls.style.opacity = 1;
                        _("req-header").style.transform = "translateY(100%)"
                    })
                    .add(1180, o => {
                        f.style.display = "none";
                        l.then(o => {
                            new timeline()
                                    .add(320, o => {
                                        let sa = _("stamp-approve").style;
                                        sa.opacity = 1;
                                        sa.transform = "none"
                                    })
                                    .add(1500, o => {
                                        re.transition = ".5s cubic-bezier(0.99, 0.09, 1, 1)"
                                    })
                                    .add(1520, o => {
                                        re.transform = "translateX(calc(63% + 53vw)) skewx(-20deg)"
                                    })
                                    .add(2400, o => {
                                        _("pop-tgl").checked = 0;
                                        _("request-cont").rerender()
                                    }).run()
                        })
                    })
                    .run();
        }
    }

    gl.formSubmit = function (e, a) {
        e.preventDefault();
        let f = e.target;
        if (f.hc('wait')) {
            return;
        }
        f.ac('wait');
        let l = load.run(a, new FormData(e.target)).then((r) => {
            f.rc('wait');
            fsret[a] && fsret[a](r, f);
        }, () => {
            f.rc('wait')
        });
        fsstart[a] && fsstart[a](f, l);
    };
    return gl;
})(this);