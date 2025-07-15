# Dual Runtime Support: Node.js + Deno

Claude Flow supports both Node.js and Deno runtimes out of the box with automatic detection and compatibility layers.

## Quick Start

### Node.js
```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Test
npm test
```

### Deno
```bash
# Development
deno task dev

# Build
deno task build

# Test  
deno task test

# Type check
deno task typecheck
```

### Dual Runtime Commands
```bash
# Build for both runtimes
npm run build:dual

# Type check both
npm run typecheck:dual

# Test both
npm run test:dual
```

## Runtime Detection

The project automatically detects the runtime environment:

```javascript
import { RuntimeDetector, compat } from './src/cli/runtime-detector.js';

console.log(RuntimeDetector.getRuntime()); // 'node' or 'deno'
console.log(compat.platform); // Platform info
```

## Cross-Platform APIs

Use the unified compatibility layer for cross-runtime code:

```javascript
import { compat } from './src/cli/runtime-detector.js';

// Works in both Node.js and Deno
await compat.terminal.write('Hello World!\n');
const env = compat.getEnv('HOME');
compat.setEnv('MY_VAR', 'value');
```

## File Organization

- `package.json` - Node.js configuration
- `deno.json` - Deno configuration  
- `tsconfig.json` - TypeScript for Node.js
- `src/cli/runtime-detector.js` - Dual runtime support
- `bin/claude-flow` - Node.js binary
- `bin/claude-flow-deno` - Deno binary (after build)

## Features Available in Both Runtimes

✅ CLI commands and interface  
✅ Agent orchestration  
✅ Memory management  
✅ Task coordination  
✅ Web UI  
✅ Performance monitoring  
✅ Cross-platform file operations  
✅ Environment detection  
✅ Signal handling
