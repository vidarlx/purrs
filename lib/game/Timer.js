var Timer = function () {
    this.time = null;
    this.cb = null;
    
    // handler for the 'setTimeout'
    this.timeoutHandler = null;
};

Timer.prototype.run = function () {
    console.info('Starting timer');

    this._decreaseTimer(this.cb.bind(this));
};

Timer.prototype.callWhenElapsed = function (cb) {
    this.cb = cb;
};

Timer.prototype.setTime = function (time) {
    this.time = time;
};

Timer.prototype._decreaseTimer = function (callback) {
    var that = this;

    if (this.time <= 0) {
        return callback();
    }

    this.time--;

    if (this.time % 10 === 0) {
        console.info('The game ends in: %s', this.time);
    }

    this.timeoutHandler = setTimeout(function () {
        clearTimeout(that.timeoutHandler);

        that._decreaseTimer(callback);
    }, 1000);
};

Timer.prototype.getCurrentTime = function () {
    return this.time;
};

module.exports = Timer;