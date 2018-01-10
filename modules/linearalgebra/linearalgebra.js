class Vector {
    constructor(v) {
        this.vec = v
    }
    sub(b, i, l, r) {
        i = 0, l = b.vec.length, r = [];
        for (; i < l; i++) {
            r.push(this.vec[i] - b.vec[i]);
        }
        return new Vector(r)
    }
    get lengthsq() {
        let i = 0, r = 0, l = this.vec.length;
        for (; i < l; i++) {
            r += this.vec[i] * this.vec[i];
        }
        return r
    }
    get sorted() {
        let i = 0, r = [], l = this.vec.length;
        for (; i < l; i++) {
            r.push([i,this.vec[i]]);
        }
        r.sort((a,b)=>a[1]>b[1]);
        return r
    }
}

class Matrix {
    constructor(m) {
        this.mat = [];
        for (let i = 0, l = m.length; i < l; i++) {
            this.mat.push(new Vector(m[i]));
        }
    }
    dist(b, i, l, r) {
        i = 0, l = this.mat.length, r = [];
        for (; i < l; i++) {
            r.push(this.mat[i].sub(b).lengthsq)
        }
        return new Vector(r);
    }
}