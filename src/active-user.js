(function () {
    'use strict';

    var NerveObject = require('./object'),
        ActiveUser;

    ActiveUser = NerveObject.extend({

        init: function (options) {
            this.options = options;
            this.attr = {};
        },

        request: function () {
            return new Promise(function (resolve, reject) {
                resolve();
            }.bind(this));
        },

        get: function (key) {
            return this.attr[key];
        },

        toJSON: function (key) {
            return this.attr;
        },

        isAuthorized: function () {
            return !!this.get('email');
        }

    });

    module.exports = ActiveUser;
}());