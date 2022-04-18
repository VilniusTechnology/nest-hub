'use strict';

const log4js = require('log4js');
const ConfigCopy = require('./dist/module/system/system/install/config-copy').ConfigCopy;

var logger = log4js.getLogger();
logger.level = 'debug';

install();

function install() {
    const cc = new ConfigCopy(logger);
    cc.installConfigs();
}
