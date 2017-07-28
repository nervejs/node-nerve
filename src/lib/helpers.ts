import _ = require('lodash');
import browser = require('browser-detect');

class NerveHelpers {

    /**
     * Разделение разрядов числа пробелами
     *
     * @param {Mixed} str
     * @returns {String}
     */
    static digitFormat(str: string): string {
        return str.toString().replace(/(\s)+/g, '').replace(/(\d{1,3})(?=(?:\d{3})+$)/g, '$1 ');
    }

    /**
     * Преобразование атрибутов объекта к camelCase
     *
     * @param {Object} object
     * @returns {Object}
     */
    static objectToCamelCase(object: any): any {
        let obj: any = {};

        Object.keys(object).forEach((key) => {
            let k;

            if (key === 'ID') {
                k = key.toLowerCase();
            } else {
                k = key.charAt(0).toLowerCase() + key.substr(1);
            }

            obj[k] = object[key];
        });

        return obj;
    }

    /**
     * Перевод секунд в строку с выводом часов, минут, секунд
     *
     * @param {Number} s секунды
     * @param {Object} [format] формат вывода
     * @returns {String}
     */
    static secondToStr(s: number, format: string): string {
        s = Number(s);

        if (isNaN(s)) {
            s = 0;
        }

        let timeFormat = _.assign({}, {
                showHour: false,
                showMin: true,
                showSec: true,
                padHour: false,
                padMin: true,
                padSec: true,
                sepHour: ':',
                sepMin: ':',
                sepSec: ''
            }, format),
            myTime = new Date(s * 1000),
            hour = myTime.getUTCHours(),
            min = timeFormat.showHour ? myTime.getUTCMinutes() : myTime.getUTCMinutes() + hour * 60,
            sec = timeFormat.showMin ? myTime.getUTCSeconds() : myTime.getUTCSeconds() + min * 60,
            strHour = (timeFormat.padHour && hour < 10) ? '0' + hour : hour,
            strMin = (timeFormat.padMin && min < 10) ? '0' + min : min,
            strSec = (timeFormat.padSec && sec < 10) ? '0' + sec : sec,
            strTime = '';

        if (strHour) {
            strTime += timeFormat.showHour ? strHour + timeFormat.sepHour : '';
        }
        strTime += timeFormat.showMin ? strMin + timeFormat.sepMin : '';
        strTime += timeFormat.showSec ? strSec + timeFormat.sepSec : '';

        return strTime;
    }

    /**
     * Преобразование числа в "человеко удобный" формат
     *
     * @param {Number} value число
     * @param {String} separator разделитель
     * @returns {String}
     */
    static numberHumanFormat(value: number, separator: string): string {
        let humanNumber: string;

        separator = separator || '';

        if (value < 1000) {
            humanNumber = String(value);
        } else if (value < 999950) {
            humanNumber = (value / 1000).toFixed(1).replace(/\.0$/, '') + separator + 'K';
        } else {
            humanNumber = (value / 1000000).toFixed(1).replace(/\.0$/, '') + separator + 'M';
        }

        return humanNumber;
    }

    /**
     * Склонение существительных
     *
     * @param {Number} value число
     * @param {String} text5 слово, применяемое к числу 5
     * @param {String} text1 слово, применяемое к числу 1
     * @param {String} text2 слово, применяемое к числу 2
     * @returns {String}
     */
    static plural(value: number, text5: string, text1: string, text2: string): string {
        let text;

        if (value < 0) {
            value = value * (-1);
        }

        value = value % 100;

        if (value >= 5 && value <= 14) {
            text = text5;
        } else {
            value = value % 10;

            if (!value || value >= 5) {
                text = text5;
            } else if (value >= 2) {
                text = text2;
            } else {
                text = text1;
            }
        }

        return text;
    }

    /**
     * Преобразование первого символа строки к верхнему регистру
     *
     * @param {String} str
     * @returns {String}
     */
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.substr(1);
    }

    /**
     * Обрезает текст с учетом слов и ссылок
     *
     * @param {String} text исходный текст
     * @param {Number} length желаемая длина (результат может незначительно отличаться в большую сторону)
     * @param {Number} [options.maxLinkLength=30] максимальная длина текста внутри ссылки
     * @returns {String}
     */
    static cutText(text: string, length: number, options?: any): string {
        let cutted = text.slice(0, Number(length)),
            textLength = text.length,
            cuttedLength = cutted.length,
            posOpenLink,
            posCloseLink,
            i;

        options = options || {};
        options = _.merge(options, {
            maxLinkLength: 30
        });

        if (textLength > cuttedLength) {
            i = cuttedLength;

            while (text[i] !== ' ' && i < textLength) {
                cutted += text[i++];
            }

            posOpenLink = cutted.toLowerCase().lastIndexOf('<a');
            posCloseLink = cutted.toLowerCase().lastIndexOf('</a>');
            if (posOpenLink > posCloseLink) {
                cutted += text.slice(cutted.length, text.indexOf('</a>', cutted.length)) + '</a>';
            }
        }

        if (options.maxLinkLength) {
            cutted = cutted.replace(/>(.+?)<\/a>/g, function (matches, text) {
                let result = '>' + text.slice(0, options.maxLinkLength);

                if (text.length > options.maxLinkLength) {
                    result += '...';
                }

                result += '</a>';

                return result;
            });
        }

        return cutted;
    }

    static os: any = {

        /**
         * Возвращает true для windows phone
         *
         * @param {String} userAgent строка юзер агента
         * @returns {Boolean}
         */
        isWindowsPhone: (userAgent: string): boolean => {
            return /windows phone/i.test(userAgent);
        },

        /**
         * Возвращает true для android
         *
         * @param {String} userAgent строка юзер агента
         * @returns {Boolean}
         */
        isAndroid: (userAgent: string): boolean => {
            return /android/i.test(userAgent);
        },

        /**
         * Возвращает true для iOS
         *
         * @param {String} userAgent строка юзер агента
         * @returns {Boolean}
         */
        isIOs: (userAgent: string): boolean => {
            return /iPad|iPhone|iPod/.test(userAgent);
        },

        /**
         * Возвращает true мобильных клиентов
         *
         * @param {String} userAgent строка юзер агента
         * @returns {Boolean}
         */
        isMobile: (userAgent: string): boolean => {
            return NerveHelpers.os.isWindowsPhone(userAgent) || NerveHelpers.os.isAndroid(userAgent) || NerveHelpers.os.isIOs(userAgent);
        }

    };

    static browser: any = {

        getName: function (userAgent: string): string {
            return browser(userAgent).name;
        },

        getVersion: function (userAgent: string): string {
            return browser(userAgent).version;
        }

    };

}

export = NerveHelpers;