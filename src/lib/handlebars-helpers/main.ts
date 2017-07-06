import debug = require('./debug');
import digitFormat = require('./digitFormat');
import escape = require('./escape');
import getByKey = require('./get-by-key');
import htmlEntities = require('./htmlentities');
import ifEq = require('./ifEq');
import ifLt = require('./ifLt');
import ifGt = require('./ifGt');
import jsonEncode = require('./json-encode');
import jsonStringify = require('./json-stringify');
import jsonStripEndBrace = require('./json-strip-end-brace');
import numberWidth = require('./number-width');
import unlessEq = require('./unlessEq');
import plural = require('./plural');
import random = require('./random');
import spaceless = require('./spaceless');
import times = require('./times');

import * as Handlebars from 'handlebars';

export = function(HandlebarsObject: typeof Handlebars) {
    'use strict';

    debug(HandlebarsObject);
    digitFormat(HandlebarsObject);
    escape(HandlebarsObject);
    getByKey(HandlebarsObject);
    htmlEntities(HandlebarsObject);
    ifEq(HandlebarsObject);
    ifGt(HandlebarsObject);
    ifLt(HandlebarsObject);
    jsonEncode(HandlebarsObject);
    jsonStringify(HandlebarsObject);
    jsonStripEndBrace(HandlebarsObject);
    numberWidth(HandlebarsObject);
    unlessEq(HandlebarsObject);
    plural(HandlebarsObject);
    random(HandlebarsObject);
    spaceless(HandlebarsObject);
    times(HandlebarsObject);
};