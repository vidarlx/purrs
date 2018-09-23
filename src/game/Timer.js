class Timer {
    constructor() {
        this.time = null;
        this.cb = null;
        this.runs = null;

        // handler for the 'setTimeout'
        this.timeoutHandler = null;
    }

    run() {
        console.info('Starting timer');
        this.runs = true;

        this._decreaseTimer(this.cb.bind(this));
    };

    kill() {
        this.timeoutHandler = null;
        this.time = null;
        this.runs = false;
    }

    callWhenElapsed(cb) {
        this.cb = cb;
    };

    setTime(time) {
        this.time = time;
    };

    _decreaseTimer(callback) {
        if (this.time <= 0 && this.runs) {
            return callback();
        }

        if (!this.runs) {
            return;
        }

        this.time--;

        if (this.time % 10 === 0) {
            console.info('The game ends in: %s', this.time);
        }

        this.timeoutHandler = setTimeout(() => {
            clearTimeout(this.timeoutHandler);

            this._decreaseTimer(callback);
        }, 1000);
    };

    getCurrentTime() {
        return this.time;
    };

}

module.exports = Timer;
