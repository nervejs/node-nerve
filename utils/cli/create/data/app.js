'use strict';

var Nerve = require('node-nerve'),
    NerveApp = Nerve.App,
    App;

App = NerveApp.extend({

});

module.exports = {
    App: App,
    app: new App(),
    Handlebars: Nerve.Handlebars
};