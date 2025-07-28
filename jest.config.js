export default {
    testEnvironment: 'jsdom',
    testMatch: [
        '**/test/**/*.test.js'
    ],
    transform: {},
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js'
    ]
};