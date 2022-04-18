const ENV = process.env.NODE_ENV || 'development';
const config = require(`../../config/${ENV}/config.js`);

export {config};
