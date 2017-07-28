declare module 'browser-detect' {

    interface IBrowserParsed {
        name: string;
        version: string;
    }

    const browser: (userAgent: string) => IBrowserParsed;

    export = browser;

}