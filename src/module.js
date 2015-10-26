'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    fs = require('fs'),
    locales = require('./lib/locales'),
    debug = require('./lib/debug'),
    Page;

Page = NerveObject.extend({

    init: function (app, options) {
        this.options = _.assign({}, this.defaultOptions, options);
        this.app = app;

        return this;
    },

    getActiveUser: function () {
        return this.activeUser;
    },

    setActiveUser: function (activeUser) {
        this.activeUser = activeUser;

        return this;
    },

    getLocales: function () {
        return null;
    },

    readLocales: function (pathToFile) {
        var locales;

        return new Promise(function (resolve, reject) {
            fs.readFile(pathToFile, function (err, content) {
                if (err) {
                    debug.error(err);
                    reject(err);
                } else {
                    locales = JSON.parse(content.toString());
                    resolve(this.walkLocales(locales));
                }
            }.bind(this));
        }.bind(this));
    },

    walkLocales: function (locales) {
        var result = {};

        Object.keys(locales).forEach(function (key) {
            var item = locales[key];

            if (_.isString(item)) {
                result[key] = this.getText(item);
            } else if (_.isObject(item) && item.text && (item.vars || item.ctx)) {
                result[key] = this.getText(item.text, item.ctx, item.vars);
            } else if (_.isObject(item)) {
                result[key] = this.walkLocales(item);
            }
        }.bind(this));

        return result;
    },

    getText: function (message, ctx, params) {
        var localeStr,
            globalParams = this.getLocalesParams();

        if (_.isObject(ctx)) {
            params = ctx;
            ctx = '';
        }

        localeStr = locales.getText(message, this.activeUser.get('locale'), ctx) || message;

        if (params || globalParams) {
            params = _.merge({}, params, globalParams);

            Object.keys(params).forEach(function (item) {
                var reg = new RegExp('##' + item + '##', 'g');

                localeStr = localeStr.replace(reg, params[item]);
            });
        }

        return localeStr;
    },

    getLocalesParams: function () {
        return null;
    },

    getLocalesVars: function () {
        var currentLocale = this.activeUser.get('locale'),
            localesPromise,
            localesObject = {};

        if (!this.constructor.locales) {
            this.constructor.locales = {};
            this.constructor.localesJson = {};
        }

        return new Promise(function (resolve) {
            if (this.constructor.locales[currentLocale] && this.constructor.localesJson[currentLocale]) {
                resolve({
                    locales: this.constructor.locales[currentLocale],
                    localesJson: this.constructor.localesJson[currentLocale]
                });
            } else {
                localesPromise = this.getLocales();

                if (localesPromise) {
                    localesPromise.then(function (locales) {
                        if (Array.isArray(locales)) {
                            locales.forEach(function (localesItem) {
                                localesObject = _.merge(localesObject, localesItem);
                            });
                        } else {
                            localesObject = locales;
                        }

                        this.constructor.locales[currentLocale] = localesObject;
                        this.constructor.localesJson[currentLocale] = JSON.stringify(localesObject);

                        resolve({
                            locales: this.constructor.locales[currentLocale],
                            localesJson: this.constructor.localesJson[currentLocale]
                        });
                    }.bind(this));
                } else {
                    resolve({});
                }
            }
        }.bind(this));
    }

});

module.exports = Page;