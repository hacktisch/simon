function filesize(a, b, c, d, e) {
    return (b = Math, c = b.log, d = 1e3, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2)
            + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes')
}