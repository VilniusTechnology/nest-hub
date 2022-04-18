import { LedServerConfig } from './model/config-model';
import * as express from 'express';
import { config  } from './config-loader';
import * as bodyParser from "body-parser";
import {Logger} from "../logger/logger";
import { Komfovent } from '../komfovent/komfovent';

export class TangerineNestHubServer {
    public static readonly PORT:number = 8081;

    private port: number;
    private app: express.Application;

    public logger: Logger;
    public config: any;

    public restapi;

    public modules: any = {};

    constructor(configJson: LedServerConfig, port: number = null) {
        this.config = config;
        this.logger = new Logger(this.config.logger.level);

        if (configJson == undefined) {
            this.config = config;
            this.logger.info('Loading config from file in config directory depending on env.');
            // this.logger.level = this.config.logger.level;
            this.logger.info(`Current env is: ${this.config.activeEnv}`);
        } else {
            this.config = configJson;
            this.logger.info('Loading config from constructor params.');
        }
        
        this.port = port || TangerineNestHubServer.PORT;
        
        this.logger.debug('TangerineNestServer was constructed..');
    }

    public getContainer() {
       return (() => this.modules);
    }

    public launch(): void {
        this.initWebServer();
        this.registerMiddlewares();

        this.listen();

        this.logger.debug('Will prepare for launch.');

        const user = this.config.komfovent.user;
        const password = this.config.komfovent.password;
        const endpoint = this.config.komfovent.endpoint;

        const komfovent = new Komfovent(this.config);

        this.restapi = express();
        this.restapi.all('/konfovent/set', bodyParser.json(), (req, res) => {
            this.logger.debug('On route to: /konfovent/set');

            let modeQ = req.query.mode;
            var modes = {
                away: '3=1',
                home: '3=2',
                intensive: '3=3',
                boost: '3=4',
                auto: '285=2',
                fireplace: '283',
                kitchen: '282'
            };
            const mode = {
                code: modes[modeQ]
            };
    
            komfovent.logon(user, password, endpoint).then(() => {
                komfovent.setMode(mode, endpoint);
            });

            res.write(JSON.stringify({}));
            res.end();
        });
        this.restapi.all('/konfovent/status', bodyParser.json(), (req, res) => {
            this.logger.debug('On route to: /konfovent/status');

            let modeQ = req.query.mode;
            var modes = {
                away: '3=1',
                home: '3=2',
                intensive: '3=3',
                boost: '3=4',
                auto: '285=2',
                fireplace: '283',
                kitchen: '282'
            };
            const mode = {
                code: modes[modeQ]
            };

            komfovent.logon(user, password, endpoint).then(() => {
                komfovent.getMode(endpoint).then((mode) => {
                    //@ts-ignore
                    res.write(JSON.stringify({mode: mode.trim()}));
                    res.end();
                }).catch((err) => {
                    res.write(JSON.stringify({error: err}));
                    res.end();
                });
            }).catch((err) => {
                res.write(JSON.stringify({error: err}));
                res.end();
            });
        });

        const routes = this.restapi._router.stack;
        if (Array.isArray(routes)) {
            routes.forEach((layer) => {
                if (layer.route !== undefined)  {
                    this.logger.debug( `Will push route: ${layer.route.path}`);
                    this.app._router.stack.push(layer);
                }
            });
        }
    }

    private registerMiddlewares() {
        this.app.use(this.corsMiddleware);
        this.app.use(bodyParser.json());

        // if (this.config.secure_api) {
        //     this.logger.debug(`Injecting to auth_mw ${this.modules}`);
        //     this.app.use(auth_mw(this.getContainer()));
        //     this.logger.warn('Registered AUTH Middleware !');
        // }
        
        this.logger.debug('Middlewares were registered !');
    }

    /**
     * Filters out CORS preflights from further operations.
     *
     * @param req 
     * @param res 
     * @param next 
     */
    private corsMiddleware(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Auth-token,Auth-email,content-type');
        res.setHeader('Access-Control-Allow-Credentials', 'false');

        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
        } else {
            next();
        }
    }

    private initWebServer(): void {
        this.app = express();
        this.logger.debug('Server created.');
    }

    private listen() {
        this.logger.info('Will start Listening'); 
        return new Promise((resolve, reject) => {
            var fs = require('fs');
            var https = require('https')

            const host = this.config.host;
            this.logger.info(`Host: ${host}`);

            try {
                const firstFile = `certs/hub.local/${host}.server.key`;
                const privateKey  = fs.readFileSync(
                    firstFile,
                    'utf8'
                ) ;

                const secondFile = `certs/hub.local/${host}.server.crt`;
                const certificate = fs.readFileSync(
                    secondFile,
                    'utf8'
                );
                const credentials = {key: privateKey, cert: certificate};

                https.createServer(credentials, this.app)
                    .listen(443, () => {
                        this.logger.info( `Server started at https://localhost` );
                        resolve(true);
                    });
            } catch (e) {
                this.logger.error(e);
            }
        });
    }
}
