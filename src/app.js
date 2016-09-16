'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    Router = require('./router'),
    Page = require('./page'),
    Api = require('./api'),
    Module = require('./module'),
    ActiveUser = require('./active-user'),
    handlebarsHelpers = require('./lib/handlebars-helpers/main'),
    debug = require('./lib/debug'),
    locales = require('./lib/locales'),
    Property = require('./lib/property'),
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

        this.isReady = false;
        this.routes = {};
        this.publicRoutes = {};
        this.JS_VERSIONS = {};
        this.CSS_VERSIONS = {};
        this.SPRITE_VERSIONS = {};

        this.server.use(function (req, res, next) {
            req.id = uuid.v4();
            next();
        });
        this.server.use(cookieParser());

        this.router = new Router(this);

        this.environment = process.env.NODE_NERVE_ENV || 'dev';

        this.readCfg().then(function () {
            debug.setLevel(this.getCfg('logLevel'));
            locales.init(this);

            this.isReady = true;
            this.emit('ready');
        }.bind(this));
    },

    listen: function (port, host, callback) {
        this.connection = this.server.listen(port, host, callback);
        return this.connection;
    },

    close: function () {
        this.connection.close();
    },

    route: function (routes) {
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

    setCfg: function (key, value) {
        Property.set(this.config, key, value);

        return this;
    },

    getCfg: function (key) {
        return Property.get(this.config, key);
    },

    getPublicRoutes: function () {
        var routes = [];

        Object.keys(this.publicRoutes).forEach(function (item) {
            routes.push({
                key: item,
                route: this.publicRoutes[item].replace(/^src\//, '')
            });
        }.bind(this));

        return routes;
    },

    setDebugLevel: function (level) {
        debug.setLevel(level);
    },

    ready: function () {
        return new Promise(function (resolve) {
            if (this.isReady) {
                resolve();
            } else {
                this.on('ready', resolve);
            }
        }.bind(this));
    }

});

handlebarsHelpers(Handlebars);

module.exports = {
    Object: NerveObject,
    App: NerveApp,
    Page: Page,
    Api: Api,
    Module: Module,
    ActiveUser: ActiveUser,
    HandlebarsHelpers: handlebarsHelpers,
    Handlebars: Handlebars,
    debug: debug
};