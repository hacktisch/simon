/*
 * timeline.js
 * Enqueue events in a timeline animation
 * Written by Merijn van Wouden
 * TODO CLASS
 */

function timeline(queue) {
    this.queue = queue || {};
    this.play = true;
    this.tt = null;
    return this;
}

timeline.prototype.get = function () {
    return this.queue;
};
timeline.prototype.add = function (ms, func) {
    while (this.queue.hasOwnProperty(ms)) {
        ms++;
    }
    this.queue[ms] = func;
    return this;
};
timeline.prototype.run = function (speed) {
    this.play = true;
    var speed = (1 / speed) || 1;
    var points = [];
    var k;
    for (k in this.queue) {
        if (this.queue.hasOwnProperty(k)) {
            points.push(k);
        }
    }
    points.sort(function (a, b) {
        return a - b;
    });
    this.runLoop(points, 0, speed);
    return this;
};
timeline.prototype.runLoop = function (points, now, speed) {
    if (!this.play) {
        this.play = true;
        return;
    }
    var $this = this;
    var next = points.shift();
    this.tt = setTimeout(function () {
        $this.queue[next]();
        if (points.length) {
            $this.runLoop(points, Math.round(next * speed), speed);
        }
    }, Math.round((next - now) * speed));
};
timeline.prototype.stop = function () {
    clearTimeout(this.tt);
    this.play = false;
};