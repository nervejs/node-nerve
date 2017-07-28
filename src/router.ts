'use strict';

import _ = require('lodash');
import NerveObject = require('./object');
import path = require('path');

import {NerveApp} from './app';
import {ClientRequest, ServerResponse} from "http";

class Router extends NerveObject {

    protected app: NerveApp;
    protected routes: any;

    constructor(app: NerveApp) {
        super();

        this.app = app;
        this.routes = {};
    }

    get(url: string, options: any) {
        if (_.isString(options)) {
            options = {
                page: options
            };
        }

        this.routes[url] = options;

        this.app.getServer().get(url, (request, response, next) => {
            const Module = require(path.resolve(process.cwd(), options.page));

            return new Module(this.app, {
                request: request,
                response: response
            });
        });
    }

    go(url: string, request: any, response: ServerResponse) {
        let server: any = this.app.getServer();

        request.url = url;
        server.handle(request, response);
    }

}

export = Router;