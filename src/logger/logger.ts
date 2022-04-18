const LoggerJson = require('node-json-logger');


export class Logger {

    public config;
    public logger;

    constructor(options: any) {
        this.logger = new LoggerJson({ level: options.level});
        // log4js = getLogger();
        // log4js.debug('Logger started initialized.');
    }

    warn(message: string) {
        this.logger.warn({ message: message });
    }

    error(message: string) {
        this.logger.error({ message: message });
    }

    debug(message: string) {
        this.logger.debug({ message: message });
    }

    info(message: string) {
        this.logger.info({ message: message });
    }

    trace(message: string) {
        this.logger.trace({ message: message });
    }

    fatal(message: string) {
        this.logger.fatal({ message: message });
    }
}
