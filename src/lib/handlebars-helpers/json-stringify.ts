import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('jsonStringify', function (object: any, delimiter: (string | number)[], delimiterLength: number) {
        let result: string = JSON.stringify(object, delimiter, delimiterLength);

        if (result) {
            result = result
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        } else {
            result = '{}';
        }

        return result;
    });
};