# Archon Staging Feature Implementation Instructions

**Feature:** Parallel Task Batch Staging System
**Priority:** High - Enables intelligent workflow automation
**Complexity:** Medium - Extends existing task management system
**Estimated Dev Time:** 3-5 days

## 🎯 Feature Overview

Create a new "Stage" tab in Archon's task management interface that allows staging the next batch of parallel tasks. When current batch completes, staged tasks automatically transition to active status, enabling continuous parallel execution without bottlenecks.

## 🏗️ System Architecture

### Core Concept
```
Task Lifecycle: todo → staged → doing → done
                    ↑        ↑
                 Manual   Automated
                Staging   Promotion
```

### Staging Workflow
1. **Manual Staging:** Users drag tasks from "todo" to "staged" status
2. **Batch Management:** Staged tasks grouped into execution batches
3. **Dependency Checking:** Validate prerequisites before staging
4. **Automated Promotion:** When batch completes, next staged batch becomes active
5. **Intelligent Queuing:** Auto-suggest next tasks based on dependencies

## 📊 Database Schema Changes

### 1. Add Staging Status to Tasks Table
```sql
-- Extend existing status enum
ALTER TYPE task_status ADD VALUE 'staged';

-- Add staging metadata columns
ALTER TABLE tasks ADD COLUMN staged_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN stage_batch_id UUID;
ALTER TABLE tasks ADD COLUMN stage_priority INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN auto_promote BOOLEAN DEFAULT true;
```

### 2. Create Stage Batches Table
```sql
CREATE TABLE stage_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    batch_order INTEGER NOT NULL,
    max_parallel_tasks INTEGER DEFAULT 10,
    auto_promote BOOLEAN DEFAULT true,
    prerequisites JSONB, -- Dependencies on other batches/tasks
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stage_batches_project_order ON stage_batches(project_id, batch_order);
CREATE INDEX idx_tasks_stage_batch ON tasks(stage_batch_id);
```

### 3. Add Automation Rules Table
```sql
CREATE TABLE staging_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'auto_stage', 'auto_promote', 'dependency'
    conditions JSONB NOT NULL, -- Rule conditions
    actions JSONB NOT NULL, -- Actions to take
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 API Endpoints

### 1. Stage Management Endpoints
```typescript
// GET /api/projects/{project_id}/stages
// List all staged task batches
interface StageBatch {
  id: string
  name: string
  description: string
  batch_order: number
  max_parallel_tasks: number
  tasks: Task[]
  prerequisites: Prerequisite[]
  can_promote: boolean
  estimated_duration: string
}

// POST /api/projects/{project_id}/stages
// Create new stage batch
interface CreateStageBatch {
  name: string
  description?: string
  max_parallel_tasks?: number
  auto_promote?: boolean
  prerequisites?: string[]
}

// PUT /api/projects/{project_id}/stages/{batch_id}
// Update stage batch
interface UpdateStageBatch {
  name?: string
  description?: string
  max_parallel_tasks?: number
  batch_order?: number
}

// DELETE /api/projects/{project_id}/stages/{batch_id}
// Delete stage batch (moves tasks back to todo)
```

### 2. Task Staging Endpoints
```typescript
// POST /api/tasks/stage
// Stage tasks (move from todo to staged)
interface StageTasksRequest {
  task_ids: string[]
  stage_batch_id?: string // Optional: create new batch if not provided
  batch_name?: string
  stage_priority?: number
}

// POST /api/tasks/unstage
// Unstage tasks (move from staged back to todo)
interface UnstageTasksRequest {
  task_ids: string[]
}

// POST /api/tasks/promote-batch
// Manually promote staged batch to doing
interface PromoteBatchRequest {
  stage_batch_id: string
  force?: boolean // Ignore prerequisites
}
```

### 3. Automation Endpoints
```typescript
// POST /api/projects/{project_id}/staging-rules
// Create automation rule
interface StagingRule {
  rule_name: string
  rule_type: 'auto_stage' | 'auto_promote' | 'dependency'
  conditions: {
    trigger: 'batch_complete' | 'task_complete' | 'time_based'
    criteria: any
  }
  actions: {
    promote_batch?: string
    stage_tasks?: string[]
    notify?: string[]
  }
}

