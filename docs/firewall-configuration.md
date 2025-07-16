# Firewall Configuration Guide

## Overview
This guide explains how to configure Claude Flow to work in environments with firewall restrictions that block certain external downloads.

## Common Firewall Issues
The following external resources may be blocked by firewalls:
- `dl.deno.land` - Deno installation scripts
- `googlechromelabs.github.io` - Chrome/Puppeteer browser downloads
- `storage.googleapis.com` - Chrome browser binaries

## Solutions

### 1. Environment Variables
Set these environment variables to bypass problematic downloads:

```bash
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### 2. NPM Configuration
The project includes a `.npmrc` file that automatically configures:
- Puppeteer to skip Chrome downloads
- Network timeout settings
- Registry configuration for firewall environments

### 3. Installation Scripts
The `scripts/install.js` has been updated to:
- Handle Deno installation failures gracefully
- Continue installation without Deno if blocked
- Provide clear messages about skipped components

### 4. Package.json Scripts
All test scripts now include firewall-safe environment variables:
```bash
npm test                # Includes firewall bypasses
npm run test:unit      # Safe for restricted environments
npm run test:coverage  # Works with firewall restrictions
```

## Testing Firewall Fix
Run the verification script:
```bash
./scripts/test-firewall-fix.sh
```

This will:
- ✅ Set proper environment variables
- ✅ Test Jest infrastructure
- ✅ Run sample test suites
- ✅ Verify ES module integration works

## Expected Results
After applying firewall fixes:
- ✅ Dependencies install without network errors
- ✅ Jest runs with proper ES module support
- ✅ Test suites execute successfully
- ✅ No "jest is not defined" errors
- ✅ No Chrome/Puppeteer download failures

## Manual Workarounds
If automatic fixes don't work:

1. **Skip post-install scripts:**
   ```bash
   npm install --ignore-scripts
   ```

2. **Set environment variables manually:**
   ```bash
   export PUPPETEER_SKIP_DOWNLOAD=true
   export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   ```

3. **Install Deno separately** (optional):
   ```bash
   # If Deno features are needed, install manually
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

## Verification
To verify the firewall issues are resolved:
```bash
# Test Jest works
npx jest --version

# Test simple functionality
npm run test:unit

# Test ES module integration
NODE_OPTIONS='--experimental-vm-modules' npx jest --testPathPattern="simple-example"
```

All commands should execute without firewall-related errors.