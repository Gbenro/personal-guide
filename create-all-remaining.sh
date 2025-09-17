#!/bin/bash

# Batch create all remaining subtasks for Personal Guide
PROJECT_ID="13d82d10-9563-48ef-a5f8-316f1a4e2f50"

# Phase 5 - PWA (7 subtasks)
curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.1 Service Worker Creation","description":"Create service worker with caching strategies","status":"pending","priority":"high","assignee":"*pwa-specialist","metadata":{"parent_phase":"Phase 5","command":"*pwa-specialist create-service-worker","estimated_hours":8}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.2 Offline Queue System","description":"Implement offline queue for data operations","status":"pending","priority":"high","assignee":"*pwa-specialist","metadata":{"parent_phase":"Phase 5","command":"*pwa-specialist implement-offline","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.3 Background Sync Manager","description":"Build sync manager for entries","status":"pending","priority":"high","assignee":"*pwa-specialist","metadata":{"parent_phase":"Phase 5","command":"*pwa-specialist sync-strategy","estimated_hours":8}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.4 Conflict Resolution Logic","description":"Create conflict resolution for sync","status":"pending","priority":"high","assignee":"*dev","metadata":{"parent_phase":"Phase 5","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.5 PWA Installation Flow","description":"Add PWA installation experience","status":"pending","priority":"high","assignee":"*pwa-specialist","metadata":{"parent_phase":"Phase 5","command":"*pwa-specialist install-flow","estimated_hours":4}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.6 Optimistic UI Updates","description":"Implement optimistic UI system","status":"pending","priority":"high","assignee":"*dev","metadata":{"parent_phase":"Phase 5","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"5.7 Sync Status Indicators","description":"Create sync status UI components","status":"pending","priority":"high","assignee":"*dev","metadata":{"parent_phase":"Phase 5","estimated_hours":4}}' &

# Phase 6 - Data Visualization (6 subtasks)
curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"6.1 Reflection Engine","description":"Build AI reflection generation engine","status":"pending","priority":"high","assignee":"*ai-integration-specialist","metadata":{"parent_phase":"Phase 6","command":"*ai-integration-specialist create-reflection-engine","estimated_hours":8}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"6.2 Mood Trend Charts","description":"Create mood trend visualizations","status":"pending","priority":"high","assignee":"*data-visualization-specialist","metadata":{"parent_phase":"Phase 6","command":"*data-visualization-specialist create-mood-trends","estimated_hours":10}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"6.3 Insights Dashboard","description":"Build analytics dashboard","status":"pending","priority":"high","assignee":"*data-visualization-specialist","metadata":{"parent_phase":"Phase 6","command":"*data-visualization-specialist create-insights-dashboard","estimated_hours":10}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"6.4 Pattern Correlation Engine","description":"Implement pattern detection system","status":"pending","priority":"high","assignee":"*data-visualization-specialist","metadata":{"parent_phase":"Phase 6","command":"*data-visualization-specialist correlation-engine","estimated_hours":8}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"6.5 Reflections Tab UI","description":"Create reflections browsing interface","status":"pending","priority":"high","assignee":"*dev","metadata":{"parent_phase":"Phase 6","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"6.6 Data Export System","description":"Add data export functionality","status":"pending","priority":"high","assignee":"*data-visualization-specialist","metadata":{"parent_phase":"Phase 6","command":"*data-visualization-specialist design-export-system","estimated_hours":6}}' &

wait

# Phase 7 - Performance & Testing (7 subtasks) 
curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.1 PWA Performance Audit","description":"Conduct PWA performance audit","status":"pending","priority":"medium","assignee":"*pwa-specialist","metadata":{"parent_phase":"Phase 7","command":"*pwa-specialist audit-pwa","estimated_hours":4}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.2 Bundle Optimization","description":"Optimize bundle size and loading","status":"pending","priority":"medium","assignee":"*pwa-specialist","metadata":{"parent_phase":"Phase 7","command":"*pwa-specialist optimize-performance","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.3 Unit Test Suite","description":"Write comprehensive unit tests","status":"pending","priority":"medium","assignee":"*qa","metadata":{"parent_phase":"Phase 7","command":"*qa test-design","estimated_hours":10}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.4 Integration Tests","description":"Create integration tests for API","status":"pending","priority":"medium","assignee":"*qa","metadata":{"parent_phase":"Phase 7","estimated_hours":8}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.5 E2E Test Suite","description":"Build E2E tests for critical paths","status":"pending","priority":"medium","assignee":"*qa","metadata":{"parent_phase":"Phase 7","estimated_hours":12}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.6 Error Tracking Setup","description":"Set up Sentry error tracking","status":"pending","priority":"medium","assignee":"*dev","metadata":{"parent_phase":"Phase 7","estimated_hours":4}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"7.7 Performance Monitoring","description":"Implement performance monitoring","status":"pending","priority":"medium","assignee":"*dev","metadata":{"parent_phase":"Phase 7","estimated_hours":6}}' &

# Phase 8 - Deployment (6 subtasks)
curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"8.1 GitHub Actions Pipeline","description":"Set up comprehensive CI/CD pipeline","status":"pending","priority":"medium","assignee":"*devops-specialist","metadata":{"parent_phase":"Phase 8","command":"*devops-specialist setup-github-actions","estimated_hours":8}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"8.2 Multi-Environment Setup","description":"Configure dev, staging, production environments","status":"pending","priority":"medium","assignee":"*devops-specialist","metadata":{"parent_phase":"Phase 8","command":"*devops-specialist configure-environments","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"8.3 Monitoring Implementation","description":"Implement comprehensive monitoring","status":"pending","priority":"medium","assignee":"*devops-specialist","metadata":{"parent_phase":"Phase 8","command":"*devops-specialist implement-monitoring","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"8.4 Deployment & Rollback Strategy","description":"Create deployment automation","status":"pending","priority":"medium","assignee":"*devops-specialist","metadata":{"parent_phase":"Phase 8","command":"*devops-specialist create-rollback-strategy","estimated_hours":6}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"8.5 Secrets Management","description":"Set up secure secrets handling","status":"pending","priority":"medium","assignee":"*devops-specialist","metadata":{"parent_phase":"Phase 8","command":"*devops-specialist setup-secrets-management","estimated_hours":4}}' &

curl -X POST "http://localhost:8181/api/tasks" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","title":"8.6 Production Readiness Testing","description":"Production validation testing","status":"pending","priority":"medium","assignee":"*qa","metadata":{"parent_phase":"Phase 8","estimated_hours":8}}' &

wait

echo "All remaining subtasks created successfully!"