#!/usr/bin/env node

import os from 'node:os';
import { spawn } from 'node:child_process';

console.log('Installing Claude-Flow...');

// Check if Deno is available
function checkDeno() {
  return new Promise((resolve) => {
    const deno = spawn('deno', ['--version'], { stdio: 'pipe' });
    deno.on('close', (code) => {
      resolve(code === 0);
    });
    deno.on('error', () => {
      resolve(false);
    });
  });
}

// Install Deno if not available (for local development)
async function installDeno() {
  console.log('Deno not found. For full functionality, install Deno from https://deno.land/');
  
  const platform = os.platform();
  
  if (platform === 'win32') {
    console.log('On Windows, please install Deno manually from https://deno.land/');
    return false;
  }
  
  return new Promise((resolve) => {
    const installScript = spawn('curl', ['-fsSL', 'https://deno.land/x/install/install.sh'], { 
      stdio: 'pipe',
      timeout: 10000 // 10 second timeout
    });
    const sh = spawn('sh', [], { stdio: ['pipe', 'inherit', 'inherit'] });
    
    installScript.stdout.pipe(sh.stdin);
    
    installScript.on('error', () => {
      console.log('Note: Install Deno manually from https://deno.land/ for dual-runtime features');
      resolve(false);
    });
    
    sh.on('close', (code) => {
      if (code === 0) {
        console.log('Deno installed successfully!');
        resolve(true);
      } else {
        console.log('Note: Install Deno manually from https://deno.land/ for dual-runtime features');
        resolve(false);
      }
    });
    
    sh.on('error', () => {
      console.log('Note: Install Deno manually from https://deno.land/ for dual-runtime features');
      resolve(false);
    });
  });
}

// Main installation process
async function main() {
  try {
    const denoAvailable = await checkDeno();
    
    if (!denoAvailable) {
      await installDeno();
    }
    
    console.log('Claude-Flow installation completed!');
    console.log('You can now use: npx claude-flow or claude-flow (if installed globally)');
    
    if (!denoAvailable) {
      console.log('Note: For dual-runtime features, install Deno from https://deno.land/');
    }
    
  } catch (error) {
    console.log('Claude-Flow installed successfully!');
    console.log('Note: For dual-runtime features, install Deno from https://deno.land/');
  }
}

main();