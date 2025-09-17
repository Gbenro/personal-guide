# EXECUTION PROMPT: Archon Staging Feature Implementation

**TO:** Archon Development Team
**FROM:** Winston (Architect) - Personal Guide Project
**PRIORITY:** High
**ESTIMATED EFFORT:** 3-5 days
**IMPACT:** Enables 10x parallel execution efficiency

## 🎯 FEATURE REQUEST SUMMARY

Implement a **"Stage" tab** in Archon's task management interface that enables intelligent parallel task batch management. This feature will:

1. **Stage next parallel task batches** while current batch executes
2. **Auto-promote staged batches** when dependencies complete
3. **Prevent execution bottlenecks** through continuous workflow
4. **Enable 25+ simultaneous tasks** with intelligent orchestration

## 🚀 BUSINESS JUSTIFICATION

**Current Problem:**
- Only 1 task active out of 112 total (0.9% utilization)
- Manual task coordination creates bottlenecks
- No systematic way to prepare next parallel batch
- Sequential execution limits project velocity

**Solution Impact:**
- **25x increase** in parallel task execution
- **Automated workflow** prevents idle time
- **Intelligent staging** optimizes resource utilization
- **Continuous delivery** of project milestones

## 📋 IMPLEMENTATION REQUIREMENTS

### 1. DATABASE SCHEMA CHANGES

```sql
-- Add 'staged' status to existing task status enum
ALTER TYPE task_status ADD VALUE 'staged';

-- Add staging metadata to tasks table
ALTER TABLE tasks ADD COLUMN staged_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN stage_batch_id UUID;
ALTER TABLE tasks ADD COLUMN stage_priority INTEGER DEFAULT 0;

-- Create stage batches table
CREATE TABLE stage_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    batch_order INTEGER NOT NULL,
    max_parallel_tasks INTEGER DEFAULT 10,
    auto_promote BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_stage_batches_project_order ON stage_batches(project_id, batch_order);
CREATE INDEX idx_tasks_stage_batch ON tasks(stage_batch_id);
```

### 2. API ENDPOINTS (Required)

#### Core Staging Endpoints
```typescript
// GET /api/projects/{project_id}/stages - List stage batches
// POST /api/projects/{project_id}/stages - Create stage batch
// PUT /api/projects/{project_id}/stages/{batch_id} - Update batch
// DELETE /api/projects/{project_id}/stages/{batch_id} - Delete batch

// POST /api/tasks/stage - Move tasks to staged status
// POST /api/tasks/unstage - Move tasks back to todo
// POST /api/tasks/promote-batch - Start staged batch
```

#### Example API Implementation
```python
@app.post("/api/tasks/stage")
async def stage_tasks(request: StageTasksRequest):
    """Move tasks from todo to staged status"""
    for task_id in request.task_ids:
        await db.execute(
            "UPDATE tasks SET status = 'staged', staged_at = NOW(), stage_batch_id = ? WHERE id = ?",
            (request.stage_batch_id, task_id)
        )
    return {"success": True, "staged_count": len(request.task_ids)}

@app.post("/api/tasks/promote-batch")
async def promote_batch(batch_id: str):
    """Promote all staged tasks in batch to doing status"""
    await db.execute(
        "UPDATE tasks SET status = 'doing', started_at = NOW() WHERE stage_batch_id = ?",
        (batch_id,)
    )
    return {"success": True, "message": f"Batch {batch_id} promoted to active"}
```

### 3. FRONTEND UI COMPONENTS

#### New Stage Tab Component
```typescript
// Add to existing tabs: Overview | Tasks | Stage | Settings
const StagingTab = () => {
  return (
    <div className="staging-container">
      {/* Left Column: Available Tasks */}
      <div className="available-tasks">
        <h3>Ready to Stage</h3>
        <TaskList
          tasks={todoTasks}
          draggable={true}
          onDragStart={handleDragStart}
        />
      </div>

      {/* Right Columns: Stage Batches */}
      <div className="stage-batches">
        {stageBatches.map(batch => (
          <StageBatchColumn
            key={batch.id}
            batch={batch}
            onDrop={handleTaskDrop}
            onPromote={handleBatchPromote}
          />
        ))}
        <CreateBatchColumn />
      </div>
    </div>
  )
}
```

#### Drag & Drop Implementation
```typescript
const handleTaskDrop = async (taskId: string, batchId: string) => {
  // Visual feedback
  setDragging(false)

  // API call to stage task
  await fetch('/api/tasks/stage', {
    method: 'POST',
    body: JSON.stringify({
      task_ids: [taskId],
      stage_batch_id: batchId
    })
  })

  // Refresh UI
  await refreshStageData()
}
```

### 4. AUTOMATION LOGIC (Phase 2)

#### Auto-Promotion Service
```python
class StagingAutomationService:

    async def check_batch_completion(self, project_id: str):
        """Check if current batch is complete and promote next"""

        # Get current active tasks
        active_tasks = await self.get_active_tasks(project_id)

        # If no active tasks, promote next staged batch
        if len(active_tasks) == 0:
            next_batch = await self.get_next_staged_batch(project_id)
            if next_batch:
                await self.promote_batch(next_batch.id)
                await self.notify_batch_promotion(next_batch)

    async def promote_batch(self, batch_id: str):
        """Promote staged batch to active status"""
        await db.execute(
            "UPDATE tasks SET status = 'doing', started_at = NOW() WHERE stage_batch_id = ?",
            (batch_id,)
        )
```

