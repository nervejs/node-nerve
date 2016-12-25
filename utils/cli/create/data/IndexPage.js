'use strict';

var Page = require('lib/page'),
    IndexPage;

IndexPage = Page.extend(
    {
        template: 'index',

        getTitle: function () {
            return 'NerveJS Index Page';
        }
    }
);

module.exports = IndexPage;