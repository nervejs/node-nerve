'use strict';

import _ = require('lodash');
import NerveObject = require('./object');
import path = require('path');
import { Request, Response } from 'express';

import { NerveApp } from './app';

class Router extends NerveObject {

    protected app: NerveApp;
    protected routes: any;

    constructor(app: NerveApp) {
        super();

        this.app = app;
        this.routes = {};
    }

    initModule(request: Request, response: Response, options: any) {
        const Module = require(path.resolve(process.cwd(), options.page));

        return new Module(this.app, {
            request: request,
            response: response
        });
    }

    get(url: string, options: any) {
        if (_.isString(options)) {
            options = {
                page: options,
                methods: ['get']
            };
        }

        this.routes[url] = options;

        const server = this.app.getServer();

        if (!options.method || options.methods.indexOf('get') !== -1) {
            server.get(url, (request, response) => this.initModule(request, response, options));
        }

        if (Array.isArray(options.methods) && options.methods.indexOf('post') !== -1) {
            server.post(url, (request, response) => this.initModule(request, response, options));
        }
    }

    go(url: string, request: any, response: Response) {
        let server: any = this.app.getServer();

        request.url = url;
        server.handle(request, response);
    }

}

export = Router;