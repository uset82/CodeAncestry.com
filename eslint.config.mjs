import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'reference/**',
      'research/**',
      'next-env.d.ts',
      /* Screenshot output. Gitignored, generated, and occasionally the home of
         a throwaway diagnostic script that has no business failing CI. */
      '.captures/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // React Three Fiber's JSX namespace uses props eslint-plugin-react cannot know.
    files: ['components/viz/helix/**/*.tsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];

export default config;
