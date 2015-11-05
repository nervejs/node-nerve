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
            this.options = _.assign({}, this.defaultOptions, options);
            this.response = null;
        },

        fetch: function () {
            return new Promise(function (resolve, reject) {
                var promises = this.dataSource.map(function (item) {
                    return this.request(item);
                }.bind(this));

                promises.push(this.getLocalesVars());

                Promise.all(promises)
                    .then(function (responses) {
                        this.response = this.adapter(responses);

                        resolve(this.response);
                    }.bind(this), reject)
                    .catch(function (err) {
                        reject(err);
                    });
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
            return responses;
        },

        getResponse: function () {
            return this.response;
        }

    });

    module.exports = Api;
}());