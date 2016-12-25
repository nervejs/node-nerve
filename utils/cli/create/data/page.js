'use strict';

var ActiveUser = require('lib/active-user'),
    NervePage = require('node-nerve').Page,
    Page;

Page = NervePage.extend({

    /**
     * Путь к шаблонам страниц
     *
     * @type {String}
     */
    pagesTmplPath: 'pages',

    /**
     * Шаблон для верхней части
     *
     * @type {String}
     */
    templateHead: 'common/head',

    /**
     * Шаблон для нижней части
     *
     * @type {String}
     */
    templateFooter: 'common/footer',

    /**
     * Шаблон для ошибки 404
     *
     * @type {String}
     */
    templateError404: 'common/error404',

    /**
     * Шаблон для ошибки 500
     *
     * @type {String}
     */
    templateError500: 'common/error500',

    initActiveUser: function () {

        this.activeUser = new ActiveUser(this.app, {
            request: this.options.request,
            response: this.options.response
        });

        return this.activeUser;
    }

});

module.exports = Page;