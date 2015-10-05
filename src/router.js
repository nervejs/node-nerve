'use strict';

var _ = require('lodash'),
    NerveObject = require('./object'),
    path = require('path'),
    Router;

Router = NerveObject.extend({

    init: function (app) {
        this.app = app;
        this.routes = {};
    },

    get: function (url, options) {
        if (_.isString(options)) {
            options = {
                page: options
            };
        }

        this.routes[url] = options;

        this.app.server.get(url, function (request, response, next) {
            var Module = require(path.resolve(process.cwd(), options.page));

            return new Module(this.app, {
                request: request,
                response: response
            });
        }.bind(this));
    }

});

module.exports = Router;