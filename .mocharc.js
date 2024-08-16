/** @type {import('mocha').MochaOptions} */
module.exports = {
  require: 'ts-node/register',
  spec: ['tests/**/*.test.ts'],
  'watch-files': ['src/**/*.ts', 'tests/**/*.ts'],
  timeout: 10000,
};
