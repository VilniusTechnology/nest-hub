import { config  } from './config-loader';
import {Logger} from "../logger/logger";
import {Container} from "../module/container";
import { Modules } from '../module';
const sqlite3 = require('sqlite3').verbose();

export class ModuleLoader {

    public logger: Logger;
    public config: any;

    public modules: any = {};

    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    public launch(app) {
        return new Promise((resolve, reject) => {
            this.registerModules().then((container) => {
                this.logger.info('All modules were registered.');
                this.registerModulesRoutes(app).then( () => {
                    this.logger.info('All module routes were registered.');

                    resolve(container);
                });
            });
        });
    }

    private registerModules() {
        this.logger.debug('Will register modules.');

        return new Promise((resolve, reject) => {
            const rawModules = [
                {id: 'SystemModule',
                    params: [
                        this.config,
                        this.logger,
                        null
                    ]
                },
                {id: 'MqttModule', params: [this.config, this.logger, null ] },
            ];

            if (this.config.omronSensor.enabled) {
                rawModules.push({id: 'OmronModule', params: [this.logger, null]});
            }

            // Instantiate modules objects.
            let objects = [];
            rawModules.forEach((objectDesc) => {
                const object = new Modules[objectDesc.id](...objectDesc.params);
                objects.push(object);
            });

            const container = new Container();

            // Instantiate modules logic ".init()".
            let promises = [];
            objects.forEach((module) => {
                promises.push(module);
            });

            promises.reduce(
                (p, fn, index) => {
                    return p.then((val) => {
                        return fn.init(container);
                    }).catch((error) => {
                        console.log('error: ', error);
                    });
                }, Promise.resolve()
            ).then((results) => {
                // all done here
                this.logger.info('All modules were loaded.');
                this.modules = container.getAllModules();

                resolve(container);
            }).catch((err) => {
                // error here
                console.log('error: ', err);
            });
        });
    }

    private registerModulesRoutes(app) {
        this.logger.debug('Will register module routes.');

        return new Promise((resolve, reject) => {
            let i = 0;
            for (const [key, module] of Object.entries(this.modules)) {
                i++;

                this.logger.debug(`Will register Routes 4 module ${key}.`);

                //@ts-ignore
                const routes = module.getRoutesForRegistration();
                if (Array.isArray(routes)) {
                    routes.forEach((layer) => {
                        if (layer.route !== undefined)  {
                            this.logger.debug( `Will push route: ${layer.route.path}`);
                            app._router.stack.push(layer);
                        }
                    });
                }

                if (i == Object.entries(this.modules).length) {
                    resolve(true);
                }
            }
        });
    }
}
