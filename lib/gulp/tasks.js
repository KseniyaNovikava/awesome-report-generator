'use strict';

const cli = require('../cli');
const generator = require('../generator');

module.exports = (gulp) => {

    gulp.task('report:generate', function () {
        if (!cli.reportConfig) {
            throw 'Please, specify your report-config.json file: gulp report:generate --reportConfig=path-to-report-config.json';
        }
        return generator.run(cli.reportConfig);
    });

};
