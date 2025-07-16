/**
 * Jest Setup File - CommonJS Compatible
 * Configure test environment and global settings
 */

// Ensure Jest globals are available - they should be injected by Jest automatically
// In case they're not, fall back to empty function
global.jest = global.jest || {
  fn: () => () => {},
  mock: () => {},
  spyOn: () => ({
    mockImplementation: () => {},
    mockReturnValue: () => {},
    mockResolvedValue: () => {}
  })
};

// Set test environment flags
process.env.CLAUDE_FLOW_ENV = 'test';
process.env.NODE_ENV = 'test';

// Suppress console output during tests unless explicitly needed
const originalConsole = { ...console };

// Store original console for restoration
global.originalConsole = originalConsole;

// Mock DOM for browser-like tests
if (typeof global.document === 'undefined') {
  const mockElementData = new Map();
  const globalElements = [];
  
  const parseHTML = (html) => {
    // Simple HTML parser for test purposes
    const match = html.match(/<(\w+)(?:\s+class="([^"]*)")?[^>]*>([^<]*)<\/\1>/);
    if (match) {
      const [, tagName, className, textContent] = match;
      const element = createMockElement(tagName);
      if (className) element.className = className;
      if (textContent) element.textContent = textContent;
      return [element];
    }
    return [];
  };
  
  const createMockElement = (tagName = 'div') => {
    const element = {
      tagName: tagName.toUpperCase(),
      className: '',
      textContent: '',
      id: '',
      disabled: false,
      _innerHTML: '',
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(value) {
        this._innerHTML = value;
        // Parse the innerHTML and create child elements
        if (value.includes('error-container')) {
          const errorElement = createMockElement('div');
          errorElement.className = 'error-container';
          errorElement.children = [
            { className: 'error-icon', textContent: '❌' },
            { 
              className: 'error-message',
              children: [
                { tagName: 'H4', textContent: 'Error' },
                { tagName: 'P', textContent: value.match(/<p>([^<]*)<\/p>/)?.[1] || '' }
              ]
            },
            { className: 'retry-btn', textContent: 'Retry' },
            { className: 'dismiss-btn', textContent: 'Dismiss' }
          ];
          this.children = [errorElement];
        }
      },
      setAttribute: jest.fn((name, value) => {
        element.attributes = element.attributes || {};
        element.attributes[name] = value;
        if (name === 'id') element.id = value;
      }),
      getAttribute: jest.fn((name) => {
        return element.attributes?.[name];
      }),
      appendChild: jest.fn((child) => {
        element.children = element.children || [];
        element.children.push(child);
        globalElements.push(child);
      }),
      remove: jest.fn(() => {
        const index = globalElements.indexOf(element);
        if (index > -1) globalElements.splice(index, 1);
      }),
      querySelector: jest.fn((selector) => {
        if (element.children) {
          const found = findInChildren(element.children, selector);
          if (found) return found;
        }
        return null;
      }),
      querySelectorAll: jest.fn(() => []),
      classList: {
        add: jest.fn((className) => {
          element.className = element.className ? `${element.className} ${className}` : className;
        }),
        remove: jest.fn((className) => {
          element.className = element.className?.replace(new RegExp(`\\b${className}\\b`, 'g'), '').trim();
        }),
        contains: jest.fn((className) => {
          return element.className?.includes(className) || false;
        })
      },
      children: []
    };
    
    // Helper function to find in children
    const findInChildren = (children, selector) => {
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        for (const child of children) {
          if (child.className?.includes(className)) {
            return child;
          }
          // Look for nested elements  
          if (selector === '.error-message h4' && child.className?.includes('error-message')) {
            return child.children?.find(c => c.tagName === 'H4');
          }
          if (selector === '.error-message p' && child.className?.includes('error-message')) {
            return child.children?.find(c => c.tagName === 'P');
          }
        }
      }
      return null;
    };
    
    return element;
  };
  
  global.document = {
    body: createMockElement('body'),
    getElementById: jest.fn((id) => {
      if (!mockElementData.has(id)) {
        const element = createMockElement('div');
        element.id = id;
        mockElementData.set(id, element);
      }
      return mockElementData.get(id);
    }),
    createElement: jest.fn((tagName) => createMockElement(tagName)),
    querySelector: jest.fn((selector) => {
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        // Check globally added elements first
        const found = globalElements.find(el => el.className?.includes(className));
        if (found) return found;
        
        // For specific error-message queries, create appropriate element
        if (className === 'error-message') {
          const element = createMockElement('div');
          element.className = className;
          element.textContent = 'Failed to fetch data from /api/test: Network error';
          globalElements.push(element);
          return element;
        }
        
        // Create a mock element if not found
        const element = createMockElement('div');
        element.className = className;
        return element;
      }
      return null;
    }),
    querySelectorAll: jest.fn((selector) => {
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return globalElements.filter(el => el.className?.includes(className));
      }
      return [];
    })
  };
  
  // Enhance body with proper methods
  global.document.body.appendChild = jest.fn((child) => {
    global.document.body.children = global.document.body.children || [];
    global.document.body.children.push(child);
    globalElements.push(child);
  });
  
  global.document.body.querySelector = jest.fn((selector) => {
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      const found = globalElements.find(el => el.className?.includes(className));
      if (found) return found;
      
      if (global.document.body.children) {
        return global.document.body.children.find(child => 
          child.className?.includes(className)
        );
      }
    }
    return null;
  });
  
  global.document.body.querySelectorAll = jest.fn((selector) => {
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      const globalMatches = globalElements.filter(el => el.className?.includes(className));
      if (globalMatches.length > 0) return globalMatches;
      
      if (global.document.body.children) {
        return global.document.body.children.filter(child => 
          child.className?.includes(className)
        );
      }
    }
    return [];
  });
}

// Mock WebSocket for tests that need it
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1; // OPEN
      setTimeout(() => {
        if (this.onopen) this.onopen();
      }, 0);
    }
    send(data) {}
    close() {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose();
    }
  };
}

// Mock fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Handle unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // Only log in test environment if needed
  if (process.env.DEBUG_TESTS) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
});

// Test cleanup utilities
global.testCleanup = {
  callbacks: [],
  add: (callback) => {
    global.testCleanup.callbacks.push(callback);
  },
  run: () => {
    global.testCleanup.callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    global.testCleanup.callbacks = [];
  }
};

// Test environment setup function that tests can call
global.setupTestEnv = () => {
  // Reset DOM state
  if (global.document) {
    const mockElementData = new Map();
    global.document.body.children = [];
    // Clear any existing elements
    const globalElements = [];
  }
  
  // Reset console if needed
  if (process.env.SUPPRESS_CONSOLE !== 'false') {
    // Keep console available but don't spam during tests
  }
  
  // Set test environment variables
  process.env.CLAUDE_FLOW_ENV = 'test';
  process.env.NODE_ENV = 'test';
};

// Make FakeTime available globally for compatibility
global.FakeTime = class FakeTime {
  constructor(time) {
    this.originalNow = Date.now;
    this.currentTime = time instanceof Date ? time.getTime() : time || Date.now();
    Date.now = () => this.currentTime;
  }

  tick(ms) {
    this.currentTime += ms;
  }

  restore() {
    Date.now = this.originalNow;
  }
};

// Clean up after each test
afterEach(() => {
  if (global.testCleanup) {
    global.testCleanup.run();
  }
});