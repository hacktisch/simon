

SIMON.Populator = class extends SIMON.Object {
    //TODO bijna zelfde syntax (caching) als templates.js. kunnen ze beiden misschien een cache class extenden?
    get defaults() {
        return {
            cache: {},
        };
    }

};