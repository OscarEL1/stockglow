export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', [
            'feat', 'fix', 'chore', 'docs',
            'test', 'refactor', 'ci', 'hotfix'
        ]],
        'scope-enum': [2, 'always', [
            'setup', 'ci', 'deps',
            'auth', 'inventory', 'sales', 'alerts',
            'db', 'api', 'web', 'shared', 'docs'
        ]],
        'scope-empty': [2, 'never'],
        'subject-case': [2, 'always', 'lower-case'],
        'subject-empty': [2, 'never'],
        'header-max-length': [2, 'always', 80]
    }
}