## 🎨 UI/UX REQUIREMENTS

### Visual Design Specifications
```scss
.staging-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 100px);

  .available-tasks {
    width: 300px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
  }

  .stage-batches {
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

      .promote-btn {
        background: #28a745;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }
}
```

### Interactive Features
- **Drag & Drop:** Smooth task movement between columns
- **Visual Feedback:** Highlight valid drop zones
- **Batch Controls:** Create, edit, delete, promote buttons
- **Task Counts:** Show current/max tasks per batch
- **Status Indicators:** Ready to promote, waiting for dependencies

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Core Functionality (Days 1-2)
**PRIORITY: Critical - Must implement first**

1. **Database Schema:**
   - Add 'staged' status to task_status enum
   - Create stage_batches table
   - Add staging columns to tasks table

2. **Basic API Endpoints:**
   - POST /api/tasks/stage
   - POST /api/tasks/promote-batch
   - GET /api/projects/{id}/stages

3. **Simple UI:**
   - Add "Stage" tab to existing interface
   - Basic drag & drop for staging tasks
   - Manual batch promotion button

**Acceptance Criteria:**
- Can drag task from todo to staged status ✓
- Can create stage batches manually ✓
- Can promote staged batch to doing ✓

### Phase 2: Automation (Days 3-4)
**PRIORITY: High - Enables intelligent workflow**

1. **Auto-Promotion Logic:**
   - Monitor task completion
   - Auto-promote when batch complete
   - Dependency validation

2. **Enhanced UI:**
   - Visual batch status indicators
   - Estimated duration calculations
   - Batch readiness notifications

**Acceptance Criteria:**
- Auto-promotes next batch when current completes ✓
- Shows visual feedback for ready batches ✓
- Validates dependencies before promotion ✓

### Phase 3: Polish (Day 5)
**PRIORITY: Medium - User experience enhancement**

1. **Enhanced Features:**
   - Batch reordering
   - Task priority within batches
   - Auto-suggestions for next batch

2. **Performance:**
   - Optimize drag & drop animations
   - Cache stage data
   - Real-time updates

## 🧪 TESTING REQUIREMENTS

### Functional Tests
```python
def test_stage_tasks():
    """Test basic task staging functionality"""
    # Create test tasks
    task_ids = create_test_tasks(3)
    batch_id = create_stage_batch("Test Batch")

    # Stage tasks
    response = stage_tasks(task_ids, batch_id)

    # Verify
    assert response.status_code == 200
    assert get_task_status(task_ids[0]) == "staged"

def test_auto_promotion():
    """Test automatic batch promotion"""
    # Setup staged batch
    batch_id = setup_staged_batch()

    # Complete current active tasks
    complete_all_active_tasks()

    # Trigger automation check
    run_automation_service()

    # Verify promotion
    assert get_active_task_count() > 0
```

### Performance Tests
- Stage 10 tasks in <500ms
- Promote batch in <1s
- UI drag & drop response <100ms
- Auto-promotion detection <5s

## 📊 SUCCESS METRICS

### Immediate Metrics (Week 1)
- **10 tasks staged** in first batch
- **Sub-second promotion** response time
- **Zero manual coordination** needed
- **100% auto-promotion** success rate

### Long-term Metrics (Month 1)
- **25+ simultaneous tasks** regularly
- **50% reduction** in coordination overhead
- **3x increase** in project velocity
- **90% user adoption** across projects

## 🚨 CRITICAL SUCCESS FACTORS

### 1. **Database Performance**
- Index stage_batch queries properly
- Optimize status updates for bulk operations
- Cache frequently accessed stage data

### 2. **UI Responsiveness**
- Implement optimistic UI updates
- Use WebSocket for real-time stage updates
- Smooth drag & drop animations

### 3. **Automation Reliability**
- Robust dependency checking
- Failsafe mechanisms for stuck batches
- Clear error handling and recovery

## 📞 IMPLEMENTATION SUPPORT

### Technical Questions Contact:
- **Architect:** Winston (this conversation)
- **Project Context:** Personal Guide development
- **Integration:** Must work with existing task management

### Reference Implementation:
- **Full Specification:** `/docs/archon-staging-feature-implementation.md`
- **API Examples:** Provided in specification
- **UI Mockups:** Described in requirements

### Testing Data:
- **Test Project:** Personal Guide (ID: 13d82d10-9563-48ef-a5f8-316f1a4e2f50)
- **Sample Tasks:** 112 total tasks available for testing
- **Current Bottleneck:** Only 1 active task currently

## ⏰ DELIVERY EXPECTATIONS

### MVP Delivery (Phase 1): **3 days**
- Basic staging functionality working
- Manual batch creation and promotion
- Simple drag & drop interface

### Full Feature (Phase 2): **5 days**
- Auto-promotion automation
- Enhanced UI with indicators
- Dependency validation

### Production Ready: **1 week**
- Comprehensive testing complete
- Performance optimized
- Documentation provided

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Day 1 Morning:** Database schema implementation
2. **Day 1 Afternoon:** Basic API endpoints
3. **Day 2:** Simple UI with drag & drop
4. **Day 3:** Auto-promotion logic
5. **Day 4:** Enhanced UI and testing
6. **Day 5:** Polish and deployment

**START IMMEDIATELY** - This feature will unlock massive parallel execution gains for Personal Guide and demonstrate Archon's advanced project orchestration capabilities.

---

*Ready for implementation! This staging system transforms Archon from simple task management into intelligent parallel execution orchestration.*