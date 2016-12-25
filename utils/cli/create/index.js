'use strict';

var app = require('./app');

module.exports = {

    command: function (entity, name) {
        if (entity && name || entity === 'app') {
            switch (entity) {
                case 'app':
                    app();
                    break;
                case 'page':

                    break;
                case 'api':

                    break;
                case 'module':

                    break;
            }
        } else {
            this.help();
        }
    },

    help: function () {
        console.log('\n  Examples:\n' +
            '    $ nervejs create app\n' +
            '    $ nervejs create page <NAME>\n' +
            '    $ nervejs create api <NAME>\n' +
            '    $ nervejs create module <NAME>\n');
    }

};