// GET /api/projects/{project_id}/staging-rules
// List automation rules

// POST /api/projects/{project_id}/staging/auto-suggest
// Get AI-suggested next staging batch
interface AutoSuggestResponse {
  suggested_tasks: Task[]
  reasoning: string
  estimated_duration: string
  dependencies: string[]
}
```

## 🎨 Frontend Implementation

### 1. New Stage Tab Component
```typescript
// components/StagingTab.tsx
interface StagingTabProps {
  project_id: string
}

const StagingTab: React.FC<StagingTabProps> = ({ project_id }) => {
  const [stageBatches, setStageBatches] = useState<StageBatch[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  return (
    <div className="staging-container">
      {/* Available Tasks Column */}
      <div className="available-tasks">
        <h3>Available for Staging</h3>
        <TaskList
          tasks={availableTasks}
          onDragStart={setDraggedTask}
          filters={['todo']}
        />
      </div>

      {/* Staged Batches Columns */}
      <div className="staged-batches">
        {stageBatches.map(batch => (
          <StageBatchColumn
            key={batch.id}
            batch={batch}
            onDrop={handleTaskDrop}
            onPromote={handleBatchPromote}
          />
        ))}

        {/* New Batch Column */}
        <CreateBatchColumn onCreateBatch={handleCreateBatch} />
      </div>
    </div>
  )
}
```

### 2. Stage Batch Column Component
```typescript
// components/StageBatchColumn.tsx
interface StageBatchColumnProps {
  batch: StageBatch
  onDrop: (taskId: string, batchId: string) => void
  onPromote: (batchId: string) => void
}

const StageBatchColumn: React.FC<StageBatchColumnProps> = ({
  batch,
  onDrop,
  onPromote
}) => {
  const canPromote = batch.can_promote && batch.tasks.length > 0

  return (
    <div className="stage-batch-column">
      <div className="batch-header">
        <h4>{batch.name}</h4>
        <span className="task-count">{batch.tasks.length}/{batch.max_parallel_tasks}</span>

        {canPromote && (
          <button
            onClick={() => onPromote(batch.id)}
            className="promote-btn"
          >
            ▶️ Start Batch
          </button>
        )}
      </div>

      <div
        className="drop-zone"
        onDrop={(e) => handleDrop(e, batch.id)}
        onDragOver={handleDragOver}
      >
        {batch.tasks.map(task => (
          <StagedTaskCard key={task.id} task={task} />
        ))}

        {batch.tasks.length === 0 && (
          <div className="empty-stage">
            Drop tasks here to stage for parallel execution
          </div>
        )}
      </div>

      <div className="batch-controls">
        <span className="estimated-duration">
          Est: {batch.estimated_duration}
        </span>
        <button onClick={() => editBatch(batch.id)}>⚙️</button>
      </div>
    </div>
  )
}
```

### 3. Enhanced Task Card with Staging Info
```typescript
// components/StagedTaskCard.tsx
interface StagedTaskCardProps {
  task: Task
}

const StagedTaskCard: React.FC<StagedTaskCardProps> = ({ task }) => {
  return (
    <div className="staged-task-card">
      <div className="task-header">
        <span className="task-title">{task.title}</span>
        <span className="assignee-badge">{task.assignee}</span>
      </div>

      <div className="task-meta">
        <span className="priority">P{task.stage_priority}</span>
        <span className="estimated-duration">{task.estimated_duration}</span>
      </div>

      {task.prerequisites && (
        <div className="prerequisites">
          <span className="prereq-label">Depends on:</span>
          {task.prerequisites.map(dep => (
            <span key={dep} className="prereq-tag">{dep}</span>
          ))}
        </div>
      )}

      <div className="task-actions">
        <button onClick={() => unstageTask(task.id)}>❌</button>
        <button onClick={() => editStagedTask(task.id)}>✏️</button>
      </div>
    </div>
  )
}
```

## 🤖 Automation Logic

### 1. Auto-Promotion Service
```typescript
// services/StagingAutomationService.ts
class StagingAutomationService {

  async checkBatchCompletion(projectId: string): Promise<void> {
    const activeTasks = await this.getActiveTasks(projectId)
    const completedBatches = await this.getCompletedBatches(projectId)

    for (const batch of completedBatches) {
      if (batch.auto_promote) {
        await this.promoteNextStagedBatch(projectId, batch.id)
      }
    }
  }

  async promoteNextStagedBatch(projectId: string, completedBatchId?: string): Promise<void> {
    const nextBatch = await this.getNextStagedBatch(projectId)

    if (!nextBatch) return

    // Check prerequisites
    const prerequisitesMet = await this.checkPrerequisites(nextBatch)
    if (!prerequisitesMet) return

    // Check resource availability
    const availableResources = await this.checkResourceAvailability(nextBatch)
    if (!availableResources) return

    // Promote batch
    await this.promoteBatchToDoing(nextBatch.id)

    // Notify stakeholders
    await this.notifyBatchPromotion(nextBatch)
  }

  async autoSuggestNextBatch(projectId: string): Promise<Task[]> {
    const availableTasks = await this.getAvailableTasks(projectId)
    const dependencies = await this.analyzeDependencies(availableTasks)
    const resourceCapacity = await this.getResourceCapacity(projectId)

    return this.selectOptimalTaskBatch(availableTasks, dependencies, resourceCapacity)
  }
}
```

### 2. Dependency Validation
```typescript
// services/DependencyValidator.ts
class DependencyValidator {

  async validateStagingEligibility(taskIds: string[]): Promise<ValidationResult> {
    const tasks = await this.getTasks(taskIds)
    const issues: string[] = []

    for (const task of tasks) {
      // Check if prerequisites are completed
      const prereqsMet = await this.checkPrerequisites(task)
      if (!prereqsMet) {
        issues.push(`${task.title}: Prerequisites not met`)
      }

      // Check resource availability
      const resourceAvailable = await this.checkResourceAvailability(task)
      if (!resourceAvailable) {
        issues.push(`${task.title}: Assignee overloaded`)
      }

      // Check for circular dependencies
      const circularDeps = await this.checkCircularDependencies(task, tasks)
      if (circularDeps.length > 0) {
        issues.push(`${task.title}: Circular dependency detected`)
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings: await this.generateWarnings(tasks)
    }
  }
}
```

## 📱 UI/UX Specifications

### 1. Visual Design
```scss
// staging-tab.scss
.staging-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 100px);
  overflow-x: auto;

  .available-tasks {
    width: 300px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;

    .task-item {
      cursor: grab;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      &.dragging {
        opacity: 0.5;
      }
    }
  }

  .staged-batches {
    display: flex;
    gap: 16px;
    flex: 1;

    .stage-batch-column {
      width: 280px;
      background: white;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 16px;

      &.can-promote {
        border-color: #28a745;
        background: #f8fff9;
      }

      &.drag-over {
        border-color: #007bff;
        background: #f0f8ff;
      }

      .batch-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .promote-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: #218838;
          }
        }
      }

      .drop-zone {
        min-height: 300px;
        border: 1px dashed #ccc;
        border-radius: 4px;
        padding: 8px;

        .empty-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c757d;
          text-align: center;
          font-style: italic;
        }
      }
    }
  }
}

