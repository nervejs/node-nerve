import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('times', function (start: number, n: number, step: number, block: any) {
        let accum: string = '',
            i: number;

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