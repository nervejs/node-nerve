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

            [403, 404, 500].forEach(function (errorCode) {
                var templateErrorPath;

                if (this['templateError' + errorCode]) {
                    templateErrorPath = path.resolve(this.frontEndDir, this.baseTmplPath, this['templateError' + errorCode]);
                    if (this.app.getCfg('isClearTemplateCache')) {
                        delete require.cache[require.resolve(templateErrorPath)];
                    }
                    this['tmplError' + errorCode] = require(templateErrorPath);
                }
            }.bind(this));

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

            this.getResponsePromises()
                .then(function (response) {
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
                                    }, response, localesVars, vars);
                                    _.merge(vars.activeUser, this.activeUser.toJSON());

                                    if (this.isJsonAccept()) {
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

    getSprite: function (sprite) {
        return this.app.SPRITE_VERSIONS[sprite];
    },

    getCss: function () {
        return [];
    },

    getResponsePromises: function () {
        return new Promise(function (resolve, reject) {
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
                    var resultBeforeFilter = this.beforeFilter() || {};

                    if (resultBeforeFilter instanceof Promise) {
                        resultBeforeFilter
                            .then(function (result) {
                                if (!result.isAbort) {
                                    this.fetchApi()
                                        .then(resolve)
                                        .catch(reject);
                                }
                            }.bind(this))
                            .catch(reject);
                    } else {
                        if (!resultBeforeFilter.isAbort) {
                            this.fetchApi()
                                .then(resolve)
                                .catch(reject);
                        }
                    }
                }.bind(this))
                .catch(reject);
        }.bind(this));
    },

    getTemplateVars: function () {
        return new Promise(function (resolve) {
            resolve({
                request: {
                    url: this.options.request.url,
                    path: this.options.request.path,
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

    getErrorTemplateVars: function () {
        return Page.prototype.getTemplateVars.call(this);
    },

    getLogPrefix: function () {
        var user = this.activeUser && this.activeUser.get('email') ? this.activeUser.get('email') : 'unauthorized';

        return util.format('%s: %s', this.getName(), user);
    },

    fetchApi: function () {
        return new Promise(function (resolve, reject) {
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
    },

    beforeFilter: function () {
        return null;
    },

    log: function (message) {
        debug.log(util.format('%s: %s', this.getLogPrefix(), message));
    },

    time: function (message) {
        debug.time(this.options.request.id + message);
    },

    timeEnd: function (message) {
        debug.timeEnd(this.options.request.id + message, util.format('%s: %s', this.getLogPrefix(), message));
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

    getUserAgent: function () {
        return this.options.request && _.isFunction(this.options.request.get) ? this.options.request.get('User-Agent') || '' : '';
    },

    getReferrer: function () {
        return this.options.request.headers['referer'];
    },

    getContentType: function () {
        return this.isJsonAccept() ? 'application/json' : 'text/html';
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

    isJsonAccept: function () {
        return this.options.request.headers && this.options.request.headers.accept && this.options.request.headers.accept.indexOf('application/json') !== -1;
    },

    renderErrorPage: function (status) {
        if (this['tmplError' + status]) {
            this.getLocalesVars()
                .then(function (localesVars) {
                    this.getErrorTemplateVars()
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
                            debug.error(err, err.stack);
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

    redirect: function (location, status) {
        if (this.isJsonAccept()) {
            this.httpStatus = 200;

            this.send(JSON.stringify({
                isRedirect: true,
                location: location
            }));
        } else {
           this.httpStatus = status || 301;

            this.options.response.header({
                location: location
            });
            this.send();
        }
    },

    rewrite: function (url) {
        this.app.router.go(url, this.options.request, this.options.response);
    },

    send: function (content, contentType) {
        content = String(content || '');

        this.options.response.status(this.httpStatus || 200);

        this.options.response.header({
            'Cache-Control': 'no-cache, no-store',
            'Content-type': (contentType || this.getContentType()) + '; charset=utf-8'
        });

        this.timeEnd('PAGE PROCESSING');
        this.timeEnd('FULL PAGE TIME');

        this.processingTime = Date.now() - this.startProcessingTime;
        this.fullTime = Date.now() - this.startTime;

        this.options.response.send(content);

        this.emit('send', {
            text: content,
            status: this.httpStatus || 200
        });
    }

});

module.exports = Page;