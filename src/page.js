'use strict';

var _ = require('lodash'),
    NerveModule = require('./module'),
    path = require('path'),
    fs = require('fs'),
    request = require('request'),
    ActiveUser = require('./active-user'),
    url = require('url'),
    debug = require('./lib/debug'),
    Page;

Page = NerveModule.extend({

    baseTmplPath: './tmpl/commonjs/',
    pagesTmplPath: './tmpl/pages/commonjs/',

    templateHead: '',
    template: '',
    templateFooter: '',

    defaultOptions: {
        isNeedActiveUser: true,
        isShowErrorPage: true
    },

    init: function (app, options) {
        Page.super_.init.apply(this, arguments);

        debug.time('FULL PAGE TIME');

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
            debug.timeEnd('GET API RESPONSE');
            debug.time('PAGE PROCESSING');
            debug.time('GET LOCALES');

            this.getLocalesVars().then(function (localesVars) {
                debug.timeEnd('GET LOCALES');
                debug.time('TEMPLATE VARS');
                this.getTemplateVars()
                    .then(function (vars) {
                        vars = _.merge({}, responses[1], localesVars, vars, {
                            activeUser: this.activeUser.toJSON()
                        });
                        debug.timeEnd('TEMPLATE VARS');

                        if (this.options.request.headers.accept.indexOf('application/json') !== -1) {
                            this.send(JSON.stringify(vars));
                        } else {
                            this.getHtml(vars)
                                .then(function (html) {
                                    this.send(html);
                                }.bind(this))
                                .catch(function (err) {
                                    this.errorHandler(err);
                                }.bind(this));
                        }
                    }.bind(this))
                    .catch(function (err) {
                        this.errorHandler(err);
                    }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    initActiveUser: function () {
        this.activeUser = new ActiveUser({
            request: this.options.request,
            response: this.options.response
        });
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
        return new Promise(function (resolve) {
            resolve({
                css: this.getCss()
            });
        }.bind(this));
    },

    getHtml: function (vars) {
        var head,
            content,
            footer;

        debug.time('RENDER');

        return new Promise(function (resolve, reject) {
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
            ])
                .then(function () {
                    debug.timeEnd('RENDER');
                    resolve(head + content + footer);
                })
                .catch(function (err) {
                    reject(err);
                });
        }.bind(this));
    },

    errorHandler: function (err) {
        debug.error(err);

        this.options.response.status(500);
        if (this.app.getCfg('isTestServer')) {
            this.send(err.stack.replace(/\n/g, '<br/>'));
        } else {
            if (this.options.isShowErrorPage) {
                this.renderErrorPage(500);
            }
        }
    },

    renderErrorPage: function (status) {
        this.send('');
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