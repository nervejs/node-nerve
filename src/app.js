'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    express = require('express'),
    Router = require('./router'),
    Page = require('./page'),
    Api = require('./api'),
    Module = require('./module'),
    ActiveUser = require('./active-user'),
    handlebarsHelpers = require('./lib/handlebars-helpers/main'),
    debug = require('./lib/debug'),
    locales = require('./lib/locales'),
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
        this.JS_VERSIONS = {};
        this.CSS_VERSIONS = {};

        this.server.use(function (req, res, next) {
            req.id = uuid.v4();
            next();
        });

        this.router = new Router(this);

        this.environment = process.env.NODE_NERVE_ENV || 'dev';

        this.readCfg().then(function () {
            debug.setLevel(this.getCfg('logLevel'));
            locales.init(this);

            this.isReady = true;
            this.emit('ready');
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

    setCfg: function (key, value) {
        var arIds = key.split('.'),
            obj = {},
            tmp = obj;

        arIds.forEach(function (item, index) {
            if (index === arIds.length - 1) {
                tmp[item] = value;
            } else {
                tmp[item] = {};
                tmp = tmp[item];
            }
        });

        _.merge(this.config, obj);

        return this;
    },

    getCfg: function (key) {
        var arIds = key.split('.'),
            iteration = 0,
            cfgItem = this.config;

        while (cfgItem && iteration < arIds.length) {
            if (!_.isUndefined(cfgItem[arIds[iteration]])) {
                cfgItem = cfgItem[arIds[iteration]];
            } else {
                cfgItem = undefined;
            }

            iteration++;
        }

        return cfgItem;
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