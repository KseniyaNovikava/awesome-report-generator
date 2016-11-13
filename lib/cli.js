'use strict';

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const ALLOWED_ARGV = [
    'reportConfig'
];

let args = {};

for (let key of ALLOWED_ARGV) {
    if (argv[key]) {
        args[key] = argv[key]
    }
}

let reportConfig;
if (args.reportConfig) {
    reportConfig = require(path.resolve(args.reportConfig));
}

module.exports.reportConfig = reportConfig;
