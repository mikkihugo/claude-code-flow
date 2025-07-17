/**
 * Event-Driven Todo System for Hive Mind
 * 
 * No timers, no polling - just intelligent event-based task generation
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from './DatabaseManager.js';
import { MCPToolWrapper } from '../integration/MCPToolWrapper.js';

interface Todo {
  id: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  triggeredBy: string;
  context: any;
  dependencies?: string[];
  assignedAgent?: string;
  deadline?: Date;
  createdAt: Date;
}

export class EventDrivenTodoSystem extends EventEmitter {
  private db: DatabaseManager;
  private mcpWrapper: MCPToolWrapper;
  private todos: Map<string, Todo> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    this.db = await DatabaseManager.getInstance();
    this.mcpWrapper = new MCPToolWrapper();
    await this.mcpWrapper.initialize();
  }

  /**
   * Setup intelligent event handlers for todo generation
   */
  private setupEventHandlers(): void {
    // Queen events -> todo generation
    this.addEventHandler('agentRegistered', this.onAgentRegistered.bind(this));
    this.addEventHandler('taskSubmitted', this.onTaskSubmitted.bind(this));
    this.addEventHandler('taskCompleted', this.onTaskCompleted.bind(this));
    this.addEventHandler('taskFailed', this.onTaskFailed.bind(this));
    this.addEventHandler('consensusReached', this.onConsensusReached.bind(this));
    this.addEventHandler('agentFailed', this.onAgentFailed.bind(this));
    this.addEventHandler('identityRefreshTriggered', this.onIdentityRefresh.bind(this));
    
    // Memory events -> todo generation
    this.addEventHandler('memoryCompressed', this.onMemoryCompressed.bind(this));
    this.addEventHandler('memoryRestored', this.onMemoryRestored.bind(this));
    this.addEventHandler('performanceIssue', this.onPerformanceIssue.bind(this));
    this.addEventHandler('resourceConstraint', this.onResourceConstraint.bind(this));
    
    // System events -> todo generation
    this.addEventHandler('errorOccurred', this.onErrorOccurred.bind(this));
    this.addEventHandler('bottleneckDetected', this.onBottleneckDetected.bind(this));
    this.addEventHandler('scalingNeeded', this.onScalingNeeded.bind(this));
  }

  /**
   * Add event handler for todo generation
   */
  private addEventHandler(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Process event and generate relevant todos
   */
  async processEvent(eventName: string, eventData: any): Promise<void> {
    const handlers = this.eventHandlers.get(eventName) || [];
    
    for (const handler of handlers) {
      try {
        await handler(eventData);
      } catch (error) {
        this.emit('error', `Todo generation failed for event ${eventName}: ${error.message}`);
      }
    }
  }

  /**
   * Event Handlers - Each generates contextual todos
   */

  private async onAgentRegistered(data: any): Promise<void> {
    const { agent } = data;
    
    await this.createTodo({
      content: `Verify agent ${agent.id} capabilities and performance`,
      priority: 'medium',
      triggeredBy: 'agent_registered',
      context: { agentId: agent.id, agentType: agent.type },
      assignedAgent: 'monitor'
    });

    await this.createTodo({
      content: `Integrate agent ${agent.id} into optimal task assignments`,
      priority: 'high',
      triggeredBy: 'agent_registered', 
      context: { agentId: agent.id },
      dependencies: [`verify_agent_${agent.id}`]
    });
  }

  private async onTaskSubmitted(data: any): Promise<void> {
    const { task } = data;
    
    await this.createTodo({
      content: `Analyze task complexity: "${task.description}"`,
      priority: task.priority === 'critical' ? 'critical' : 'high',
      triggeredBy: 'task_submitted',
      context: { taskId: task.id, taskDescription: task.description },
      assignedAgent: 'analyst'
    });

    if (task.requireConsensus) {
      await this.createTodo({
        content: `Prepare consensus process for task ${task.id}`,
        priority: 'high',
        triggeredBy: 'task_submitted',
        context: { taskId: task.id },
        dependencies: [`analyze_task_${task.id}`]
      });
    }
  }

  private async onTaskCompleted(data: any): Promise<void> {
    const { task, result } = data;
    
    await this.createTodo({
      content: `Analyze success patterns from completed task ${task.id}`,
      priority: 'low',
      triggeredBy: 'task_completed',
      context: { taskId: task.id, result },
      assignedAgent: 'analyst'
    });

    await this.createTodo({
      content: `Update agent performance metrics for task ${task.id}`,
      priority: 'medium',
      triggeredBy: 'task_completed',
      context: { taskId: task.id, result }
    });
  }

  private async onTaskFailed(data: any): Promise<void> {
    const { task, error } = data;
    
    await this.createTodo({
      content: `URGENT: Investigate task failure - ${task.id}`,
      priority: 'critical',
      triggeredBy: 'task_failed',
      context: { taskId: task.id, error: error.message },
      assignedAgent: 'reviewer'
    });

    await this.createTodo({
      content: `Implement failure prevention for similar tasks`,
      priority: 'high',
      triggeredBy: 'task_failed',
      context: { taskId: task.id, failurePattern: error.message }
    });
  }

  private async onAgentFailed(data: any): Promise<void> {
    const { agent } = data;
    
    await this.createTodo({
      content: `CRITICAL: Reassign tasks from failed agent ${agent.id}`,
      priority: 'critical',
      triggeredBy: 'agent_failed',
      context: { agentId: agent.id, agentType: agent.type }
    });

    await this.createTodo({
      content: `Analyze failure patterns for agent type ${agent.type}`,
      priority: 'high',
      triggeredBy: 'agent_failed',
      context: { agentId: agent.id, agentType: agent.type },
      assignedAgent: 'analyst'
    });
  }

  private async onMemoryCompressed(data: any): Promise<void> {
    await this.createTodo({
      content: `Verify critical memory integrity after compression`,
      priority: 'high',
      triggeredBy: 'memory_compressed',
      context: { namespace: data.namespace },
      assignedAgent: 'monitor'
    });

    await this.createTodo({
      content: `Refresh Queen identity after memory compression`,
      priority: 'critical',
      triggeredBy: 'memory_compressed',
      context: { operation: 'compression' }
    });
  }

  private async onMemoryRestored(data: any): Promise<void> {
    await this.createTodo({
      content: `Validate restored memory consistency`,
      priority: 'high',
      triggeredBy: 'memory_restored',
      context: { backup: data.backupId }
    });

    await this.createTodo({
      content: `Re-establish agent hierarchies after memory restore`,
      priority: 'critical',
      triggeredBy: 'memory_restored',
      context: { backup: data.backupId }
    });
  }

  private async onConsensusReached(data: any): Promise<void> {
    const { proposal, result } = data;
    
    await this.createTodo({
      content: `Implement consensus decision: ${proposal.task}`,
      priority: 'high',
      triggeredBy: 'consensus_reached',
      context: { proposal, result }
    });

    await this.createTodo({
      content: `Document consensus rationale for future reference`,
      priority: 'medium',
      triggeredBy: 'consensus_reached',
      context: { proposal, result },
      assignedAgent: 'documenter'
    });
  }

  private async onIdentityRefresh(data: any): Promise<void> {
    const { reason } = data;
    
    if (reason === 'memory_compaction' || reason === 'memory_restore') {
      await this.createTodo({
        content: `Verify all agents acknowledge Queen authority after ${reason}`,
        priority: 'high',
        triggeredBy: 'identity_refresh',
        context: { reason }
      });
    }
  }

  private async onPerformanceIssue(data: any): Promise<void> {
    await this.createTodo({
      content: `Optimize performance bottleneck: ${data.component}`,
      priority: 'high',
      triggeredBy: 'performance_issue',
      context: data,
      assignedAgent: 'optimizer'
    });
  }

  private async onResourceConstraint(data: any): Promise<void> {
    await this.createTodo({
      content: `Scale resources to handle constraint: ${data.resource}`,
      priority: 'critical',
      triggeredBy: 'resource_constraint',
      context: data
    });
  }

  private async onErrorOccurred(data: any): Promise<void> {
    await this.createTodo({
      content: `Debug and fix error: ${data.error}`,
      priority: 'high',
      triggeredBy: 'error_occurred',
      context: data,
      assignedAgent: 'reviewer'
    });
  }

  private async onBottleneckDetected(data: any): Promise<void> {
    await this.createTodo({
      content: `Resolve bottleneck in ${data.component}`,
      priority: 'high',
      triggeredBy: 'bottleneck_detected',
      context: data,
      assignedAgent: 'optimizer'
    });
  }

  private async onScalingNeeded(data: any): Promise<void> {
    await this.createTodo({
      content: `Scale swarm capacity for load: ${data.currentLoad}`,
      priority: 'critical',
      triggeredBy: 'scaling_needed',
      context: data
    });
  }

  /**
   * Create a new todo item
   */
  private async createTodo(todoData: Partial<Todo>): Promise<Todo> {
    const todo: Todo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: todoData.content!,
      priority: todoData.priority || 'medium',
      status: 'pending',
      triggeredBy: todoData.triggeredBy!,
      context: todoData.context || {},
      dependencies: todoData.dependencies,
      assignedAgent: todoData.assignedAgent,
      deadline: todoData.deadline,
      createdAt: new Date()
    };

    this.todos.set(todo.id, todo);
    
    // Store in memory for persistence
    await this.mcpWrapper.storeMemory({
      action: 'store',
      key: `todo/${todo.id}`,
      value: JSON.stringify(todo),
      namespace: 'event-driven-todos',
      ttl: 86400 * 7 // 7 days
    });

    this.emit('todoCreated', todo);
    return todo;
  }

  /**
   * Mark todo as completed and trigger follow-up todos if needed
   */
  async completeTodo(todoId: string, result?: any): Promise<void> {
    const todo = this.todos.get(todoId);
    if (!todo) return;

    todo.status = 'completed';
    
    // Store completion
    await this.mcpWrapper.storeMemory({
      action: 'store',
      key: `todo/${todoId}`,
      value: JSON.stringify(todo),
      namespace: 'event-driven-todos'
    });

    // Generate follow-up todos based on completion
    await this.generateFollowupTodos(todo, result);
    
    this.emit('todoCompleted', { todo, result });
  }

  /**
   * Generate intelligent follow-up todos
   */
  private async generateFollowupTodos(completedTodo: Todo, result?: any): Promise<void> {
    // Example: If agent verification completed, create integration todo
    if (completedTodo.triggeredBy === 'agent_registered' && completedTodo.content.includes('verify')) {
      await this.createTodo({
        content: `Integrate verified agent ${completedTodo.context.agentId} into active assignments`,
        priority: 'medium',
        triggeredBy: 'agent_verified',
        context: completedTodo.context
      });
    }

    // Example: If critical issue was resolved, create monitoring todo
    if (completedTodo.priority === 'critical') {
      await this.createTodo({
        content: `Monitor for recurrence of resolved issue: ${completedTodo.content}`,
        priority: 'low',
        triggeredBy: 'critical_resolved',
        context: { resolvedTodo: completedTodo.id, result }
      });
    }
  }

  /**
   * Get active todos (no polling needed!)
   */
  getActiveTodos(): Todo[] {
    return Array.from(this.todos.values()).filter(todo => 
      todo.status === 'pending' || todo.status === 'in_progress'
    );
  }

  /**
   * Get todos by priority
   */
  getTodosByPriority(priority: Todo['priority']): Todo[] {
    return Array.from(this.todos.values()).filter(todo => 
      todo.priority === priority && (todo.status === 'pending' || todo.status === 'in_progress')
    );
  }

  /**
   * Get todos for specific agent
   */
  getTodosForAgent(agentType: string): Todo[] {
    return Array.from(this.todos.values()).filter(todo => 
      todo.assignedAgent === agentType && (todo.status === 'pending' || todo.status === 'in_progress')
    );
  }
}