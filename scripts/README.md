# scripts/

Development and maintenance scripts for the project.

## Available Scripts

### Database

- **test-db.ts**: Test database connection and verify tables
  ```bash
  npm run test:db
  ```

## Running Scripts

All scripts should be run from the project root directory using the npm scripts defined in `package.json`. This ensures proper environment variable loading from `.env.local`.

## Creating New Scripts

When creating new scripts:

1. Use TypeScript (`.ts` extension)
2. Add shebang: `#!/usr/bin/env tsx`
3. Add npm script in `package.json` using `dotenv-cli` for environment loading
4. Document the script's purpose and usage here
