import js from '@eslint/js';
import ts from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...ts.configs.recommended,
    {
        ignores: [
            'node_modules/**',
            'playwright-report/**',
            'test-results/**',
            'blob-report/**',
            'playwright/.cache/**',
            'playwright/.auth/**',
            '.github/**',
        ],
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-empty-pattern': 'off',
        },
    },
];