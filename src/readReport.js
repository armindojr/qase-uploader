// Read report data to structure in specific format

const fs = require('fs');
const path = require('path');

function getProjects(mochaOutputDir) {
    const files = fs.readdirSync(mochaOutputDir)
        .filter((name) => path.extname(name) === '.json')
        .map((name) => JSON.parse(
            fs.readFileSync(path.join(mochaOutputDir, name)),
        ));

    const tests = {};

    files.forEach((file) => {
        file.results.forEach((results) => {
            results.suites.forEach((suite) => {
                // set to true if a suite has failed because of error on beforeHook
                let beforeFailed = false;
                suite.beforeHooks.forEach((beforeHook) => {
                    if (beforeHook.state === 'failed') {
                        beforeFailed = true;
                    }
                });

                suite.tests.forEach((test) => {
                    let { state, err } = test;
                    const { title, duration } = test;
                    const [code, id] = title.split(' - ')[0].split('-');
                    if (!tests[code]) {
                        tests[code] = {
                            caseIds: [],
                            cases: [],
                            err: [],
                        };
                    }

                    if (state === 'pending' || state === null) {
                        if (beforeFailed) {
                            err = {
                                message: 'Test blocked by failed hook',
                            };

                            state = 'failed';
                        } else {
                            err = {
                                message: 'Skipped test by xit or xdescribe',
                            };

                            state = 'skipped';
                        }
                    }

                    tests[code].caseIds.push(parseInt(id, 10));
                    tests[code].cases.push({
                        title,
                        id: parseInt(id, 10),
                        code,
                        time: Math.round(duration * 0.001),
                        result: state,
                        comment: JSON.stringify(err),
                    });
                });
            });
        });
    });

    return tests;
}

module.exports = {
    getProjects,
};
