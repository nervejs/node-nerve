'use strict';

var _ = require('lodash'),
    url = require('url'),
    util = require('util'),
    path = require('path'),
    debug = require('./lib/debug'),
    NerveModule = require('./module'),
    ActiveUser = require('./active-user'),
    Page;

Page = NerveModule.extend({

    baseTmplPath: '',
    pagesTmplPath: '',

    templateHead: '',
    template: '',
    templateFooter: '',

    templateError404: '',
    templateError500: '',

    defaultOptions: {
        isNeedActiveUser: true,
        isShowErrorPage: true,
        type: null,
        name: null
    },

    init: function (app, options) {
        var templateHeadPath,
            templateFooterPath,
            templatePath,
            templateError404Path,
            templateError500Path;

        try {
            Page.super_.init.apply(this, arguments);

            this.startTime = Date.now();
            this.time('FULL PAGE TIME');

            this.frontEndDir = this.getFrontendDir();

            if (this.templateHead) {
                templateHeadPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateHead);
                if (this.app.getCfg('isClearTemplateCache')) {
                    delete require.cache[require.resolve(templateHeadPath)];
                }
                this.tmplHead = require(templateHeadPath);
            }

            if (this.templateFooter) {
                templateFooterPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateFooter);
                if (this.app.getCfg('isClearTemplateCache')) {
                    delete require.cache[require.resolve(templateFooterPath)];
                }
                this.tmplFooter = require(templateFooterPath);
            }

            if (this.template) {
                templatePath = path.resolve(this.frontEndDir, this.pagesTmplPath, this.template);
                if (this.app.getCfg('isClearTemplateCache')) {
                    delete require.cache[require.resolve(templatePath)];
                }
                this.tmpl = require(templatePath);
            }

            if (this.templateError404) {
                templateError404Path = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateError404);
                if (this.app.getCfg('isClearTemplateCache')) {
                    delete require.cache[require.resolve(templateError404Path)];
                }
                this.tmplError404 = require(templateError404Path);
            }

            if (this.templateError500) {
                templateError500Path = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateError500);
                if (this.app.getCfg('isClearTemplateCache')) {
                    delete require.cache[require.resolve(templateError500Path)];
                }
                this.tmplError500 = require(templateError500Path);
            }

            this.initActiveUser();

            this.time('GET API RESPONSE');

            if (this.Api) {
                this.api = new this.Api(this, {
                    request: this.options.request,
                    response: this.options.response
                });
                this.api.setActiveUser(this.activeUser);
            } else {
                this.log('API IS EMPTY');
            }

            Promise.all(this.getResponsePromises())
                .then(function (responses) {
                    this.startProcessingTime = Date.now();
                    this.timeEnd('GET API RESPONSE');
                    this.time('PAGE PROCESSING');
                    this.time('GET LOCALES');

                    this.getLocalesVars()
                        .then(function (localesVars) {
                            this.timeEnd('GET LOCALES');
                            this.time('TEMPLATE VARS');
                            this.getTemplateVars()
                                .then(function (vars) {
                                    this.timeEnd('TEMPLATE VARS');

                                    vars = _.assign({
                                        activeUser: {}
                                    }, responses[0], localesVars, vars);
                                    _.merge(vars.activeUser, this.activeUser.toJSON());

                                    if (this.options.request.headers && this.options.request.headers.accept && this.options.request.headers.accept.indexOf('application/json') !== -1) {
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
                        }.bind(this))
                        .catch(function (err) {
                            this.errorHandler(err);
                        }.bind(this));
                }.bind(this))
                .catch(function (err) {
                    this.errorHandler(err);
                }.bind(this));
        } catch (err) {
            this.errorHandler(err);
        }
    },

    initActiveUser: function () {
        this.activeUser = new ActiveUser({
            request: this.options.request,
            response: this.options.response
        });
    },

    getFrontendDir: function () {
        return this.app.getCfg('frontendDir');
    },

    getType: function () {
        return this.options.type;
    },

    getName: function () {
        return this.options.name;
    },

    getTitle: function () {
        return 'NerveJS Application';
    },

    getScheme: function () {
        return this.options.request.protocol;
    },

    getRequestParam: function (paramName) {
        return this.options.request.params[paramName];
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
        return this.app.getCfg('isUseCssHash') ? (this.app.CSS_VERSIONS[cssName] || cssName) : cssName;
    },

    getJsVersion: function (jsName) {
        return this.app.getCfg('isUseJsHash') ? (this.app.JS_VERSIONS[jsName] || jsName) : jsName;
    },

    getCssUrl: function (cssName) {
        var cssUrl = url.resolve(this.getCssHost(), this.getCssVersion(cssName));

        if (!/\.css$/.test(cssUrl)) {
            cssUrl += '.css';
        }

        return cssUrl;
    },

    getJsUrl: function (jsName) {
        var jsUrl;

        if (this.app.getCfg('isUseJsMin')) {
            jsUrl = url.resolve(this.getJsHost(), 'min/') + this.getJsVersion(jsName) + '.js';
        } else {
            jsUrl = url.resolve(this.getJsHost(), this.getJsVersion(jsName) + '.js');
        }

        return jsUrl;
    },

    getCss: function () {
        return [];
    },

    getResponsePromises: function () {
        return [new Promise(function (resolve, reject) {
            new Promise(function (userResolve, userReject) {
                if (this.options.isNeedActiveUser) {
                    this.activeUser.request()
                        .then(userResolve)
                        .catch(userReject);
                } else {
                    userResolve();
                }
            }.bind(this))
                .then(function () {
                    if (this.api) {
                        this.api.fetch()
                            .then(function (response) {
                                resolve(response);
                            })
                            .catch(reject);
                    } else {
                        resolve();
                    }
                }.bind(this));
        }.bind(this))];
    },

    getTemplateVars: function () {
        return new Promise(function (resolve) {
            resolve({
                request: {
                    get: this.options.request.query
                },
                css: this.getCss(),
                hosts: {
                    staticJs: this.getJsHost(),
                    staticCss: this.getCssHost()
                },
                pageTitle: this.getTitle(),
                routes: this.app.getPublicRoutes()
            });
        }.bind(this));
    },

    getLogPrefix: function () {
        var user = this.activeUser && this.activeUser.get('email') ? this.activeUser.get('email') : 'unauthorized';

        return util.format('%s: %s', this.getName(), user);
    },

    log: function (message) {
        debug.log(util.format('%s: %s', this.getLogPrefix(), message));
    },

    time: function (message) {
        debug.time(util.format('%s: %s', this.getLogPrefix(), message));
    },

    timeEnd: function (message) {
        debug.timeEnd(util.format('%s: %s', this.getLogPrefix(), message));
    },

    getHtml: function (vars, contentTmpl) {
        var head,
            content,
            footer;

        this.time('RENDER');

        return new Promise(function (resolve, reject) {
            Promise.all([
                new Promise(function (resolve) {
                    this.time('RENDER HEAD');
                    head = this.tmplHead ? this.tmplHead(vars) : '';
                    this.timeEnd('RENDER HEAD');
                    resolve(head);
                }.bind(this)),
                new Promise(function (resolve) {
                    var tmpl = _.isFunction(contentTmpl) ? contentTmpl : this.tmpl;

                    if (tmpl) {
                        this.time('RENDER CONTENT');
                        content = tmpl(vars);
                        this.timeEnd('RENDER CONTENT');
                    } else {
                        this.log('EMPTY CONTENT TEMPLATE');
                        content = '';
                    }
                    resolve(content);
                }.bind(this)),
                new Promise(function (resolve) {
                    this.time('RENDER FOOTER');
                    footer = this.tmplFooter ? this.tmplFooter(vars) : '';
                    this.timeEnd('RENDER FOOTER');
                    resolve(footer);
                }.bind(this))
            ])
                .then(function () {
                    this.timeEnd('RENDER');
                    resolve(head + content + footer);
                }.bind(this))
                .catch(function (err) {
                    reject(err);
                });
        }.bind(this));
    },

    getContentType: function () {
        return 'text/html';
    },

    errorHandler: function (err) {
        if (err.name && err.name === 'UpstreamResponseError') {
            this.api.getRequests().forEach(function (request) {
                if (request.getStatusCode() !== '200') {
                    debug.error(util.format('%s: %s', err.name, request.getPath()));
                }
            });
        } else {
            debug.error(err.stack ? err + err.stack : err);
        }

        this.options.response.status(err.statusCode || 500);
        this.httpStatus = err.statusCode || 500;

        if (this.app.getCfg('isTestServer')) {
            this.send(err + '<br/>' + err.stack.replace(/\n/g, '<br/>'), 'text/html');
        } else {
            if (this.options.isShowErrorPage) {
                this.renderErrorPage(err.statusCode || 500);
            } else {
                this.send('');
            }
        }
    },

    isShowErrorPage: function () {
        return !!this.options.isShowErrorPage;
    },

    renderErrorPage: function (status) {
        if (this['tmplError' + status]) {
            this.getLocalesVars()
                .then(function (localesVars) {
                    this.getTemplateVars()
                        .then(function (vars) {
                            this.getHtml(_.assign({}, vars, localesVars, {
                                activeUser: this.activeUser.toJSON(),
                                statusCode: status
                            }), this['tmplError' + status])
                                .then(function (html) {
                                    this.send(html);
                                }.bind(this))
                                .catch(function (err) {
                                    this.send('');
                                }.bind(this));
                        }.bind(this))
                        .catch(function (err) {
                            debug.error(err.toString());
                            this.send('');
                        }.bind(this));
                }.bind(this))
                .catch(function (err) {
                    debug.error(err.toString());
                    this.send('');
                }.bind(this));
        } else {
            this.send('');
        }
    },

    send: function (html, contentType) {
        this.options.response.header({
            'Cache-Control': 'no-cache, no-store',
            'Content-type': (contentType || this.getContentType()) + '; charset=utf-8'
        });

        this.timeEnd('PAGE PROCESSING');
        this.timeEnd('FULL PAGE TIME');

        this.processingTime = Date.now() - this.startProcessingTime;
        this.fullTime = Date.now() - this.startTime;

        this.options.response.send(html);

        this.emit('send', {
            text: html,
            status: this.httpStatus || 200
        });
    }

});

module.exports = Page;