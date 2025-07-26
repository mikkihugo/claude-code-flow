import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Integration tests for swarm operations
 * Testing multi-agent coordination and task execution
 */
describe('Swarm Operations Integration Tests', () => {
  let mockSwarmManager;

  beforeEach(() => {
    // Mock swarm manager for integration testing
    mockSwarmManager = {
      swarms: new Map(),
      agents: new Map(),
      tasks: new Map(),
      
      createSwarm: function(options = {}) {
        const swarmId = `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const swarm = {
          id: swarmId,
          agents: [],
          tasks: [],
          status: 'initializing',
          created: new Date(),
          config: {
            maxAgents: options.maxAgents || 5,
            strategy: options.strategy || 'parallel',
            timeout: options.timeout || 30000,
            ...options
          }
        };
        
        this.swarms.set(swarmId, swarm);
        return swarm;
      },
      
      spawnAgent: function(swarmId, agentConfig = {}) {
        const swarm = this.swarms.get(swarmId);
        if (!swarm) throw new Error(`Swarm ${swarmId} not found`);
        
        const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const agent = {
          id: agentId,
          swarmId,
          type: agentConfig.type || 'worker',
          capabilities: agentConfig.capabilities || [],
          status: 'idle',
          created: new Date()
        };
        
        this.agents.set(agentId, agent);
        swarm.agents.push(agentId);
        
        return agent;
      },
      
      executeTask: async function(swarmId, task) {
        const swarm = this.swarms.get(swarmId);
        if (!swarm) throw new Error(`Swarm ${swarmId} not found`);
        
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const taskExecution = {
          id: taskId,
          swarmId,
          task,
          status: 'running',
          started: new Date(),
          result: null,
          error: null
        };
        
        this.tasks.set(taskId, taskExecution);
        swarm.tasks.push(taskId);
        swarm.status = 'active';
        
        // Simulate task execution
        try {
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
          
          const result = {
            success: true,
            output: `Task ${task.type} completed successfully`,
            data: task.data || {},
            duration: 50
          };
          
          taskExecution.status = 'completed';
          taskExecution.result = result;
          taskExecution.completed = new Date();
          
          return result;
        } catch (error) {
          taskExecution.status = 'failed';
          taskExecution.error = error.message;
          throw error;
        }
      },
      
      getSwarmStatus: function(swarmId) {
        const swarm = this.swarms.get(swarmId);
        if (!swarm) return null;
        
        const agents = swarm.agents.map(id => this.agents.get(id));
        const tasks = swarm.tasks.map(id => this.tasks.get(id));
        
        return {
          id: swarm.id,
          status: swarm.status,
          agentCount: agents.length,
          activeAgents: agents.filter(a => a.status === 'active').length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          failedTasks: tasks.filter(t => t.status === 'failed').length,
          totalTasks: tasks.length
        };
      }
    };
  });

  afterEach(() => {
    // Clean up any resources
    if (mockSwarmManager) {
      mockSwarmManager.swarms.clear();
      mockSwarmManager.agents.clear();
      mockSwarmManager.tasks.clear();
    }
  });

  describe('Swarm Creation and Management', () => {
    it('should create a new swarm with default configuration', () => {
      const swarm = mockSwarmManager.createSwarm();
      
      expect(swarm).toBeDefined();
      expect(swarm.id).toMatch(/^swarm_\d+_[a-z0-9]+$/);
      expect(swarm.status).toBe('initializing');
      expect(swarm.agents).toEqual([]);
      expect(swarm.tasks).toEqual([]);
      expect(swarm.config.maxAgents).toBe(5);
    });

    it('should create a swarm with custom configuration', () => {
      const customConfig = {
        maxAgents: 10,
        strategy: 'sequential',
        timeout: 60000
      };
      
      const swarm = mockSwarmManager.createSwarm(customConfig);
      
      expect(swarm.config.maxAgents).toBe(10);
      expect(swarm.config.strategy).toBe('sequential');
      expect(swarm.config.timeout).toBe(60000);
    });

    it('should track multiple swarms', () => {
      const swarm1 = mockSwarmManager.createSwarm({ maxAgents: 3 });
      const swarm2 = mockSwarmManager.createSwarm({ maxAgents: 7 });
      
      expect(mockSwarmManager.swarms.size).toBe(2);
      expect(mockSwarmManager.swarms.has(swarm1.id)).toBe(true);
      expect(mockSwarmManager.swarms.has(swarm2.id)).toBe(true);
    });
  });

  describe('Agent Management', () => {
    let swarm;

    beforeEach(() => {
      swarm = mockSwarmManager.createSwarm();
    });

    it('should spawn agents in a swarm', () => {
      const agent = mockSwarmManager.spawnAgent(swarm.id, {
        type: 'coder',
        capabilities: ['javascript', 'react', 'nodejs']
      });
      
      expect(agent).toBeDefined();
      expect(agent.id).toMatch(/^agent_\d+_[a-z0-9]+$/);
      expect(agent.swarmId).toBe(swarm.id);
      expect(agent.type).toBe('coder');
      expect(agent.capabilities).toEqual(['javascript', 'react', 'nodejs']);
      expect(agent.status).toBe('idle');
    });

    it('should add agents to swarm agents list', () => {
      const agent1 = mockSwarmManager.spawnAgent(swarm.id, { type: 'frontend' });
      const agent2 = mockSwarmManager.spawnAgent(swarm.id, { type: 'backend' });
      
      expect(swarm.agents).toHaveLength(2);
      expect(swarm.agents).toContain(agent1.id);
      expect(swarm.agents).toContain(agent2.id);
    });

    it('should throw error when spawning agent in non-existent swarm', () => {
      expect(() => {
        mockSwarmManager.spawnAgent('invalid_swarm_id');
      }).toThrow('Swarm invalid_swarm_id not found');
    });
  });

  describe('Task Execution', () => {
    let swarm;

    beforeEach(() => {
      swarm = mockSwarmManager.createSwarm();
      mockSwarmManager.spawnAgent(swarm.id, { type: 'worker' });
    });

    it('should execute a simple task', async () => {
      const task = {
        type: 'code_analysis',
        data: { file: 'test.js', language: 'javascript' }
      };
      
      const result = await mockSwarmManager.executeTask(swarm.id, task);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('code_analysis completed successfully');
      expect(result.data).toEqual(task.data);
    });

    it('should track task execution in swarm', async () => {
      const task = { type: 'test_task', data: { test: true } };
      
      await mockSwarmManager.executeTask(swarm.id, task);
      
      expect(swarm.tasks).toHaveLength(1);
      expect(swarm.status).toBe('active');
      
      const taskId = swarm.tasks[0];
      const taskExecution = mockSwarmManager.tasks.get(taskId);
      
      expect(taskExecution.status).toBe('completed');
      expect(taskExecution.swarmId).toBe(swarm.id);
    });

    it('should handle multiple concurrent tasks', async () => {
      const tasks = [
        { type: 'task1', data: { id: 1 } },
        { type: 'task2', data: { id: 2 } },
        { type: 'task3', data: { id: 3 } }
      ];
      
      const promises = tasks.map(task => 
        mockSwarmManager.executeTask(swarm.id, task)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(swarm.tasks).toHaveLength(3);
    });

    it('should throw error when executing task in non-existent swarm', async () => {
      const task = { type: 'test', data: {} };
      
      await expect(
        mockSwarmManager.executeTask('invalid_swarm_id', task)
      ).rejects.toThrow('Swarm invalid_swarm_id not found');
    });
  });

  describe('Swarm Status and Monitoring', () => {
    let swarm;

    beforeEach(() => {
      swarm = mockSwarmManager.createSwarm();
    });

    it('should provide accurate swarm status', async () => {
      // Add agents
      mockSwarmManager.spawnAgent(swarm.id, { type: 'worker1' });
      mockSwarmManager.spawnAgent(swarm.id, { type: 'worker2' });
      
      // Execute tasks
      await mockSwarmManager.executeTask(swarm.id, { type: 'task1' });
      await mockSwarmManager.executeTask(swarm.id, { type: 'task2' });
      
      const status = mockSwarmManager.getSwarmStatus(swarm.id);
      
      expect(status).toBeDefined();
      expect(status.id).toBe(swarm.id);
      expect(status.status).toBe('active');
      expect(status.agentCount).toBe(2);
      expect(status.completedTasks).toBe(2);
      expect(status.failedTasks).toBe(0);
      expect(status.totalTasks).toBe(2);
    });

    it('should return null for non-existent swarm status', () => {
      const status = mockSwarmManager.getSwarmStatus('invalid_swarm_id');
      expect(status).toBeNull();
    });

    it('should track task completion metrics', async () => {
      // Create multiple tasks with different outcomes
      await mockSwarmManager.executeTask(swarm.id, { type: 'success_task' });
      await mockSwarmManager.executeTask(swarm.id, { type: 'another_success' });
      
      const status = mockSwarmManager.getSwarmStatus(swarm.id);
      
      expect(status.completedTasks).toBe(2);
      expect(status.failedTasks).toBe(0);
      expect(status.totalTasks).toBe(2);
    });
  });

  describe('Multi-Swarm Coordination', () => {
    it('should coordinate between multiple swarms', async () => {
      // Create multiple swarms
      const swarm1 = mockSwarmManager.createSwarm({ maxAgents: 2 });
      const swarm2 = mockSwarmManager.createSwarm({ maxAgents: 3 });
      
      // Add agents to each swarm
      mockSwarmManager.spawnAgent(swarm1.id, { type: 'frontend' });
      mockSwarmManager.spawnAgent(swarm2.id, { type: 'backend' });
      
      // Execute tasks in parallel
      const results = await Promise.all([
        mockSwarmManager.executeTask(swarm1.id, { type: 'ui_task' }),
        mockSwarmManager.executeTask(swarm2.id, { type: 'api_task' })
      ]);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      
      // Check both swarms are active
      const status1 = mockSwarmManager.getSwarmStatus(swarm1.id);
      const status2 = mockSwarmManager.getSwarmStatus(swarm2.id);
      
      expect(status1.status).toBe('active');
      expect(status2.status).toBe('active');
      expect(status1.totalTasks).toBe(1);
      expect(status2.totalTasks).toBe(1);
    });

    it('should handle cross-swarm dependencies', async () => {
      const swarmA = mockSwarmManager.createSwarm();
      const swarmB = mockSwarmManager.createSwarm();
      
      mockSwarmManager.spawnAgent(swarmA.id, { type: 'producer' });
      mockSwarmManager.spawnAgent(swarmB.id, { type: 'consumer' });
      
      // Execute task in first swarm
      const resultA = await mockSwarmManager.executeTask(swarmA.id, {
        type: 'produce_data',
        data: { output: 'shared_resource' }
      });
      
      // Use result from first swarm in second swarm
      const resultB = await mockSwarmManager.executeTask(swarmB.id, {
        type: 'consume_data',
        data: { input: resultA.data.output }
      });
      
      expect(resultA.success).toBe(true);
      expect(resultB.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high number of concurrent agents', () => {
      const swarm = mockSwarmManager.createSwarm({ maxAgents: 100 });
      
      // Spawn many agents
      const agents = [];
      for (let i = 0; i < 50; i++) {
        agents.push(mockSwarmManager.spawnAgent(swarm.id, {
          type: `worker_${i}`,
          capabilities: ['processing']
        }));
      }
      
      expect(agents).toHaveLength(50);
      expect(swarm.agents).toHaveLength(50);
      expect(mockSwarmManager.agents.size).toBe(50);
    });

    it('should execute multiple tasks efficiently', async () => {
      const swarm = mockSwarmManager.createSwarm();
      mockSwarmManager.spawnAgent(swarm.id, { type: 'worker' });
      
      const startTime = Date.now();
      
      // Execute multiple tasks
      const taskPromises = [];
      for (let i = 0; i < 20; i++) {
        taskPromises.push(
          mockSwarmManager.executeTask(swarm.id, {
            type: `batch_task_${i}`,
            data: { index: i }
          })
        );
      }
      
      const results = await Promise.all(taskPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(20);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should provide performance metrics', async () => {
      const swarm = mockSwarmManager.createSwarm();
      mockSwarmManager.spawnAgent(swarm.id, { type: 'worker' });
      
      const startTime = Date.now();
      
      await mockSwarmManager.executeTask(swarm.id, { type: 'perf_test' });
      
      const status = mockSwarmManager.getSwarmStatus(swarm.id);
      const taskId = swarm.tasks[0];
      const taskExecution = mockSwarmManager.tasks.get(taskId);
      
      expect(taskExecution.started).toBeDefined();
      expect(taskExecution.completed).toBeDefined();
      expect(taskExecution.result.duration).toBeDefined();
      expect(status.completedTasks).toBe(1);
    });
  });
});