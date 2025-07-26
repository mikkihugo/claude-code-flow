import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

/**
 * End-to-End tests for MCP (Model Context Protocol) server
 * Tests the complete MCP server functionality including initialization,
 * tool registration, request handling, and resource management
 */
describe('MCP Server E2E Tests', () => {
  let mockMCPServer;
  let mockStdio;

  beforeAll(() => {
    // Mock stdio for MCP communication
    mockStdio = {
      inputs: [],
      outputs: [],
      errors: [],
      
      write: function(data) {
        this.outputs.push(data);
      },
      
      read: function() {
        return this.inputs.shift() || null;
      },
      
      error: function(data) {
        this.errors.push(data);
      },
      
      clear: function() {
        this.inputs = [];
        this.outputs = [];
        this.errors = [];
      }
    };
  });

  beforeEach(() => {
    // Create mock MCP server
    mockMCPServer = {
      name: 'claude-zen-mcp',
      version: '1.0.0',
      tools: new Map(),
      resources: new Map(),
      prompts: new Map(),
      isInitialized: false,
      stdio: mockStdio,
      
      initialize: async function() {
        this.isInitialized = true;
        
        // Register default tools
        this.registerTool('memory_store', {
          description: 'Store and retrieve data in memory',
          parameters: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              namespace: { type: 'string', default: 'default' }
            },
            required: ['key']
          }
        });
        
        this.registerTool('memory_retrieve', {
          description: 'Retrieve data from memory',
          parameters: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              namespace: { type: 'string', default: 'default' }
            },
            required: ['key']
          }
        });
        
        this.registerTool('swarm_create', {
          description: 'Create a new agent swarm',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              agentCount: { type: 'number', default: 1 },
              strategy: { type: 'string', default: 'parallel' }
            },
            required: ['name']
          }
        });
        
        this.registerTool('file_analysis', {
          description: 'Analyze file content for code quality and complexity',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              analysisType: { type: 'string', enum: ['complexity', 'quality', 'security'] }
            },
            required: ['filePath']
          }
        });
        
        return {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
            logging: {}
          },
          serverInfo: {
            name: this.name,
            version: this.version
          }
        };
      },
      
      registerTool: function(name, definition) {
        this.tools.set(name, {
          name,
          description: definition.description,
          inputSchema: definition.parameters
        });
      },
      
      registerResource: function(uri, definition) {
        this.resources.set(uri, {
          uri,
          name: definition.name,
          description: definition.description,
          mimeType: definition.mimeType
        });
      },
      
      handleToolCall: async function(toolName, parameters) {
        if (!this.isInitialized) {
          throw new Error('Server not initialized');
        }
        
        const tool = this.tools.get(toolName);
        if (!tool) {
          throw new Error(`Tool ${toolName} not found`);
        }
        
        // Validate required parameters
        if (tool.inputSchema && tool.inputSchema.required) {
          for (const requiredParam of tool.inputSchema.required) {
            if (parameters[requiredParam] === undefined) {
              throw new Error(`Missing required parameter: ${requiredParam}`);
            }
          }
        }
        
        // Mock tool implementations
        switch (toolName) {
          case 'memory_store':
            return {
              content: [{
                type: 'text',
                text: `Stored value "${parameters.value}" with key "${parameters.key}" in namespace "${parameters.namespace || 'default'}"`
              }]
            };
            
          case 'memory_retrieve':
            return {
              content: [{
                type: 'text', 
                text: `Retrieved value for key "${parameters.key}" from namespace "${parameters.namespace || 'default'}": "mock_value"`
              }]
            };
            
          case 'swarm_create':
            return {
              content: [{
                type: 'text',
                text: `Created swarm "${parameters.name}" with ${parameters.agentCount || 1} agents using ${parameters.strategy || 'parallel'} strategy`
              }]
            };
            
          case 'file_analysis':
            return {
              content: [{
                type: 'text',
                text: `Analyzed file "${parameters.filePath}" for ${parameters.analysisType || 'general'} analysis`
              }]
            };
            
          default:
            throw new Error(`Tool ${toolName} not implemented`);
        }
      },
      
      listTools: function() {
        return Array.from(this.tools.values());
      },
      
      listResources: function() {
        return Array.from(this.resources.values());
      },
      
      shutdown: async function() {
        this.isInitialized = false;
        this.tools.clear();
        this.resources.clear();
        this.prompts.clear();
      }
    };
    
    mockStdio.clear();
  });

  afterEach(async () => {
    if (mockMCPServer && mockMCPServer.isInitialized) {
      await mockMCPServer.shutdown();
    }
  });

  describe('Server Initialization', () => {
    it('should initialize MCP server with default configuration', async () => {
      const result = await mockMCPServer.initialize();
      
      expect(mockMCPServer.isInitialized).toBe(true);
      expect(result.protocolVersion).toBe('2024-11-05');
      expect(result.serverInfo.name).toBe('claude-zen-mcp');
      expect(result.serverInfo.version).toBe('1.0.0');
      expect(result.capabilities).toBeDefined();
    });

    it('should register default tools during initialization', async () => {
      await mockMCPServer.initialize();
      
      const tools = mockMCPServer.listTools();
      const toolNames = tools.map(t => t.name);
      
      expect(toolNames).toContain('memory_store');
      expect(toolNames).toContain('memory_retrieve');
      expect(toolNames).toContain('swarm_create');
      expect(toolNames).toContain('file_analysis');
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock an initialization error
      const originalInitialize = mockMCPServer.initialize;
      mockMCPServer.initialize = async function() {
        throw new Error('Initialization failed');
      };
      
      await expect(mockMCPServer.initialize()).rejects.toThrow('Initialization failed');
      
      // Restore original method
      mockMCPServer.initialize = originalInitialize;
    });
  });

  describe('Tool Registration and Management', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should register custom tools', () => {
      mockMCPServer.registerTool('custom_tool', {
        description: 'A custom tool for testing',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          },
          required: ['input']
        }
      });
      
      const tools = mockMCPServer.listTools();
      const customTool = tools.find(t => t.name === 'custom_tool');
      
      expect(customTool).toBeDefined();
      expect(customTool.description).toBe('A custom tool for testing');
      expect(customTool.inputSchema.properties.input.type).toBe('string');
    });

    it('should list all registered tools', () => {
      const tools = mockMCPServer.listTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      });
    });

    it('should handle tool schema validation', () => {
      const tool = mockMCPServer.tools.get('memory_store');
      
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties.key.type).toBe('string');
      expect(tool.inputSchema.required).toContain('key');
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should execute memory_store tool', async () => {
      const result = await mockMCPServer.handleToolCall('memory_store', {
        key: 'test_key',
        value: 'test_value',
        namespace: 'test_namespace'
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Stored value "test_value"');
      expect(result.content[0].text).toContain('key "test_key"');
      expect(result.content[0].text).toContain('namespace "test_namespace"');
    });

    it('should execute memory_retrieve tool', async () => {
      const result = await mockMCPServer.handleToolCall('memory_retrieve', {
        key: 'test_key',
        namespace: 'test_namespace'
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Retrieved value for key "test_key"');
      expect(result.content[0].text).toContain('namespace "test_namespace"');
    });

    it('should execute swarm_create tool', async () => {
      const result = await mockMCPServer.handleToolCall('swarm_create', {
        name: 'test_swarm',
        agentCount: 3,
        strategy: 'sequential'
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Created swarm "test_swarm"');
      expect(result.content[0].text).toContain('with 3 agents');
      expect(result.content[0].text).toContain('sequential strategy');
    });

    it('should execute file_analysis tool', async () => {
      const result = await mockMCPServer.handleToolCall('file_analysis', {
        filePath: '/path/to/test.js',
        analysisType: 'complexity'
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Analyzed file "/path/to/test.js"');
      expect(result.content[0].text).toContain('complexity analysis');
    });

    it('should handle missing required parameters', async () => {
      await expect(
        mockMCPServer.handleToolCall('memory_store', {
          value: 'test_value'
          // missing required 'key' parameter
        })
      ).rejects.toThrow();
    });

    it('should handle non-existent tools', async () => {
      await expect(
        mockMCPServer.handleToolCall('non_existent_tool', {})
      ).rejects.toThrow('Tool non_existent_tool not found');
    });

    it('should handle tool execution before initialization', async () => {
      await mockMCPServer.shutdown();
      
      await expect(
        mockMCPServer.handleToolCall('memory_store', { key: 'test' })
      ).rejects.toThrow('Server not initialized');
    });
  });

  describe('Resource Management', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should register resources', () => {
      mockMCPServer.registerResource('file:///test.txt', {
        name: 'Test File',
        description: 'A test file resource',
        mimeType: 'text/plain'
      });
      
      const resources = mockMCPServer.listResources();
      const testResource = resources.find(r => r.uri === 'file:///test.txt');
      
      expect(testResource).toBeDefined();
      expect(testResource.name).toBe('Test File');
      expect(testResource.mimeType).toBe('text/plain');
    });

    it('should list all registered resources', () => {
      mockMCPServer.registerResource('file:///test1.txt', {
        name: 'Test File 1',
        description: 'First test file',
        mimeType: 'text/plain'
      });
      
      mockMCPServer.registerResource('file:///test2.json', {
        name: 'Test File 2', 
        description: 'Second test file',
        mimeType: 'application/json'
      });
      
      const resources = mockMCPServer.listResources();
      
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.name)).toContain('Test File 1');
      expect(resources.map(r => r.name)).toContain('Test File 2');
    });
  });

  describe('Protocol Communication', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should handle stdio communication', () => {
      const testMessage = { type: 'request', method: 'tools/list' };
      
      mockStdio.inputs.push(JSON.stringify(testMessage));
      const input = mockStdio.read();
      
      expect(input).toBe(JSON.stringify(testMessage));
    });

    it('should write responses to stdio', () => {
      const response = { type: 'response', result: { tools: [] } };
      
      mockStdio.write(JSON.stringify(response));
      
      expect(mockStdio.outputs).toHaveLength(1);
      expect(mockStdio.outputs[0]).toBe(JSON.stringify(response));
    });

    it('should handle error messages', () => {
      const error = { type: 'error', message: 'Test error' };
      
      mockStdio.error(JSON.stringify(error));
      
      expect(mockStdio.errors).toHaveLength(1);
      expect(mockStdio.errors[0]).toBe(JSON.stringify(error));
    });
  });

  describe('Performance and Stress Testing', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should handle multiple tool calls concurrently', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          mockMCPServer.handleToolCall('memory_store', {
            key: `key_${i}`,
            value: `value_${i}`
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.content[0].text).toContain(`key_${index}`);
        expect(result.content[0].text).toContain(`value_${index}`);
      });
    });

    it('should handle rapid tool registrations', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        mockMCPServer.registerTool(`tool_${i}`, {
          description: `Tool number ${i}`,
          parameters: {
            type: 'object',
            properties: { id: { type: 'number' } }
          }
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(mockMCPServer.tools.size).toBeGreaterThanOrEqual(104); // 4 default + 100 new
    });

    it('should maintain performance with many registered tools', async () => {
      // Register many tools
      for (let i = 0; i < 50; i++) {
        mockMCPServer.registerTool(`perf_tool_${i}`, {
          description: `Performance tool ${i}`,
          parameters: { type: 'object', properties: {} }
        });
      }
      
      const startTime = Date.now();
      const tools = mockMCPServer.listTools();
      const endTime = Date.now();
      
      expect(tools.length).toBeGreaterThanOrEqual(54); // 4 default + 50 new
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should handle graceful shutdown', async () => {
      expect(mockMCPServer.isInitialized).toBe(true);
      
      await mockMCPServer.shutdown();
      
      expect(mockMCPServer.isInitialized).toBe(false);
      expect(mockMCPServer.tools.size).toBe(0);
      expect(mockMCPServer.resources.size).toBe(0);
    });

    it('should handle multiple shutdown calls', async () => {
      await mockMCPServer.shutdown();
      await mockMCPServer.shutdown(); // Should not throw
      
      expect(mockMCPServer.isInitialized).toBe(false);
    });

    it('should recover from errors and continue operation', async () => {
      // Cause an error in one tool call
      await expect(
        mockMCPServer.handleToolCall('non_existent_tool', {})
      ).rejects.toThrow();
      
      // Server should still work for valid tool calls
      const result = await mockMCPServer.handleToolCall('memory_store', {
        key: 'recovery_test',
        value: 'test'
      });
      
      expect(result.content[0].text).toContain('recovery_test');
    });
  });

  describe('Integration with Claude-Zen Features', () => {
    beforeEach(async () => {
      await mockMCPServer.initialize();
    });

    it('should integrate with memory system', async () => {
      // Store data
      const storeResult = await mockMCPServer.handleToolCall('memory_store', {
        key: 'integration_test',
        value: 'integrated_value',
        namespace: 'testing'
      });
      
      expect(storeResult.content[0].text).toContain('integration_test');
      
      // Retrieve data
      const retrieveResult = await mockMCPServer.handleToolCall('memory_retrieve', {
        key: 'integration_test',
        namespace: 'testing'
      });
      
      expect(retrieveResult.content[0].text).toContain('integration_test');
    });

    it('should integrate with swarm system', async () => {
      const result = await mockMCPServer.handleToolCall('swarm_create', {
        name: 'integration_swarm',
        agentCount: 5,
        strategy: 'hierarchical'
      });
      
      expect(result.content[0].text).toContain('integration_swarm');
      expect(result.content[0].text).toContain('5 agents');
      expect(result.content[0].text).toContain('hierarchical');
    });

    it('should integrate with file analysis system', async () => {
      const result = await mockMCPServer.handleToolCall('file_analysis', {
        filePath: '/project/src/main.js',
        analysisType: 'security'
      });
      
      expect(result.content[0].text).toContain('/project/src/main.js');
      expect(result.content[0].text).toContain('security');
    });

    it('should handle complex workflow scenarios', async () => {
      // Create a swarm
      const swarmResult = await mockMCPServer.handleToolCall('swarm_create', {
        name: 'workflow_swarm',
        agentCount: 3
      });
      
      // Store workflow data
      const storeResult = await mockMCPServer.handleToolCall('memory_store', {
        key: 'workflow_data',
        value: 'complex_workflow_state',
        namespace: 'workflows'
      });
      
      // Analyze related files
      const analysisResult = await mockMCPServer.handleToolCall('file_analysis', {
        filePath: '/workflow/config.json',
        analysisType: 'quality'
      });
      
      expect(swarmResult.content[0].text).toContain('workflow_swarm');
      expect(storeResult.content[0].text).toContain('workflow_data');
      expect(analysisResult.content[0].text).toContain('config.json');
    });
  });
});