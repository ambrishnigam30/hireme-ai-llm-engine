/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@mni-ml/framework$': '<rootDir>/node_modules/@mni-ml/framework/dist/index.js'
  },
  transformIgnorePatterns: [
    "node_modules/(?!@mni-ml/framework)"
  ]
};
