class NerveDebug {

    static timeEvents: any = {};

    static timeout: number = 20000;

    static level: number = 1;

    static setLevel(level: number) {
        this.level = level;
    }

    static error(message: string, ...messages: any[]) {
        let args = arguments;

        if (this.level > 0) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    }

    static log(message: string, ...messages: any[]) {
        let args = arguments;

        if (this.level > 10) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    }

    static debug(message: string, ...messages: any[]) {
        let args = arguments;

        if (this.level > 20) {
            setTimeout(function () {
                console.log.apply(this, args);
            });
        }
    }

    static time(id: string) {
        if (this.level > 30) {
            this.timeEvents[id] = Date.now();
            setTimeout(function () {
                if (this.timeEvents[id]) {
                    delete this.timeEvents[id];
                }
            }.bind(this), this.timeout);
        }
    }

    static timeEnd(id: string, message?: string) {
        let time: number;

        message = message || id;

        try {
            if (this.level > 30 && this.timeEvents[id]) {
                time = Date.now() - this.timeEvents[id];
                delete this.timeEvents[id];

                setTimeout(function () {
                    console.log(`${message}: ${time}ms`);
                });
            }
        } catch (ignore) {}
    }

}

export = NerveDebug;