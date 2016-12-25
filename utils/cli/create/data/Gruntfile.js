module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-nerve-handlebars');

    grunt.initConfig({

        stylus: {
            main: {
                src: 'frontend/css/main.styl',
                dest: 'dist/css/main.css'
            }
        },

        'nerve-handlebars': {
            options: {
                paths: {
                    root: 'templates'
                }
            },

            main: {
                options: {
                    isCommonJs: true,
                    helpersPath: 'process.cwd() + "/lib/handlebars-helpers/main"',
                    dst: 'dist/templates'
                },
                cwd: 'templates',
                src: [
                    '**/*.hbs'
                ]
            }
        }

    });

    grunt.registerTask('default', [
        'stylus'
    ]);
};
