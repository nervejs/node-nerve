(function () {
    'use strict';

    var _ = require('lodash'),
        NerveObject = require('./object'),
        ActiveUser;

    ActiveUser = NerveObject.extend({

        init: function (app, options) {
            this.app = app;
            this.options = options;
            this.attr = {};

            this.isFetchedState = false;
        },

        request: function () {
            return new Promise(function (resolve, reject) {
                this.isFetchedState = true;
                this.emit('fetched');
                resolve();
            }.bind(this));
        },

        get: function (key) {
            return this.attr[key];
        },

        setSingle: function (key, value) {
            this.attr[key] = value;
        },

        set: function (key, value) {
            var attrs;

            if (_.isObject(key)) {
                attrs = key;
                Object.keys(attrs).forEach(function (key) {
                    this.setSingle(key, attrs[key]);
                }.bind(this));
            } else {
                this.setSingle(key, value);
            }
        },

        toJSON: function (key) {
            return this.attr;
        },

        isAuthorized: function () {
            return !!this.get('email');
        },

        fetched: function (callback) {
            if (this.isFetchedState) {
                callback();
            } else {
                this.on('fetched', callback);
            }
        }

    });

    module.exports = ActiveUser;
}());