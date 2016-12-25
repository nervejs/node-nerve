module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-jscs');

    grunt.initConfig({
        eslint: {
            options: {
                configFile: '.eslintrc.json'
            },
            main: [
                'src/**/*.js',
                'utils/**/*.js'
            ]
        },

        jscs: {
            main: {
                src: "src/**/*.js"
            }
        }
    });

    grunt.registerTask('lint', [
        'eslint',
        'jscs'
    ]);

    grunt.registerTask('default', [
        'lint'
    ]);
};