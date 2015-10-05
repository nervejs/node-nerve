'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    path = require('path'),
    request = require('request'),
    ActiveUser = require('./active-user'),
    url = require('url'),
    locales = require('./lib/locales'),
    Page;

Page = NerveObject.extend({

    baseTmplPath: './tmpl/commonjs/',
    pagesTmplPath: './tmpl/pages/commonjs/',

    templateHead: '',
    template: '',
    templateFooter: '',

    init: function (app, options) {
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

        Promise.all(this.getResponsePromises()).then(function (responses) {
            var vars,
                html;

            try {
                vars = _.assign({}, responses[0], this.getTemplateVars(), {
                    activeUser: this.activeUser.toJSON()
                });
                html = this.getHtml(vars);
            } catch (err) {
                console.log(err.stack);
            }

            this.send(html);
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
        return this.app.getCfg('staticHost');
    },

    getJsHost: function () {
        return this.app.getCfg('jsHost');
    },

    getCssHost: function () {
        return this.app.getCfg('cssHost');
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
        return [
            this.getResponse(),
            this.activeUser.request()
        ];
    },

    getTemplateVars: function () {
        return {
            css: this.getCss()
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
        var head = this.tmplHead ? this.tmplHead(vars) : '',
            content = this.tmpl(vars),
            footer = this.tmplFooter ? this.tmplFooter(vars) : '';

        return head + content + footer;
    },

    send: function (html) {
        this.options.response.header({
            'Cache-Control': 'no-cache, no-store',
            'Content-type': 'text/html; charset=utf-8'
        });

        this.options.response.send(html);
    }

});

module.exports = Page;