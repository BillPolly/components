export default {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: [
        '**/test/**/*.test.js'
    ],
    transform: {},
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js'
    ]
};