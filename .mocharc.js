/** @type {import('mocha').MochaOptions} */
// process.env.TS_NODE_PROJECT = 'tsconfig.json';
module.exports = {
  require: 'ts-node/register',
  spec: ['tests/**/*.test.ts'],
  'watch-files': ['src/**/*.ts', 'tests/**/*.ts'],
  timeout: 10000
};
