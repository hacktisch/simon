SIMON.Mapize = function (o) {
    let m = new Map();
    if (o.$) {
        for (var node of o.$) {
            m.set(node.id, {
                _: node._,
                $: SIMON.Mapize(node),
                meta:node.meta
            });
        }
    }
    return m;
};