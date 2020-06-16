/* Funçao de leitura do arquivo mocha para informar dados para request do QASE */

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
                suite.tests.forEach((test) => {
                    let { state } = test;
                    const { title, duration, err } = test;
                    const [code, id] = title.split(' - ')[0].split('-');
                    if (!tests[code]) {
                        tests[code] = {
                            caseIds: [],
                            cases: [],
                            err: [],
                        };
                    }
                    if (state === 'pending') {
                        state = ('skipped');
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
