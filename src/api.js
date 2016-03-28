(function () {
    'use strict';

    var _ = require('lodash'),
        NerveModule = require('./module'),
        url = require('url'),
        request = require('request'),
        Api;

    Api = NerveModule.extend({

        init: function (page, options) {
            this.page = page;
            this.app = page.app;
            this.options = _.assign({}, this.defaultOptions, options);
            this.response = null;
            this.requests = [];
        },

        fetch: function () {
            return new Promise(function (resolve, reject) {
                var promises = this.dataSource.map(function (item) {
                    return this.request(item);
                }.bind(this));

                promises.push(this.getLocalesVars());

                Promise.all(promises)
                    .then(function (responses) {
                        var result;

                        this.responses = responses.map(function (item) {
                            this.requests.push(item.request);

                            return item.response;
                        }.bind(this));

                        try {
                            result = this.adapter(this.responses);

                            if (result instanceof Promise) {
                                result
                                    .then(function (adapted) {
                                        this.response = adapted;
                                        resolve(this.response);
                                    }.bind(this))
                                    .catch(function (err) {
                                        reject({
                                            error: err
                                        });
                                    });
                            } else {
                                this.response = result;
                                resolve(this.response);
                            }
                        } catch (err) {
                            reject({
                                error: err
                            });
                        }
                    }.bind(this))
                    .catch(function (result) {
                        this.requests.push(result.request);
                        reject(result.error);
                    }.bind(this));
            }.bind(this));
        },

        request: function (options) {
            return new Promise(function (resolve) {
                request({
                    url: url.resolve(this.app.getCfg('apiHost'), options.url)
                }, function (error, response, body) {
                    resolve(JSON.parse(body));
                });
            }.bind(this));
        },

        adapter: function (responses) {
            var result = {};

            if (_.isArray(responses)) {
                responses.forEach(function (item) {
                    _.merge(result, item);
                });
            }

            return result;
        },

        getResponse: function () {
            return this.response;
        },

        getResponseItemByIndex: function (index) {
            var offset = Array.isArray(this.constructor.super_.dataSource) ? this.constructor.super_.dataSource.length + index : index;

            return this.responses[offset];
        },

        getRequests: function () {
            return this.requests;
        },

        getPage: function () {
            return this.page;
        }

    });

    module.exports = Api;
}());