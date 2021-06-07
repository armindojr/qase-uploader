const readReport = require('./readReport');
const { makeRequest } = require('./helpers');

class create {
    constructor(url, token, mochaOutputDir) {
        this.baseUrl = url;

        this.header = {
            token,
        };

        this.projects = readReport.getProjects(mochaOutputDir);
    }

    async validateProject(projectCode) {
        return makeRequest({
            method: 'get',
            url: `${this.baseUrl}/v1/project/${projectCode}`,
            headers: this.header,
        });
    }

    async createRun({ title, description, projectCode }) {
        return makeRequest({
            method: 'POST',
            url: `${this.baseUrl}/v1/run/${projectCode}`,
            headers: this.header,
            data: {
                title,
                description,
                environment_id: null,
                cases: this.projects[projectCode].caseIds,
            },
        });
    }

    async updateRun({ projectCode, runId, testCase }) {
        return makeRequest({
            method: 'POST',
            url: `${this.baseUrl}/v1/result/${projectCode}/${runId}`,
            headers: this.header,
            data: testCase,
        });
    }

    sendData({ title, description, memberId }) {
        Object.keys(this.projects).forEach(async (projectCode) => {
            // 1. Validate if project code exists
            const { status: validateProjectStatus } = await this.validateProject(projectCode);

            if (validateProjectStatus === 200) {
                // 2. Create new run with specified tests id
                const {
                    body: {
                        result: {
                            id: runId,
                        },
                    },
                } = await this.createRun({ title, description, projectCode });

                this.projects[projectCode].cases.forEach((item) => {
                    const testCase = {
                        case_id: item.id,
                        status: item.result,
                        member_id: memberId,
                        comment: item.comment,
                        time: item.time,
                    };

                    // 3. populate run with results
                    this.updateRun({ projectCode, runId, testCase });
                });
            }
        });
    }
}

module.exports = create;
