'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    path = require('path'),
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
            this.tmplHead = require(this.templateHeadPath);
        }

        if (this.templateFooter) {
            this.templateFooterPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateFooter);
            this.tmplFooter = require(this.templateFooterPath);
        }

        this.templatePath = path.resolve(this.frontEndDir, this.pagesTmplPath, this.template);
        this.tmpl = require(this.templatePath);

        //this.isUseMin = false;
        //this.isUseHash = false;

        this.initActiveUser();

        debug.time('GET API RESPONSE');

        Promise.all(this.getResponsePromises()).then(function (responses) {
            var vars;

            debug.timeEnd('GET API RESPONSE');
            debug.time('PAGE PROCESSING');

            debug.time('TEMPLATE VARS');
            vars = this.getTemplateVars();
            debug.timeEnd('TEMPLATE VARS');

            vars = _.assign({}, responses[0], vars, {
                activeUser: this.activeUser.toJSON()
            });

            this.getHtml(vars).then(function (html) {
                this.send(html);
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
        return {};
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
        var activeUserPromise;

        if (this.options.isNeedActiveUser) {
            activeUserPromise = this.activeUser.request();
        }

        return [
            this.getResponse(activeUserPromise),
            activeUserPromise
        ];
    },

    getTemplateVars: function () {
        var locales,
            localesJson;

        debug.time('GET LOCALES');
        locales = this.constructor.locales || this.getLocales();
        this.constructor.locales = locales;

        localesJson = this.constructor.localesJson || JSON.stringify(locales);
        this.constructor.localesJson = localesJson;
        debug.timeEnd('GET LOCALES');

        return {
            css: this.getCss(),
            locales: locales,
            localesJson: localesJson
        };
    },

    adapter: function (response) {
        return response;
    },

    getResponse: function () {
        return new Promise(function (resolve) {
            request({
                url: url.resolve(this.app.getCfg('apiHost'), this.url)
            }, function (error, response, body) {
                 resolve(JSON.parse(body));
            });
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