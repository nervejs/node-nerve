'use strict';

module.exports = {

    setLevel: function (level) {
        this.level = level;
    },

    log: function (message) {
        var args = arguments;

        if (this.level > 10) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    error: function (message) {
        var args = arguments;

        if (this.level > 0) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    debug: function (message) {
        var args = arguments;

        if (this.level > 20) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    time: function (message) {
        console.time.apply(this, arguments);
    },

    timeEnd: function (message) {
        try {
            if (this.level > 30) {
                console.timeEnd.apply(this, arguments);
            }
        } catch (ignore) {}
    }

};