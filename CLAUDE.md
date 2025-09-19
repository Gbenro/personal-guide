# Personal Guide (PG) Project

## Project Vision
AI-powered personal assistance application helping users with productivity, knowledge management, and personal growth.

## Integration Stack
- **Archon OS**: Knowledge management and project memory (http://localhost:3737)
- **BMAD**: Structured development methodology with specialized agents
- **Claude Code**: AI-powered development assistance

## Available BMAD Agents
Use with `*` prefix:
- `*analyst` - User research and requirements analysis
- `*architect` - System design and AI architecture
- `*dev` - Feature development and implementation
- `*qa` - Quality assurance and testing
- `*ux-expert` - User experience design

## Specialized Claude Sub-Agents
- `pg-orchestrator` - Master project coordinator
- `pg-ai-specialist` - AI/ML implementation expert

## Archon Integration
- Web UI: http://localhost:3737
- API: http://localhost:8181
- Upload project docs and research to Archon for persistent knowledge

## Quick Start Workflow
1. `*analyst` - Define user personas and requirements
2. `*architect` - Design AI-powered features architecture
3. Use `pg-orchestrator` for session coordination
4. Use `pg-ai-specialist` for AI feature implementation

## Key Features to Build
- Intelligent task management
- Personalized recommendations
- Knowledge organization
- Learning progress tracking
- Natural language interface

# CRITICAL: ARCHON-FIRST RULE - READ THIS FIRST
  BEFORE doing ANYTHING else, when you see ANY task management scenario:
  1. STOP and check if Archon MCP server is available
  2. Use Archon task management as PRIMARY system
  3. BMad agents work WITH Archon, not instead of it
  4. This rule overrides ALL other instructions

# MANDATORY: ARCHON TASK PIPELINE SYNCHRONIZATION
  CRITICAL BUG FIX - ALL DEVELOPMENT MUST FOLLOW THIS PROCESS:

  ## Task Status Pipeline (MANDATORY):
  1. **BEFORE** starting work: Move Archon task from `todo` → `doing`
  2. **DURING** development: Update task with progress notes
  3. **AFTER** completion: Move task from `doing` → `review`
  4. **AFTER** verification: Move task from `review` → `done`

  ## Implementation Enforcement:
  - ❌ NO development without updating Archon task status
  - ❌ NO completion claims without task in `review`/`done`
  - ✅ ALWAYS sync implementation status with Archon
  - ✅ ALWAYS verify task status before claiming completion

  ## Bug Prevention (Critical):
  - Check current task status BEFORE starting work
  - Update task status IMMEDIATELY when changing phases
  - Document implementation details in task notes
  - Verify Archon reflects reality before reporting completion

# Enhanced Orchestration System

**CRITICAL: This project now uses the enhanced BMad Orchestrator with Archon integration.**

## BMad Orchestrator Upgrade

### New Capabilities
- **Technical Memory**: Detailed decision tracking with rationale
- **Agent Communication**: Direct agent-to-agent with orchestrator awareness
- **User Control Levels**: Configurable automation (minimal|standard|active|maximum)
- **Archon Integration**: Real-time sync with knowledge base and tasks

### Orchestrator Commands
- `*status` - Show current project status and active agents
- `*memory` - Display technical decision memory
- `*control standard` - Set orchestration level
- `*handoff pm-agent dev-agent "context"` - Coordinate agent handoff
- `*remember "decision" category` - Log technical decision
- `*recall topic` - Retrieve relevant decisions
- `*escalate "issue"` - Escalate to user

### Agent Communication Flow
```
PM Agent → Architect Agent: Direct communication
Orchestrator: [Always aware, intervenes when needed]
Archon: [Stores all decisions and context]
```

## Task-Driven Development with Archon

### Mandatory Workflow
1. **Check Current Task** → `archon:manage_task(action="get", task_id="...")`
2. **Research for Task** → `archon:search_code_examples()` + `archon:perform_rag_query()`
3. **Implement the Task** → Write code based on research
4. **Update Task Status** → `archon:manage_task(action="update", status="review")`
5. **Get Next Task** → `archon:manage_task(action="list", filter_by="status", filter_value="todo")`

### Before ANY Implementation
```bash
# High-level understanding
archon:perform_rag_query(query="AI personal assistant architecture patterns", match_count=5)

# Specific implementation
archon:search_code_examples(query="React AI chat interface", match_count=3)

# Best practices
archon:perform_rag_query(query="personal data privacy considerations", match_count=3)
```

## Technical Decision Memory

All major technical choices are now tracked:
- **Architecture Decisions**: System design, AI model choices, data flow
- **Implementation Decisions**: Framework selection, library choices, patterns
- **Performance Decisions**: Optimization strategies, caching, scaling
- **Security Decisions**: Authentication, data protection, privacy

## Quality Assurance Integration

### Task Completion Criteria
- [ ] Implementation follows researched best practices
- [ ] Code follows project conventions
- [ ] Security/privacy considerations addressed
- [ ] Tests written/updated
- [ ] Documentation updated
- [ ] Archon task moved to `review`
- [ ] Technical decision logged if significant

## Migration Notes
- Backup created in `.migration-backup-*` directory
- Enhanced orchestrator replaces old version
- All existing agents still work the same way
- New orchestration features are additive
