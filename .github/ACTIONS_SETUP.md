# GitHub Actions Setup for Claude-Flow

## Overview

This document explains how Claude-Flow uses GitHub Actions to properly download dependencies for dual-runtime support (Node.js + Deno).

## Dependencies Setup

GitHub Actions sets up the required dependencies **before** firewall restrictions apply:

### 1. Deno Runtime Setup
```yaml
- name: Setup Deno
  uses: denoland/setup-deno@v1
  with:
    deno-version: v1.x
```

### 2. Node.js Setup (with caching)
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
```

## Benefits

✅ **Clean Dependencies**: No browser automation dependencies needed
✅ **Dual Runtime**: Both Node.js and Deno work properly in CI  
✅ **Faster CI**: Cached dependencies and proper setup
✅ **Reliable**: No dependency on external firewall configurations

## Updated Files

### `.github/workflows/ci.yml`
- Added Deno setup action for dual-runtime support
- Removed Chrome/Puppeteer setup (not needed)
- Proper dependency caching

### `package.json`
- Removed `puppeteer` from devDependencies 
- Clean test commands without browser dependencies

### `.npmrc`
- Removed Puppeteer download skipping
- Kept essential network timeout settings

### `scripts/install.js`
- Simplified Deno installation for local development
- Removed complex firewall workaround logic

## Local Development

For local development, you may still need:
```bash
# If you encounter firewall issues locally
PUPPETEER_SKIP_DOWNLOAD=true npm install

# For running tests locally without Chrome
npm test
```

But in GitHub Actions, everything works automatically with proper setup.

## Usage in Other Projects

To use this pattern in other projects:

1. Add the setup actions to your workflow before dependency installation
2. Remove any `PUPPETEER_SKIP_DOWNLOAD` environment variables from scripts
3. Test that your CI pipeline can now access all required dependencies

This approach is much cleaner and more reliable than trying to work around firewall restrictions at runtime.