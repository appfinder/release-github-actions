import path from 'path';
import nock from 'nock';
import {encodeContent} from '../util';
import {
    isTargetEvent,
    parseConfig,
    getCommitMessage,
    getCommitName,
    getCommitEmail,
    getWorkspace,
    getBuildCommands,
    getGitUrl,
    detectBuildCommand,
    getRepository,
} from '../../src/utils/misc';
import {DEFAULT_COMMIT_MESSAGE, DEFAULT_COMMIT_NAME, DEFAULT_COMMIT_EMAIL} from '../../src/constant';

nock.disableNetConnect();

const testEnv = () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = {...OLD_ENV};
        delete process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });
};

describe('isTargetEvent', () => {
    it('should return true', () => {
        expect(isTargetEvent({
            payload: {
                action: 'published',
            },
            eventName: 'release',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: '',
                repo: '',
            },
        })).toBeTruthy();
    });

    it('should return false', () => {
        expect(isTargetEvent({
            payload: {
                action: 'published',
            },
            eventName: 'push',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: '',
                repo: '',
            },
        })).toBeFalsy();
    });

    it('should return false', () => {
        expect(isTargetEvent({
            payload: {
                action: 'created',
            },
            eventName: 'release',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: '',
                repo: '',
            },
        })).toBeFalsy();
    });
});

describe('parseConfig', () => {
    it('should parse config', async () => {
        expect(parseConfig(encodeContent(''))).toEqual({});
        expect(parseConfig(encodeContent('a: b'))).toEqual({a: 'b'});
        expect(parseConfig(encodeContent('a:\n  - b\n  - c'))).toEqual({a: ['b', 'c']});
    });
});

describe('getCommitMessage', () => {
    testEnv();

    it('should get commit message', () => {
        process.env.INPUT_COMMIT_MESSAGE = 'test';
        expect(getCommitMessage()).toBe('test');
    });

    it('should get commit default message', () => {
        expect(getCommitMessage()).toBe(DEFAULT_COMMIT_MESSAGE);
    });
});

describe('getCommitName', () => {
    testEnv();

    it('should get commit name', () => {
        process.env.INPUT_COMMIT_NAME = 'test';
        expect(getCommitName()).toBe('test');
    });

    it('should get commit default name', () => {
        expect(getCommitName()).toBe(DEFAULT_COMMIT_NAME);
    });
});

describe('getCommitEmail', () => {
    testEnv();

    it('should get commit email', () => {
        process.env.INPUT_COMMIT_EMAIL = 'test';
        expect(getCommitEmail()).toBe('test');
    });

    it('should get commit default email', () => {
        expect(getCommitEmail()).toBe(DEFAULT_COMMIT_EMAIL);
    });
});

describe('getWorkspace', () => {
    testEnv();

    it('should get workspace', () => {
        process.env.GITHUB_WORKSPACE = 'test';
        expect(getWorkspace()).toBe('test');
    });

    it('should not get workspace', () => {
        process.env.GITHUB_WORKSPACE = undefined;
        expect(getWorkspace()).toBe('');
    });
});

describe('getBuildCommands', () => {
    testEnv();

    it('should get build commands 1', () => {
        process.env.INPUT_BUILD_COMMAND = 'test';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'test',
            'yarn build', // build command of package.json
            'yarn install --production',
        ]);
    });

    it('should get build commands 2', () => {
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'yarn build', // build command of package.json
            'yarn install --production',
            'rm -rdf .github',
        ]);
    });

    it('should get build commands 3', () => {
        process.env.INPUT_BUILD_COMMAND = 'yarn build';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'yarn build',
            'yarn install --production',
        ]);
    });

    it('should get build commands 4', () => {
        process.env.INPUT_BUILD_COMMAND = 'yarn install && yarn build';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'yarn build',
        ]);
    });

    it('should get build commands 5', () => {
        process.env.INPUT_BUILD_COMMAND = 'test';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toEqual([
            'yarn install',
            'test',
            'yarn install --production',
        ]);
    });

    it('should get build commands 6', () => {
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toEqual([
            'yarn install --production',
            'rm -rdf .github',
        ]);
    });
});

describe('getGitUrl', () => {
    it('should return git url', () => {
        process.env.INPUT_ACCESS_TOKEN = 'test';
        expect(getGitUrl({
            payload: {
                action: '',
            },
            eventName: '',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: 'Hello',
                repo: 'World',
            },
        })).toBe('https://test@github.com/Hello/World.git');
    });
});

describe('detectBuildCommand', () => {
    it('should return false 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toBeFalsy();
    });

    it('should return false 2', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test2'))).toBeFalsy();
    });

    it('should return false 2', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test3'))).toBeFalsy();
    });

    it('should detect build command 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toBe('build');
    });

    it('should detect build command 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test5'))).toBe('production');
    });

    it('should detect build command 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test6'))).toBe('prod');
    });
});

describe('getRepository', () => {
    it('should get repository', () => {
        expect(getRepository({
            payload: {
                action: '',
            },
            eventName: '',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: 'Hello',
                repo: 'World',
            },
        })).toBe('Hello/World');
    });
});
