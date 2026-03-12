---
name: upgrading-npm-packages
description: Use when upgrading npm dependencies in this monorepo and you need a fixed upgrade order, automatic minor and patch updates, explicit confirmation for major upgrades, and package-by-package build or test verification.
---

# Upgrading NPM Packages

## Overview

Use this order in this repo: `client` -> `common` -> `server` -> root workspace.

Rules:
- Major upgrades always require explicit user confirmation.
- Minor and patch upgrades can be applied directly.
- After each package phase, run its verification command before moving on.
- Stop immediately on install, build, or test failures.

## Package Workflow

For each target package:

1. Check outdated dependencies.
2. Apply minor and patch upgrades.
3. Re-check outdated dependencies.
4. Ask for confirmation before any remaining major upgrades.
5. Apply only the approved major upgrades.
6. Run the package verification command.

## Commands

### Client first

```bash
npm outdated --prefix client
npx npm-check-updates --packageFile client/package.json --target minor -u
npm install --prefix client
npm outdated --prefix client
```

If `npm outdated --prefix client` still shows major upgrades, pause and ask the user which packages to upgrade. Apply approved majors one at a time:

```bash
npm install --prefix client <package>@latest
```

Verify client:

```bash
npm --prefix client run build:alone
```

### Common second

```bash
npm outdated --prefix common
npx npm-check-updates --packageFile common/package.json --target minor -u
npm install --prefix common
npm outdated --prefix common
```

If major upgrades remain, ask for confirmation and apply approved majors one at a time:

```bash
npm install --prefix common <package>@latest
```

Verify common:

```bash
npm --prefix common run build
```

### Server third

```bash
npm outdated --prefix server
npx npm-check-updates --packageFile server/package.json --target minor -u
npm install --prefix server
npm outdated --prefix server
```

If major upgrades remain, ask for confirmation and apply approved majors one at a time:

```bash
npm install --prefix server <package>@latest
```

Verify server:

```bash
npm --prefix server run build
npm --prefix server run test
```

### Root workspace last

Use the same rule for root workspace dependencies:

```bash
npm outdated
npx npm-check-updates --packageFile package.json --target minor -u
npm install
npm outdated
```

If major upgrades remain, ask for confirmation and apply approved majors one at a time:

```bash
npm install <package>@latest
```

Verify workspace wiring:

```bash
npm run build
```

This root build is the final verification step for the upgrade workflow.

## Confirmation Template

When major upgrades remain, ask in this format:

```text
Major upgrades detected in <package-dir>:
- <dependency>: <current> -> <latest>

Minor and patch upgrades are already applied.
Which major upgrades should I proceed with?
```

## Common Mistakes

- Do not bulk-upgrade majors without approval.
- Do not skip `common`; both application packages depend on it.
- Do not skip `server` tests after dependency changes.
- Do not skip the final root `npm run build` verification.
