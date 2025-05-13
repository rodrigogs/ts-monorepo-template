# ESLint Config Package

Shared ESLint configurations for the GTR Services ecosystem. This package provides consistent linting rules across all applications and packages in the monorepo.

## Features

- **Multiple Configurations**: Different configs for base TypeScript, Next.js, and React projects
- **Modern Standards**: Configured for ES modules and latest TypeScript features
- **Integration with Prettier**: Includes prettier configurations to avoid conflicts
- **Import Sorting**: Automatically sorts and organizes imports
- **React Best Practices**: Rules for React and React Hooks

## Available Configs

- `base` - Base configuration for TypeScript projects
- `next-js` - Configuration for Next.js applications
- `react-internal` - Configuration for internal React components

## Installation

ESLint config comes pre-installed in the monorepo.

If adding to a new workspace:

```sh
npm install --save-dev @repo/eslint-config
```

## Usage

### For Base TypeScript Projects

Create an `eslint.config.mjs` file:

```js
import baseConfig from "@repo/eslint-config/base";

export default baseConfig;
```

### For Next.js Projects

Create an `eslint.config.mjs` file:

```js
import nextConfig from "@repo/eslint-config/next-js";

export default nextConfig;
```

### For React Projects

Create an `eslint.config.mjs` file:

```js
import reactConfig from "@repo/eslint-config/react-internal";

export default reactConfig;
```

## Extending Configurations

You can extend the base configurations with your own rules:

```js
import baseConfig from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    rules: {
      // Your custom rules here
      "no-console": "warn",
    },
  },
];
```

## Included Plugins

- `@typescript-eslint` - TypeScript-specific linting rules
- `eslint-plugin-import` - ESLint plugin with rules for import/export syntax
- `eslint-plugin-react` - React specific linting rules
- `eslint-plugin-react-hooks` - React hooks specific linting rules
- `eslint-plugin-simple-import-sort` - Easy autofixable import sorting
- `eslint-plugin-prettier` - Runs prettier as an ESLint rule
- `eslint-plugin-turbo` - Rules for Turborepo

## Used By

- All apps and packages in the monorepo:
  - [Bot Application](../../apps/bot/README.md)
  - [Files Organizer](../../apps/files-organizer/README.md)
  - [Service Orders](../../apps/service-orders/README.md)
  - And all packages

## Related Packages

- [@repo/typescript-config](../typescript-config/README.md) - Complementary TypeScript configurations

---

[← Back to Monorepo Index](../../README.md)
