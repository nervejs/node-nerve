import _ = require('lodash');
import url = require('url');
import util = require('util');
import path = require('path');
import debug = require('./lib/debug');
import NerveModule = require('./module');
import {NerveApp} from './app';
import ActiveUser = require('./active-user');
import NerveApi = require("./api");

class NervePage extends NerveModule {

    protected frontEndDir: string;
    protected httpStatus: number;

    protected baseTmplPath: string = '';
    protected pagesTmplPath: string = '';

    protected templateHead: string = '';
    protected template: string = '';
    protected templateFooter: string = '';

    protected templateError404: string = '';
    protected templateError500: string = '';

    protected tmplHead: Function;
    protected tmplFooter: Function;
    protected tmpl: Function;

    protected startTime: number;
    protected startProcessingTime: number;
    protected processingTime: number;
    protected fullTime: number;

    protected Api: typeof NerveApi;
    protected api: NerveApi;

    protected activeUser: ActiveUser;

    constructor(app: NerveApp, options?: any) {
        super(app, options);

        this.init();

        let templateHeadPath: string,
            templateFooterPath: string,
            templatePath: string;

        try {
            _.merge(this.options, {
                isNeedActiveUser: true,
                isShowErrorPage: true,
                isForceShowErrorPage: false,
                type: null,
                name: null
            }, options);

            this.startTime = Date.now();
            this.time('FULL PAGE TIME');
            this.log(`${this.getRequestMethod()} ${this.getRequestUrl()}`);

            this.frontEndDir = this.getFrontendDir();

            if (this.templateHead) {
                templateHeadPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateHead);
                this.tmplHead = this.getTemplate(templateHeadPath);
            }

            if (this.templateFooter) {
                templateFooterPath = path.resolve(this.frontEndDir, this.baseTmplPath, this.templateFooter);
                this.tmplFooter = this.getTemplate(templateFooterPath);
            }

            if (this.template) {
                templatePath = path.resolve(this.frontEndDir, this.pagesTmplPath, this.template);
                this.tmpl = this.getTemplate(templatePath);
            }

            [403, 404, 500].forEach((errorCode: number) => {
                let templateErrorPath: string,
                    self: any = this;

                if (self['templateError' + errorCode]) {
                    templateErrorPath = path.resolve(this.frontEndDir, this.baseTmplPath, self['templateError' + errorCode]);
                    self['tmplError' + errorCode] = this.getTemplate(templateErrorPath);
                }
            });

            this.initActiveUser();

            this.time('GET API RESPONSE');

            if (this.Api) {
                this.api = new this.Api(this, {
                    request: this.options.request,
                    response: this.options.response
                });
                this.api.setActiveUser(this.activeUser);
            } else {
                this.debug('API IS EMPTY');
            }

            this.getResponsePromises()
                .then((response: any) => {
                    this.startProcessingTime = Date.now();
                    this.timeEnd('GET API RESPONSE');
                    this.time('PAGE PROCESSING');
                    this.time('GET LOCALES');

                    this.getLocalesVars()
                        .then((localesVars: any) => {
                            this.timeEnd('GET LOCALES');
                            this.time('TEMPLATE VARS');
                            this.getTemplateVars()
                                .then((vars: any) => {
                                    this.timeEnd('TEMPLATE VARS');

                                    vars = _.assign({
                                        activeUser: {}
                                    }, response, localesVars, vars);
                                    _.merge(vars.activeUser, this.activeUser.toJSON());

                                    if (this.isJsonAccept()) {
                                        this.send(JSON.stringify(vars));
                                    } else {
                                        this.getHtml(vars)
                                            .then((html: string) => this.send(html))
                                            .catch((err: Error) => this.errorHandler(err));
                                    }
                                })
                                .catch((err: Error) => this.errorHandler(err));
                        })
                        .catch((err: Error) => this.errorHandler(err));
                })
                .catch((err: Error) => this.errorHandler(err));
        } catch (err) {
            this.errorHandler(err);
        }
    }

    protected init(): void {
        return void(0);
    }

    getTemplate(templatePath: string): Function {
        let tmpl: Function;

        if (this.app.getCfg('isClearTemplateCache') && require.cache) {
            delete require.cache[require.resolve(templatePath)];
        }
        tmpl = require(templatePath);

        return tmpl;
    }

    initActiveUser() {
        this.activeUser = new ActiveUser(this.app, {
            request: this.options.request,
            response: this.options.response
        });
    }

    /**
     * Получение названия страницы
     *
     * @returns {String}
     */
    getName(): string {
        return null;
    }

    getFrontendDir(): string {
        return this.app.getCfg('frontendDir');
    }

    getType(): string {
        return this.options.type;
    }

    getTitle(): string {
        return 'NerveJS Application';
    }

    getScheme(): string {
        return this.options.request.protocol;
    }

    getRequestParam(paramName: string): string {
        return this.options.request.params[paramName];
    }

    getStaticHost(): string {
        return '//' + this.app.getCfg('staticHost');
    }

    getJsHost(): string {
        return '//' + this.app.getCfg('jsHost');
    }

    getCssHost(): string {
        return '//' + this.app.getCfg('cssHost');
    }

    getCssVersion(cssName: string): string {
        return this.app.getCfg('isUseCssHash') ? (this.app.getCssVersions()[cssName] || cssName) : cssName;
    }

    getJsVersion(jsName: string): string {
        return this.app.getCfg('isUseJsHash') ? (this.app.getJsVersions()[jsName] || jsName) : jsName;
    }

    getCssUrl(cssName: string): string {
        let cssUrl = url.resolve(this.getCssHost(), this.getCssVersion(cssName));

        if (!/\.css$/.test(cssUrl)) {
            cssUrl += '.css';
        }

        return cssUrl;
    }

    getJsUrl(jsName: string): string {
        let jsUrl;

        if (this.app.getCfg('isUseJsMin')) {
            jsUrl = url.resolve(this.getJsHost(), 'min/') + this.getJsVersion(jsName) + '.js';
        } else {
            jsUrl = url.resolve(this.getJsHost(), this.getJsVersion(jsName) + '.js');
        }

        return jsUrl;
    }

    getSprite(sprite: string): string {
        return this.app.getSpriteVersions()[sprite];
    }

    getCss(): any[] {
        return [];
    }

    getResponsePromises(): Promise<any> {
        return new Promise((resolve, reject) => {
            new Promise((userResolve: () => void, userReject: () => void) => {
                if (this.options.isNeedActiveUser) {
                    this.activeUser.request()
                        .then(userResolve)
                        .catch(userReject);
                } else {
                    userResolve();
                }
            })
                .then(() => {
                    let resultBeforeFilter: any = this.beforeFilter() || {};

                    if (resultBeforeFilter instanceof Promise) {
                        resultBeforeFilter
                            .then((result: any) => {
                                if (!result.isAbort) {
                                    this.fetchApi()
                                        .then(resolve)
                                        .catch(reject);
                                }
                            })
                            .catch(reject);
                    } else {
                        if (!resultBeforeFilter.isAbort) {
                            this.fetchApi()
                                .then(resolve)
                                .catch(reject);
                        }
                    }
                })
                .catch(reject);
        });
    }

    getTemplateVars() {
        return new Promise((resolve: Function, reject: () => void) => {
            this.getLocalesVars()
                .then(() => {
                    resolve({
                        request: {
                            url: this.getRequestUrl(),
                            path: this.options.request.path,
                            get: this.options.request.query
                        },
                        css: this.getCss(),
                        hosts: {
                            static: this.getStaticHost(),
                            staticJs: this.getJsHost(),
                            staticCss: this.getCssHost()
                        },
                        pageTitle: this.getTitle(),
                        routes: this.app.getPublicRoutes()
                    });
                })
                .catch(reject);
        });
    }

    getErrorTemplateVars() {
        return NervePage.prototype.getTemplateVars.call(this);
    }

    getLogPrefix() {
        let date: string = (new Date()).toString(),
            pageName: string = this.getName(),
            user: string = this.activeUser && this.activeUser.get('email') ? this.activeUser.get('email') : 'unauthorized';

        return `${date}: ${pageName}: ${user}`;
    }

    getRequestId(): string {
        return this.options.request && this.options.request.id ? this.options.request.id : null;
    }

    getRequestMethod(): string {
        return this.options.request && this.options.request.method ? this.options.request.method : null;
    }

    getRequestUrl(): string {
        return this.options.request && this.options.request.url ? this.options.request.url : null;
    }

    fetchApi(): Promise<any> {
        return new Promise((resolve: () => void, reject: () => void) => {
            if (this.api) {
                this.api.fetch()
                    .then(resolve)
                    .catch(reject);
            } else {
                resolve();
            }
        });
    }

    beforeFilter(): any {
        return null;
    }

    errorLog(message: string) {
        debug.error(`${this.getLogPrefix()}: ${message}`);
    }

    log(message: string) {
        debug.log(`${this.getLogPrefix()}: ${message}`);
    }

    debug(message: string) {
        debug.debug(`${this.getLogPrefix()}: ${message}`);
    }

    time(message: string) {
        debug.time(this.getRequestId() + message);
    }

    timeEnd(message: string) {
        debug.timeEnd(this.getRequestId() + message, `${this.getLogPrefix()}: ${message}`);
    }

    getHtml(vars: any, contentTmpl?: Function): Promise<any> {
        let head: string,
            content: string,
            footer: string;

        this.time('RENDER');

        return new Promise((resolve: (html: string) => void, reject: () => void) => {
            Promise.all([
                new Promise((resolve: Function) => {
                    this.time('RENDER HEAD');
                    head = this.tmplHead ? this.tmplHead(vars) : '';
                    this.timeEnd('RENDER HEAD');

                    resolve(head);
                }),

                new Promise((resolve: Function) => {
                    let tmpl: Function = _.isFunction(contentTmpl) ? contentTmpl : this.tmpl;

                    if (tmpl) {
                        this.time('RENDER CONTENT');
                        content = tmpl(vars);
                        this.timeEnd('RENDER CONTENT');
                    } else {
                        this.debug('EMPTY CONTENT TEMPLATE');
                        content = '';
                    }

                    resolve(content);
                }),

                new Promise((resolve: Function) => {
                    this.time('RENDER FOOTER');
                    footer = this.tmplFooter ? this.tmplFooter(vars) : '';
                    this.timeEnd('RENDER FOOTER');

                    resolve(footer);
                })
            ])
                .then(() => {
                    this.timeEnd('RENDER');
                    resolve(head + content + footer);
                })
                .catch(reject);
        });
    }

    getUserAgent(): string {
        return this.options.request && _.isFunction(this.options.request.get) ? this.options.request.get('User-Agent') || '' : '';
    }

    getReferrer(): string {
        return this.options.request.headers.referer;
    }

    getContentType(): string {
        return this.isJsonAccept() ? 'application/json' : 'text/html';
    }

    errorHandler(err: any) {
        let statusCode = err.statusCode || 500;

        if (err.name && err.name === 'UpstreamResponseError') {
            this.api.getRequests().forEach((request) => {
                if (request.getStatusCode() !== '200') {
                    statusCode = request.getStatusCode();
                    this.errorLog(`${err.name} ${request.getStatusCode()} ${request.getUpstream()} (${request.getHostname()}:${request.getPort()}) ${request.getMethod()} ${request.getPath()}`);
                }
            });
        } else {
            this.errorLog(`${__filename} : ${err.stack ? err + err.stack : err}`);
        }

        this.options.response.status(statusCode);
        this.httpStatus = statusCode;

        if (this.isJsonAccept()) {
            this.getLocalesVars()
                .then((localesVars) => {
                    this.getErrorTemplateVars()
                        .then((vars: any) => {
                            this.send(JSON.stringify(_.assign({}, vars, localesVars, {
                                activeUser: this.activeUser.toJSON(),
                                statusCode: statusCode
                            })), null, 200);
                        })
                        .catch((err: Error) => {
                            this.errorLog(err.toString());
                            this.send('');
                        });
                })
                .catch((err) => {
                    this.errorLog(err);
                    this.send('');
                });
        } else {
            if (this.app.getCfg('isTestServer') && !this.isForceShowErrorPage()) {
                this.send(err + '<br/>' + err.stack.replace(/\n/g, '<br/>'), 'text/html');
            } else {
                if (this.isShowErrorPage()) {
                    this.renderErrorPage(statusCode);
                } else {
                    this.send('');
                }
            }
        }

        this.errorLog(`Error ${this.httpStatus} ${this.getRequestMethod()} ${this.getRequestUrl()}`);

        return this;
    }

    isShowErrorPage(): boolean {
        return !!this.options.isShowErrorPage;
    }

    isForceShowErrorPage() {
        return !!this.options.isForceShowErrorPage;
    }

    isJsonAccept(): boolean {
        return this.options.request.headers && this.options.request.headers.accept && this.options.request.headers.accept.indexOf('application/json') !== -1;
    }

    renderErrorPage(status: number) {
        let self: any = this;

        if (self['tmplError' + status]) {
            this.getLocalesVars()
                .then((localesVars: any) => {
                    this.getErrorTemplateVars()
                        .then((vars: any) => {
                            this.getHtml(_.assign({}, vars, localesVars, {
                                activeUser: this.activeUser.toJSON(),
                                statusCode: status
                            }), self['tmplError' + status])
                                .then((html: string) => this.send(html))
                                .catch((err: Error) => this.send(''));
                        })
                        .catch((err: Error) => {
                            this.errorLog(`${err.toString()} ${err.stack}`);
                            this.send('');
                        });
                })
                .catch((err: Error) => {
                    this.errorLog(err.toString());
                    this.send('');
                });
        } else {
            this.send('');
        }
    }

    redirect(location: string, status: number) {
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
    }

    rewrite(url: string) {
        this.app.getRouter().go(url, this.options.request, this.options.response);
    }

    send(content?: string, contentType?: string, status?: number) {
        content = String(content || '');

        this.options.response.status(status || this.httpStatus || 200);

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

}

export = NervePage;