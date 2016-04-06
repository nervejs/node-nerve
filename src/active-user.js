(function () {
    'use strict';

    var _ = require('lodash'),
        NerveObject = require('./object'),
        Property = require('./lib/property'),
        ActiveUser;

    ActiveUser = NerveObject.extend({

        init: function (app, options) {
            this.app = app;
            this.options = _.merge({}, this.defaultOptions, options);
            this.attr = {};

            this.isFetchedState = false;
        },

        /**
         * Запрос за данными пользователя
         *
         * @returns {Promise}
         */
        request: function () {
            var promises = Object.keys(this.options.fields).map(function (field) {
                    return this.options.fields[field] && _.isFunction(this[field]) ? this[field]() : Promise.resolve();
                }.bind(this));

            return Promise.all(promises)
                .then(function (results) {
                    results.forEach(function (item) {
                        if (!item.error) {
                            _.merge(this.attr, item);
                        }
                    }.bind(this));

                    this.emit('fetched');
                }.bind(this))
        },

        get: function (key) {
            return Property.get(this.attr, key);
        },

        setSingle: function (key, value) {
            Property.set(this.attr, key, value);

            return this;
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