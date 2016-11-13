'use strict';

const fs = require('fs');
const path = require('path');
var _ = require('lodash');
var xl = require('excel4node');

module.exports.run = (config) => {
    let data = require(path.resolve(config.input));

    var ensureDirectoryExistence = function(filePath) {
        var dirname = path.dirname(filePath);
        if (directoryExists(dirname)) {
            return true;
        }
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    };

    var directoryExists = function(path) {
        try {
            return fs.statSync(path).isDirectory();
        } catch (err) {
            return false;
        }
    };
    data.summary = {
        isFailed: false,
        passed: 0,
        failed: 0
    };

    var result = {
        status: {
            passed: 'passed',
            failed: 'failed',
            skipped: 'skipped',
            pending: 'pending',
            undefined: 'undefined'
        }
    };

    var suite = {
       
        time: new Date().toLocaleString(),
        features: data,
        passed: 0,
        failed: 0,
        totalTime: 0,
        scenarios: {
            passed: 0,
            failed: 0,
            skipped: 0,
            notdefined: 0
        }
    };


    var setStats = function(suite) {
        var featureOutput = suite.features;
        var featuresSummary = suite.features.summary;
        var screenShotDirectory;
        suite.reportAs = 'features';


        featureOutput.forEach(function(feature) {
            feature.scenarios = {};
            feature.scenarios.passed = 0;
            feature.scenarios.failed = 0;
            feature.scenarios.notdefined = 0;
            feature.scenarios.skipped = 0;
            feature.scenarios.pending = 0;
            feature.time = 0;
            featuresSummary.isFailed = false;

            if (!feature.elements) {
                return;
            }

            feature.elements.forEach(function(element) {
                element.passed = 0;
                element.failed = 0;
                element.notdefined = 0;
                element.skipped = 0;
                element.pending = 0;
                element.time = 0;
                var scenarioName = element.name;

                element.steps.forEach(function(step) {
                    if (step.embeddings !== undefined) {
                        step.embeddings.forEach(function(embedding) {

                            var screenShotDirectory = './screenshots';
                            var name = scenarioName && scenarioName.split(' ').join('_');
                            name = name + '.png';
                            var filename = path.join(screenShotDirectory, name);
                            ensureDirectoryExistence(filename);
                            fs.writeFileSync(filename, new Buffer(embedding.data, 'base64'));
                            step.image = './screenshots/' + name;
                        });
                    }

                    if (!step.result) {
                        return 0;
                    }
                    if (step.result.duration) {
                        element.time += step.result.duration;
                    }
                    if (step.result.status === result.status.passed) {
                        return element.passed++;
                    }
                    if (step.result.status === result.status.failed) {
                        return element.failed++;
                    }
                    if (step.result.status === result.status.undefined) {
                        return element.notdefined++;
                    }
                    if (step.result.status === result.status.pending) {
                        return element.pending++;
                    }

                    element.skipped++;
                });

                if (element.time > 0) {
                    feature.time += element.time;
                }

                if (element.notdefined > 0) {
                    feature.scenarios.notdefined++;
                    return suite.scenarios.notdefined++;
                }

                if (element.failed > 0) {
                    feature.scenarios.failed++;
                    featuresSummary.isFailed = true;
                    return suite.scenarios.failed++;
                }

                if (element.skipped > 0) {
                    feature.scenarios.skipped++;
                    return suite.scenarios.skipped++;
                }

                if (element.pending > 0) {
                    feature.scenarios.pending++;
                    return suite.scenarios.pending++;
                }

                if (element.passed > 0) {
                    feature.scenarios.passed++;
                    return suite.scenarios.passed++;
                }
            });

            if (featuresSummary.isFailed) {
                featuresSummary.failed++;
                suite.failed++;
            } else {
                featuresSummary.passed++;
                suite.passed++;
            }


            if (feature.time) {
                suite.totalTime += feature.time
            }

            return suite;

        });


        suite.features = featureOutput;

        return suite;
    };
    var htmlReport = function() {
        suite = setStats(suite);

        fs.writeFileSync(
            "./e2e/output/report.html",
            _.template(fs.readFileSync('./node_modules/awesome-report-generator/templates/index.html'))({
                suite: suite,
                features: _.template(fs.readFileSync('./node_modules/awesome-report-generator/templates/features.html'))({
                    suite: suite,
                    _: _,
                }),

            })
        );
    }
    var xlsReport = function() {

        var wb = new xl.Workbook();
        var ws = wb.addWorksheet('Sheet 1');

        ws.column(2).setWidth(20);
        ws.column(3).setWidth(40);

        //var xlsxoutputFile = path.resolve(process.cwd(), './e2e/output', 'report.xlsx');
        var xlsxoutputFile = './e2e/output/report.xlsx';
        ensureDirectoryExistence(xlsxoutputFile);
        var header = "Protractor results for: " + (new Date()).toLocaleString() + "\n\n";
        wb.write(xlsxoutputFile);
        ws.cell(2, 1, 2, 3, true).string(header);


        var i = 4;

        _.forEach(suite.features, function(feature) {
            ws.cell(++i, 1).string(feature.keyword);
            ws.cell(i, 2).string(feature.name);
            
            _.forEach(feature.elements, function(element) {
                if (element.name != undefined) {
                    ws.cell(++i, 1).string(element.keyword);
                    ws.cell(i, 2).string(element.name);
                }
                _.forEach(element.steps, function(step) {
                    if (step.result) {
                        if (step.name != undefined) {
                            ws.cell(++i, 1).string(step.result.status);
                            ws.cell(i, 2).string(step.keyword);
                            ws.cell(i, 3).string(step.name);
                        }
                    }
                    if (step.text) {
                        ws.cell(i, 4).string(step.text);
                    }

                });
            });
        });

        return wb.write(xlsxoutputFile);


    }
    _.forEach(config.format, function(format) {
        switch (format) {
            case 'html':
                htmlReport();
                break;
            case 'xlsx':
                xlsReport();
                break;
        }
    });

};