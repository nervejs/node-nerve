module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('times', function (start, n, step, block) {
        var accum = '',
            i;

        if (typeof n !== 'number') {
            block = n;
            n = start;
            start = 0;
            step = 1;
        }

        if (typeof step !== 'number') {
            block = step;
            step = 1;
        }

        for (i = start; i < start + n; i += step) {
            accum += block.fn(i);
        }

        return accum;
    });
};