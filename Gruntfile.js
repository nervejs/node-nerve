module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-jslint');

    grunt.initConfig({
        jslint: {
            main: {
                src: [
                    'src/**/*.js'
                ],
                directives: {
                    unparam: true,
                    nomen: true,
                    plusplus: true
                }
            }
        }
    });

    grunt.registerTask('default', [
        'jslint'
    ]);
};