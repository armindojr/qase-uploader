const axios = require('axios');
const readReport = require('./qase-read-file');

class create {
    constructor(url, token, mochaOutputDir) {
        this.api = axios.create({
            baseURL: url,
        });

        this.api.interceptors.request.use((config) => {
            const conf = config;
            conf.headers.Token = token;
            return conf;
        });

        this.projects = readReport.getProjects(mochaOutputDir);
    }

    async createNewTestResult({ code, run_id, member_id }) {
        console.log({ path: 'qase > Create New Test Result > params' });

        for (const item of this.projects[code].cases) {
            try {
                const {
                    id: case_id, result: status, comment, time,
                } = item;

                await this.api.post(`/v1/result/${code}/${run_id}`, {
                    case_id,
                    status,
                    member_id,
                    comment,
                    time,
                }).then((res) => res.data);

                if (process.env.NODE_ENV !== 'test') {
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }
                console.log({ id: `${code}-${case_id}`, message: 'Done!' });
            } catch (error) {
                console.log({ path: 'qase > Create New Test Result > error', message: error });
                throw error;
            }
        }
    }

    async createPlan({ title, description }) {
        try {
            return await Promise.all(Object.keys(this.projects).map(async (code) => {
                const cases = this.projects[code].caseIds;
                console.log({ path: 'qase > plan > params' });
                return this.api.post(`/v1/plan/${code}`, {
                    title,
                    description,
                    cases,
                }).then((res) => res.data);
            }));
        } catch (error) {
            console.log({ path: 'qase > plan > error', message: error });
            throw error;
        }
    }

    async createRunAndResult({ title, description, member_id }) {
        try {
            return Promise.all(
                Object.keys(this.projects).map(async (code) => {
                    const cases = this.projects[code].caseIds;
                    console.log({ path: 'qase > Create Run > params' });
                    return this.api.post(`/v1/run/${code}`, {
                        title,
                        description,
                        cases,
                    }).then((res) => this.createNewTestResult({ code, run_id: res.data.result.id, member_id }));
                }),
            );
        } catch (error) {
            console.log({ path: 'qase > Create Run > error', message: error });
            throw error;
        }
    }
}

module.exports = create;
