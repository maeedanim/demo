// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // imports / unused
      'unused-imports/no-unused-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // explicitness / types
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/naming-convention': 'warn',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-extra-non-null-assertion': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-function-type': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-duplicate-imports': 'off', //Key "rules": Key "@typescript-eslint/no-duplicate-imports": Could not find "no-duplicate-imports" in plugin "@typescript-eslint". Did you mean "@/no-duplicate-imports"
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/ban-types': 'off', //Could not find a valid rule definition for 'ban-types'.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // core JS rules
      'prefer-const': 'error',
      'arrow-body-style': 'error',
      'block-scoped-var': 'off',
      'default-case-last': 'off',
      'default-param-last': 'off',
      'max-params': 'off',
      'no-else-return': 'off',
      'no-empty': 'error',
      'no-extra-semi': 'warn',
      'no-floating-decimal': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'off',
      'no-new-object': 'error',
      'no-param-reassign': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-template': 'error',
      'yoda': 'error',
      'eqeqeq': 'error',
      'no-console': 'off',
      'no-var': 'error',
      'no-undef': 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-use-before-define': 'error',
      'max-classes-per-file': 'error',
    },
  },
);
