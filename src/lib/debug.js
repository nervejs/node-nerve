/*eslint no-console: "off"*/

'use strict';

const util = require('util');

module.exports = {

    timeEvents: {},

    timeout: 20000,

    setLevel: function (level) {
        this.level = level;
    },

    error: function (message) {
        let args = arguments;

        if (this.level > 0) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    log: function (message) {
        let args = arguments;

        if (this.level > 10) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    debug: function (message) {
        let args = arguments;

        if (this.level > 20) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    },

    time: function (id) {
        if (this.level > 30) {
            this.timeEvents[id] = Date.now();
            setTimeout(function () {
                if (this.timeEvents[id]) {
                    delete this.timeEvents[id];
                }
            }.bind(this), this.timeout);
        }
    },

    timeEnd: function (id, message) {
        let time;

        message = message || id;

        try {
            if (this.level > 30 && this.timeEvents[id]) {
                time = Date.now() - this.timeEvents[id];
                delete this.timeEvents[id];

                setTimeout(function () {
                    console.log(util.format('%s: %sms', message, time));
                });
            }
        } catch (ignore) {}
    }

};