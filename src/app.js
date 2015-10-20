'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    express = require('express'),
    Router = require('./router'),
    Page = require('./page'),
    ActiveUser = require('./active-user'),
    HandlebarsHelpers = require('./lib/handlebars-helpers/main'),
    debug = require('./lib/debug'),
    Handlebars = require('handlebars'),
    NerveApp;

NerveApp = NerveObject.extend({

    init: function () {
        this.server = express();

        this.server.enable('trust proxy');
        this.server.enable('case sensitive routing');
        this.server.enable('strict routing');
        this.server.disable('x-powered-by');
        this.server.disable('etag');

        this.server.use(function (req, res, next) {
            req.id = uuid.v4();
            next();
        });

        this.router = new Router(this);
        this.routes = {};

        this.environment = process.env.NODE_NERVE_ENV || 'dev';

        this.readCfg().then(function () {
            debug.setLevel(this.getCfg('logLevel'));
        }.bind(this));
    },

    listen: function (port, callback) {
        return this.server.listen(port, callback);
    },

    route: function (routes) {
        this.routes = _.assign(this.routes, routes);

        Object.keys(this.routes).forEach(function (url) {
            this.router.get(url, this.routes[url]);
        }.bind(this));
    },

    env: function (env) {
        this.environment = env;
    },

    readCfg: function () {
        return new Promise(function (resolve, reject) {
            fs.readFile('./nerve.json', function (err, content) {
                var config;

                if (err) {
                    reject(err);
                    throw err;
                }

                config = JSON.parse(content.toString());
                this.config = config[this.environment];

                resolve(this.config);
            }.bind(this));
        });
    },

    getCfg: function (key) {
        return this.config[key];
    }

});

HandlebarsHelpers(Handlebars);

module.exports = {
    App: NerveApp,
    Page: Page,
    ActiveUser: ActiveUser,
    HandlebarsHelpers: HandlebarsHelpers,
    Handlebars: Handlebars,
    debug: debug
};