SIMON.Video = class extends SIMON.Object {

    preview(type, id) {
        return new SIMON.Promise(y => {
            switch (type) {
                case "video/vimeo":
                    new SIMON.Request({
                        base: "https://vimeo.com/",
                        method: 'GET',
                        endpoint: "api/v2/video/" + id + ".json"
                    }).send().then(function () {
                        y({
                            url: "https://vimeo.com/" + id,
                            embed: "https://player.vimeo.com/video/" + id,
                            preview: this.response[0].thumbnail_large,
                        })
                    }, y);
                    break;
                case "video/youtube":
                    y({
                        url: "https://www.youtube.com/watch?v=" + id,
                        embed:"https://www.youtube.com/embed/"+id,
                        preview: "https://img.youtube.com/vi/" + id + "/maxresdefault.jpg"
                    });
                    break;
                default:
                    y()
            }
        })
    }

    parse(url, type, m, ret) {
        return new SIMON.Promise(y => {
            m = url.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);
            ret = {id: !m || m[6]};
            if (!ret.id || !m) {
                return y()
            } else if (m[3].indexOf('youtu') > -1) {
                ret.type = "video/youtube";
            } else if (m[3].indexOf('vimeo') > -1) {
                ret.type = "video/vimeo";
            } else {
                return y()
            }

            this.preview(ret.type, ret.id).then(r => {
                ret.preview = r;
                y(ret);
            });

        });
    }

};