.staged-task-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .task-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    .task-title {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.3;
    }

    .assignee-badge {
      background: #007bff;
      color: white;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
    }
  }

  .prerequisites {
    margin: 8px 0;

    .prereq-tag {
      background: #ffc107;
      color: #212529;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      margin-right: 4px;
    }
  }
}
```

### 2. Interactive Features
- **Drag & Drop:** Smooth task movement between columns
- **Visual Feedback:** Highlight drop zones, show task counts
- **Batch Validation:** Real-time dependency checking
- **Progress Indicators:** Show batch completion status
- **Auto-suggestions:** AI-powered next batch recommendations

## 🔄 Integration Points

### 1. Existing Task Management
```typescript
// Extend existing TaskService
class TaskService {

  async stageTask(taskId: string, batchId?: string): Promise<void> {
    await this.updateTaskStatus(taskId, 'staged', {
      staged_at: new Date(),
      stage_batch_id: batchId
    })
  }

  async promoteStagedBatch(batchId: string): Promise<void> {
    const tasks = await this.getStagedTasksByBatch(batchId)

    for (const task of tasks) {
      await this.updateTaskStatus(task.id, 'doing', {
        started_at: new Date()
      })
    }
  }
}
```

### 2. Notifications Integration
```typescript
// Extend notification system
interface StagingNotification {
  type: 'batch_ready' | 'batch_promoted' | 'staging_suggestion'
  batch_id: string
  message: string
  action_url: string
}

