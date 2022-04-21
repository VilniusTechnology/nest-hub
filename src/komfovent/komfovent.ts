import { LedServerConfig } from '../server/model/config-model';
import * as express from 'express';
import * as bodyParser from "body-parser";
import {Logger} from "../logger/logger";
import axios from 'axios';
import { config } from '../server/config-loader';

export class Komfovent {
    public static readonly PORT:number = 8081;

    private port: number;
    private app: express.Application;

    public logger: Logger;
    public config: any;

    public modules: any = {};

    constructor(config: LedServerConfig, port: number = null) {
        this.config = config;
        this.logger = new Logger(this.config.logger.level);

    }

    public makeRequest(postConfig) {
        return new Promise((resolve, reject) => {
            axios.post(postConfig.url, postConfig.data)
              .then(function (response) {
                // console.log(response);
                resolve(response);
              })
              .catch((error) => {
                // console.log(error);
                reject(error);
              });
        });
    }

    public logon (username, password, ip) {
        return new Promise((resolve, reject) => {
            // validate input
            if (typeof username !== 'string' || !username || typeof password !== 'string' || !password) {
                return ({ error: true, result: 'Empty username/password received, quitting' });
            }
            if (typeof ip !== 'string' || !ip) {
                return ({ error: true, result: 'Empty IP received, quitting' });
            }
            const postConfig = {
                url: 'http://' + ip,
                method: 'POST',
                data: '1=' + username + '&' + '2=' + password
            };
            // console.log('postConfig: ', postConfig);
            this.makeRequest(postConfig).then((result) => {
                // check that we are actually logged on
                if (result === 'undefined' || result === '') {
                    reject({ error: true, result: 'http request failed', unit: ip });
                    //@ts-ignore
                } else if (result.data.indexOf('Incorrect password!') >= 0 || result.status > 200) {
                    reject({ error: true, result: 'Wrong password for unit', unit: ip });
                    //@ts-ignore
                } else if (result.data.indexOf('value="Logout') >= 0 && result.status === 200) {
                    // then assume we are logged on correctly
                    reject({ error: false, result: 'logged on', unit: ip });
                } else {
                    // seems like something unknown failed, the beauty of screenscraping
                    reject({ error: true, result: 'Something totally unknown happened with logon', unit: ip });
                }
                resolve(result);
            }).catch ( (error) => {
                reject({ error: true, result: error.toString()});
            });
        });
    }

    public setMode(mode, ip) {
        return new Promise((resolve, reject) => {
            // validate input
            if (typeof mode.code !== 'string' || !mode) {
                return ({ error: true, result: 'Empty mode received, quitting', unit: ip });
            }
            if (typeof ip !== 'string' || !ip) {
                return ({ error: true, result: 'Empty IP received, quitting' });
            }
            // defining message needed by c6 to switch modes
            const postConfig = {
                url: 'http://' + ip + '/ajax.xml',
                method: 'POST',
                data: mode.code
            };
            // make request for mode change
            const result = this.makeRequest(postConfig).then((result) => {
                resolve(result);
            }).catch ( (error) => {
                reject({ error: true, result: error.toString() });
            });

            // //@ts-ignore
            // if (result.status === 200 && result.data.indexOf('c6') > 0) {
            //     // then assuming it was ok, right http and the weird standard body response from C6 controller
            //     return { error: false, result: mode.name };
            // }
            // else {
            //     return { error: true, result: 'Could not set mode. Non existing? ' + mode.name , unit: ip};
            // }
        });
    }

    public getMode (ip) {
        return new Promise((resolve, reject) => {
            // get the page and scrape it
            const result = this.getData('data', ip).then((scraped) => {
                //@ts-ignore
                const mode = scraped('#omo').html();

                if (typeof mode === 'undefined' || !mode) {
                    reject({ error: true, result: 'Active mode not found', unit: ip });
                }
                else {
                    // seems like we got the data without errors
                    reject({ error: false, result: mode, unit: ip });
                }

                resolve(mode);
            }).catch ( (error) => {
                reject({ error: true, result: error.toString() });
            });
        });
    }

    public getData (name, ip) {
        return new Promise((resolve, reject) => {
            // no validate input, private only
            // change target to subpage if identity/name
            const page = name.indexOf('_') > 0 ? 'det.html' : '';
            // setup for get request
            const getConfig = {
                url: 'http://' + ip + '/' + page,
                method: 'GET'
            };
            // get the page and scrape it
            this.makeRequest(getConfig).then((result) => {
                // load scraper and scrape recieved content
                //@ts-ignore
                if (result !== 'undefined' && result && !result.error && result.data) {
                    const scraper = require('cheerio');
                    //@ts-ignore
                    resolve(scraper.load(result.data));
                } else {
                    //@ts-ignore
                    reject({error: true, result:'Could not fetch page: ' + result.result});
                }   
            }).catch ( (error) => {
                reject({ error: true, result: error.toString() });
            });
        });
    }
}
