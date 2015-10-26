(function () {
    'use strict';

    var _ = require('lodash'),
        NerveObject = require('./object'),
        url = require('url'),
        request = require('request'),
        Api;

    Api = NerveObject.extend({

        init: function (page, options) {
            this.page = page;
            this.options = _.assign({}, this.defaultOptions, options);
        },

        fetch: function () {
            return new Promise(function (resolve, reject) {
                var promises = this.dataSource.map(function (item) {
                    return this.request(item);
                }.bind(this));

                Promise.all(promises).then(function (responses) {
                    var response = this.adapter(responses);

                    resolve(response);
                }.bind(this), reject);
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
        }

    });

    module.exports = Api;
}());