class NotificationService {

  async notifyBatchReady(batchId: string): Promise<void> {
    const batch = await this.getStageBatch(batchId)

    await this.send({
      type: 'batch_ready',
      title: `Batch "${batch.name}" Ready for Promotion`,
      message: `${batch.tasks.length} tasks staged and ready to start`,
      action_url: `/projects/${batch.project_id}/staging`
    })
  }
}
```

## 🧪 Testing Strategy

### 1. Unit Tests
```typescript
// tests/staging.test.ts
describe('Staging System', () => {

  test('should stage tasks successfully', async () => {
    const taskIds = ['task1', 'task2', 'task3']
    const batchId = await stagingService.createBatch('Test Batch')

    await stagingService.stageTasks(taskIds, batchId)

    const batch = await stagingService.getBatch(batchId)
    expect(batch.tasks).toHaveLength(3)
    expect(batch.tasks.every(t => t.status === 'staged')).toBe(true)
  })

  test('should auto-promote when batch completes', async () => {
    // Setup staged batch
    const batchId = await setupStagedBatch()

    // Complete current batch
    await completeCurrentBatch()

    // Verify auto-promotion
    const promotedTasks = await getPromotedTasks()
    expect(promotedTasks).toHaveLength(3)
  })
})
```

### 2. Integration Tests
```typescript
// tests/staging-integration.test.ts
describe('Staging Integration', () => {

  test('should handle complete workflow', async () => {
    // Create project with tasks
    const project = await createTestProject()

    // Stage first batch
    await stageFirstBatch(project.id)

    // Promote and complete
    await promoteBatch()
    await completeBatch()

    // Verify auto-promotion of next batch
    const nextBatch = await getActiveBatch(project.id)
    expect(nextBatch).toBeDefined()
  })
})
```

## 📈 Success Metrics

### 1. Performance Metrics
- **Staging Time:** <500ms to stage 10 tasks
- **Promotion Time:** <1s to promote entire batch
- **UI Responsiveness:** <100ms drag & drop feedback
- **Auto-suggestion Time:** <2s for AI recommendations

### 2. User Experience Metrics
- **Workflow Efficiency:** 50% reduction in task coordination time
- **Parallel Execution:** 3x increase in simultaneous active tasks
- **Bottleneck Prevention:** 90% reduction in idle time between batches
- **User Adoption:** 80% of project managers using staging within 1 week

## 🚀 Implementation Priority

### Phase 1: Core Staging (Week 1)
- Database schema updates
- Basic staging API endpoints
- Simple drag & drop UI
- Manual batch promotion

### Phase 2: Automation (Week 2)
- Auto-promotion logic
- Dependency validation
- Batch completion detection
- Basic notifications

### Phase 3: Intelligence (Week 3)
- AI-powered auto-suggestions
- Resource optimization
- Advanced dependency analysis
- Performance analytics

### Phase 4: Polish (Week 4)
- Enhanced UI/UX
- Advanced automation rules
- Comprehensive testing
- Documentation and training

---

**Ready for implementation! This staging system will transform Archon into a true parallel execution orchestration platform.**