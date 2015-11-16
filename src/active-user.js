(function () {
    'use strict';

    var NerveObject = require('./object'),
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

        set: function (key, value) {
            this.attr[key] = value;
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