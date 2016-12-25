'use strict';

var programm = require('commander'),
    path = require('path'),
    fs = require('fs'),
    create = require('./cli/create/index');

function NerveCli(options) {
    var pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')).toString());

    this.options = options || {};

    programm.version(pkg.version);

    programm
        .command('create [entity] [name]')
        .action(function(entity, name){
            if (entity) {
                create.command(entity, name);
            } else {
                create.help();
            }
        })
        .on('--help', function() {
            create.help();
        });

    programm.parse(process.argv);

    if (!process.argv.slice(2).length) {
        programm.outputHelp();
    }
}

module.exports = NerveCli;