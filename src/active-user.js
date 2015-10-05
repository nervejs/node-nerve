'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    util = require('util'),
    request = require('request'),
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