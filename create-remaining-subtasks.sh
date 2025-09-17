#!/bin/bash

# Script to create remaining subtasks for Personal Guide project
PROJECT_ID="13d82d10-9563-48ef-a5f8-316f1a4e2f50"
BASE_URL="http://localhost:8181/api/tasks"

# Phase 3 remaining subtasks (3.3 - 3.7)
echo "Creating Phase 3 remaining subtasks..."

curl -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{
  "project_id": "'$PROJECT_ID'",
  "title": "3.3 Personality System",
  "description": "Create personality modes with system prompts (Coach, Mentor, etc)",
  "status": "pending",
  "priority": "high",
  "assignee": "*ai-integration-specialist",
  "metadata": {
    "parent_phase": "Phase 3",
    "subtask_number": "3.3",
    "command": "*ai-integration-specialist create-personality-system",
    "estimated_hours": 10
  }
}'

curl -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{
  "project_id": "'$PROJECT_ID'",
  "title": "3.4 Mood Detection Service", 
  "description": "Implement sentiment analysis and mood detection",
  "status": "pending",
  "priority": "high",
  "assignee": "*ai-integration-specialist",
  "metadata": {
    "parent_phase": "Phase 3",
    "subtask_number": "3.4",
    "command": "*ai-integration-specialist implement-mood-detection",
    "estimated_hours": 8
  }
}'

curl -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{
  "project_id": "'$PROJECT_ID'",
  "title": "3.5 AI Response Caching",
  "description": "Build AI response caching with Redis",
  "status": "pending", 
  "priority": "high",
  "assignee": "*dev",
  "metadata": {
    "parent_phase": "Phase 3",
    "subtask_number": "3.5",
    "estimated_hours": 6
  }
}'

curl -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{
  "project_id": "'$PROJECT_ID'",
  "title": "3.6 AI Error Handling",
  "description": "Add comprehensive error handling and fallbacks",
  "status": "pending",
  "priority": "high", 
  "assignee": "*dev",
  "metadata": {
    "parent_phase": "Phase 3",
    "subtask_number": "3.6",
    "estimated_hours": 4
  }
}'

curl -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{
  "project_id": "'$PROJECT_ID'",
  "title": "3.7 Reflection Generation Engine",
  "description": "Create AI-powered reflection generation system",
  "status": "pending",
  "priority": "high",
  "assignee": "*ai-integration-specialist", 
  "metadata": {
    "parent_phase": "Phase 3",
    "subtask_number": "3.7",
    "command": "*ai-integration-specialist create-reflection-engine",
    "estimated_hours": 8
  }
}'

echo "Phase 3 subtasks created!"

# Continue with remaining phases...
echo "Script ready - run to create all remaining subtasks"