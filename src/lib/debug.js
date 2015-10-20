'use strict';

module.exports = {

    setLevel: function (level) {
        this.level = level;
    },

    log: function (message) {
        var args = arguments;

        if (this.level > 0) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    debug: function (message) {
        var args = arguments;

        if (this.level > 1) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    time: function (message) {
        console.time.apply(this, arguments);
    },

    timeEnd: function (message) {
        if (this.level > 2) {
            console.timeEnd.apply(this, arguments);
        }
    }

};