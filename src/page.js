'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    path = require('path'),
    fs = require('fs'),
    request = require('request'),
    ActiveUser = require('./active-user'),
    url = require('url'),
    locales = require('./lib/locales'),
    debug = require('./lib/debug'),
    Page;

Page = NerveObject.extend({

    baseTmplPath: './tmpl/commonjs/',
    pagesTmplPath: './tmpl/pages/commonjs/',

    templateHead: '',
    template: '',
    templateFooter: '',

    defaultOptions: {
        isNeedActiveUser: true
    },

    init: function (app, options) {
        debug.time('FULL PAGE TIME');

        this.app = app;
        this.options = _.assign({}, this.defaultOptions, options);

        this.frontEndDir = this.app.getCfg('frontendDir');

        if (this.templateHead) {
            this.templateHeadPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateHead);
            if (this.app.getCfg('isClearTemplateCache')) {
                delete require.cache[require.resolve(this.templateHeadPath)];
            }
            this.tmplHead = require(this.templateHeadPath);
        }

        if (this.templateFooter) {
            this.templateFooterPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateFooter);
            if (this.app.getCfg('isClearTemplateCache')) {
                delete require.cache[require.resolve(this.templateFooterPath)];
            }
            this.tmplFooter = require(this.templateFooterPath);
        }

        this.templatePath = path.resolve(this.frontEndDir, this.pagesTmplPath, this.template);
        if (this.app.getCfg('isClearTemplateCache')) {
            delete require.cache[require.resolve(this.templatePath)];
        }
        this.tmpl = require(this.templatePath);

        //this.isUseMin = false;
        //this.isUseHash = false;

        this.initActiveUser();

        debug.time('GET API RESPONSE');

        if (this.Api) {
            this.api = new this.Api(this, {
                request: this.options.request,
                response: this.options.response
            });
        } else {
            debug.log('API IS EMPTY');
        }

        Promise.all(this.getResponsePromises()).then(function (responses) {
            var vars;

            debug.timeEnd('GET API RESPONSE');
            debug.time('PAGE PROCESSING');

            this.getLocalesVars().then(function (localesVars) {
                debug.time('TEMPLATE VARS');
                vars = _.merge({}, responses[1], localesVars, this.getTemplateVars(), {
                    activeUser: this.activeUser.toJSON()
                });
                debug.timeEnd('TEMPLATE VARS');

                if (this.options.request.headers.accept.indexOf('application/json') !== -1) {
                    this.send(JSON.stringify(vars));
                } else {
                    this.getHtml(vars).then(function (html) {
                        this.send(html);
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    },

    initActiveUser: function () {
        this.activeUser = new ActiveUser({
            request: this.options.request,
            response: this.options.response
        });
    },

    getActiveUser: function () {
        return this.activeUser;
    },

    getScheme: function () {
        return 'http';
    },

    getStaticHost: function () {
        return '//' + this.app.getCfg('staticHost');
    },

    getJsHost: function () {
        return '//' + this.app.getCfg('jsHost');
    },

    getCssHost: function () {
        return '//' + this.app.getCfg('cssHost');
    },

    getCssVersion: function (cssName) {
        return this.isUseHash ? '_' + Math.random().toString(34).slice(2) : '';
    },

    getJsVersion: function (cssName) {
        return this.isUseHash ? '_' + Math.random().toString(34).slice(2) : '';
    },

    getCssUrl: function (cssName) {
        return url.resolve(this.getCssHost(), cssName + this.getCssVersion(cssName) + '.css');
    },

    getJsUrl: function (jsName) {
        var jsUrl;

        if (this.isUseMin) {
            jsUrl = url.resolve(this.getJsHost(), 'min', jsName + this.getJsVersion(jsName) + '.js');
        } else {
            jsUrl = url.resolve(this.getJsHost(), jsName + this.getJsVersion(jsName) + '.js');
        }

        return jsUrl;
    },

    getCss: function () {
        return [];
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
        var localeStr;

        if (_.isObject(ctx)) {
            params = ctx;
            ctx = '';
        }

        localeStr = locales.getText(message, this.activeUser.get('locale'), ctx) || message;

        if (params) {
            Object.keys(params).forEach(function (item) {
                var reg = new RegExp('##' + item + '##', 'g');

                localeStr = localeStr.replace(reg, params[item]);
            });
        }

        return localeStr;
    },

    getResponsePromises: function () {
        var promises = [];

        if (this.options.isNeedActiveUser) {
            promises.push(this.activeUser.request());
        }

        if (this.api) {
            promises.push(this.api.fetch());
        }

        return promises;
    },

    getTemplateVars: function () {
        return {
            css: this.getCss()
        };
    },

    getLocalesVars: function () {
        var currentLocale = this.activeUser.get('locale'),
            localesPromise,
            localesObject = {};

        debug.time('GET LOCALES');

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

                debug.timeEnd('GET LOCALES');
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

                        debug.timeEnd('GET LOCALES');
                    }.bind(this));
                } else {
                    resolve({});
                }
            }
        }.bind(this));
    },

    getHtml: function (vars) {
        var head,
            content,
            footer;

        debug.time('RENDER');

        return new Promise(function (resolve) {
            Promise.all([
                new Promise(function (resolve) {
                    debug.time('RENDER HEAD');
                    head = this.tmplHead ? this.tmplHead(vars) : '';
                    debug.timeEnd('RENDER HEAD');
                    resolve(head);
                }.bind(this)),
                new Promise(function (resolve) {
                    debug.time('RENDER CONTENT');
                    content = this.tmpl(vars);
                    debug.timeEnd('RENDER CONTENT');
                    resolve(content);
                }.bind(this)),
                new Promise(function (resolve) {
                    debug.time('RENDER FOOTER');
                    footer = this.tmplFooter ? this.tmplFooter(vars) : '';
                    debug.timeEnd('RENDER FOOTER');
                    resolve(footer);
                }.bind(this))
            ]).then(function () {
                debug.timeEnd('RENDER');
                resolve(head + content + footer);
            });
        }.bind(this));
    },

    send: function (html) {
        this.options.response.header({
            'Cache-Control': 'no-cache, no-store',
            'Content-type': 'text/html; charset=utf-8'
        });

        debug.timeEnd('PAGE PROCESSING');
        debug.timeEnd('FULL PAGE TIME');
        this.options.response.send(html);
    }

});

module.exports = Page;