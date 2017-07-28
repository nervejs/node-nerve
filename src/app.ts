'use strict';

import _ = require('lodash');
import http = require('http');
import NerveObject = require('./object');
import fs = require('fs');
import uuid = require('node-uuid');
import express = require('express');
import cookieParser = require('cookie-parser');
import Router = require('./router');
import NervePage = require('./page');
import NerveApi = require('./api');
import Module = require('./module');
import NerveActiveUser = require('./active-user');
import handlebarsHelpers = require('./lib/handlebars-helpers/main');
import NerveHelpers = require('./lib/helpers');
import debug = require('./lib/debug');
import locales = require('./lib/locales');
import NerveProperty = require('./lib/property');
import Handlebars = require('handlebars');


class NerveApp extends NerveObject {

    JS_VERSIONS: any = {};
    CSS_VERSIONS: any = {};
    SPRITE_VERSIONS: any = {};

    protected server: express.Express;
    protected connection: http.Server;
    protected isReady: boolean = false;
    protected routes: any = {};
    protected publicRoutes: any = {};
    config: any = {};
    protected allConfig: any = {};
    protected router: Router;
    protected environment: string;
    protected workerIndex: number;

    constructor() {
        super();

        this.server = express();

        this.server.enable('trust proxy');
        this.server.enable('case sensitive routing');
        this.server.enable('strict routing');
        this.server.disable('x-powered-by');
        this.server.disable('etag');

        this.server.use((req: any, res: express.Response, next: express.NextFunction) => {
            req.id = uuid.v4();
            next();
        });

        this.server.use(cookieParser());

        this.router = new Router(this);

        this.environment = process.env.NODE_NERVE_ENV || 'dev';

        this.readCfg()
            .then(() => {
                debug.setLevel(this.getCfg('logLevel'));
                locales.init(this);

                if (this.getCfg('localStatic')) {
                    this.server.use(express.static(this.getCfg('localStatic')));
                }

                this.isReady = true;
                this.emit('ready');
            })
            .catch((err: Error) => debug.error(err.toString()));
    }

    getServer(): express.Express {
        return this.server;
    }

    getRouter(): Router {
        return this.router;
    }

    getJsVersions(): any {
        return this.JS_VERSIONS;
    }

    getCssVersions(): any {
        return this.CSS_VERSIONS;
    }

    getSpriteVersions(): any {
        return this.SPRITE_VERSIONS;
    }

    listen(port: number, host: string, callback: Function) {
        this.connection = this.server.listen(port, host, callback);
        return this.connection;
    }

    close() {
        this.connection.close();
    }

    route(routes: any) {
        if (routes.public) {
            this.routes = _.assign(this.routes, routes.public);
            this.publicRoutes = _.assign(this.publicRoutes, routes.public);
        }

        if (routes.protected) {
            this.routes = _.assign(this.routes, routes.protected);
        }

        if (!routes.public && !routes.protected) {
            this.routes = _.assign(this.routes, routes);
            this.publicRoutes = _.assign(this.publicRoutes, routes);
        }

        Object.keys(this.routes).forEach((url: string) => this.router.get(url, this.routes[url]));
    }

    env(env: string) {
        this.environment = env;

        if (this.allConfig) {
            this.config = this.allConfig[this.environment];
        }
    }

    readCfg(): Promise<any> {
        return new Promise((resolve: Function, reject: Function) => {
            fs.readFile('./nerve.json', (err: Error, content: Buffer) => {
                if (err) {
                    reject(err);
                    throw err;
                }

                this.allConfig = JSON.parse(content.toString());
                this.config = this.allConfig[this.environment];

                resolve(this.config);
            });
        });
    }

    setCfg(key: string, value: any): NerveApp {
        NerveProperty.set(this.config, key, value);

        return this;
    }

    getCfg(key: string) {
        return NerveProperty.get(this.config, key);
    }

    getPublicRoutes() {
        let routes: any[] = [];

        Object.keys(this.publicRoutes).forEach((item: string) => {
            routes.push({
                key: item,
                route: this.publicRoutes[item].replace(/^src\//, '')
            });
        });

        return routes;
    }

    setDebugLevel(level: number) {
        debug.setLevel(level);
    }

    /**
     * Установка индекса воркера
     *
     * @param {Number} index индекс воркера
     */
    setWorkerIndex(index: number) {
        this.workerIndex = index;
    }

    ready() {
        return new Promise((resolve: Function) => {
            if (this.isReady) {
                resolve();
            } else {
                this.on('ready', resolve);
            }
        });
    }

}

handlebarsHelpers(Handlebars);

export {
    NerveObject,
    NerveApp,
    NervePage,
    NerveApi,
    Module,
    NerveActiveUser,
    NerveHelpers,
    handlebarsHelpers as HandlebarsHelpers,
    Handlebars,
    debug
};