#!/bin/bash

# BMad-Archon Synchronization Script
# Ensures both systems stay in sync

echo "========================================="
echo "  BMad-Archon Synchronization"
echo "========================================="
echo ""

# Check if Archon is accessible
check_archon() {
    if curl -s http://localhost:8051/health > /dev/null 2>&1; then
        echo "✓ Archon server is accessible"
        return 0
    else
        echo "✗ Archon server not accessible at http://localhost:8051"
        return 1
    fi
}

# Read project configuration
read_config() {
    if [ -f "archon-config.yaml" ]; then
        PROJECT_ID=$(grep "archon_project_id:" archon-config.yaml | cut -d'"' -f2)
        if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "" ]; then
            echo "⚠ No Archon project ID found in configuration"
            echo "  Please create an Archon project first"
            return 1
        fi
        echo "✓ Found Archon project ID: $PROJECT_ID"
        return 0
    else
        echo "✗ archon-config.yaml not found"
        return 1
    fi
}

# Sync BMad documents to Archon knowledge base
sync_documents() {
    echo ""
    echo "Syncing documents to Archon knowledge base..."

    # Find all markdown documents
    DOCS=$(find docs .bmad-core/data -name "*.md" -type f 2>/dev/null)

    if [ -z "$DOCS" ]; then
        echo "  No documents to sync"
        return 0
    fi

    echo "  Found documents to sync:"
    echo "$DOCS" | while read doc; do
        echo "    - $doc"
    done

    echo ""
    echo "  To sync these documents to Archon:"
    echo "  1. In your AI assistant, use:"
    echo "     archon:upload_document(file_path=\"$doc\")"
    echo "  2. Or drag and drop into Archon UI Knowledge Base"
}

# Check task synchronization
check_tasks() {
    echo ""
    echo "Checking task synchronization..."

    # Count BMad tasks
    if [ -d ".bmad-core/tasks" ]; then
        BMAD_TASKS=$(ls -1 .bmad-core/tasks/*.md 2>/dev/null | wc -l)
        echo "  BMad tasks defined: $BMAD_TASKS"
    else
        echo "  No BMad tasks directory found"
    fi

    echo ""
    echo "  To view Archon tasks for this project:"
    echo "  archon:manage_task("
    echo "    action=\"list\","
    echo "    filter_by=\"project\","
    echo "    filter_value=\"$PROJECT_ID\""
    echo "  )"
}

# Suggest synchronization actions
suggest_actions() {
    echo ""
    echo "========================================="
    echo "  Suggested Synchronization Actions"
    echo "========================================="
    echo ""
    echo "1. Update Archon Knowledge Base:"
    echo "   - Upload new BMad documents"
    echo "   - Crawl relevant documentation sites"
    echo ""
    echo "2. Synchronize Tasks:"
    echo "   - Create Archon tasks for BMad workflows"
    echo "   - Update task statuses"
    echo ""
    echo "3. Verify Integration:"
    echo "   - Test BMad agent Archon commands"
    echo "   - Confirm knowledge queries work"
    echo ""
    echo "4. Run in your AI assistant:"
    echo "   archon:get_available_sources()"
    echo "   archon:manage_project(action=\"get\", project_id=\"$PROJECT_ID\")"
}

# Generate sync report
generate_report() {
    echo ""
    echo "Generating sync report..."

    REPORT_FILE="sync-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "BMad-Archon Sync Report"
        echo "Generated: $(date)"
        echo ""
        echo "Project Configuration:"
        echo "  Project ID: $PROJECT_ID"
        echo "  Archon Server: http://localhost:8051"
        echo ""
        echo "BMad Resources:"
        echo "  Agents: $(ls -1 .bmad-core/agents/*.md 2>/dev/null | wc -l)"
        echo "  Tasks: $(ls -1 .bmad-core/tasks/*.md 2>/dev/null | wc -l)"
        echo "  Templates: $(ls -1 .bmad-core/templates/*.yaml 2>/dev/null | wc -l)"
        echo "  Checklists: $(ls -1 .bmad-core/checklists/*.md 2>/dev/null | wc -l)"
        echo ""
        echo "Documents:"
        find docs .bmad-core/data -name "*.md" -type f 2>/dev/null | while read doc; do
            echo "  - $doc ($(wc -l < "$doc") lines)"
        done
        echo ""
        echo "Recommendations:"
        echo "  1. Ensure all BMad tasks have corresponding Archon tasks"
        echo "  2. Upload important documents to Archon knowledge base"
        echo "  3. Keep task statuses synchronized between systems"
    } > "$REPORT_FILE"

    echo "  Report saved to: $REPORT_FILE"
}

# Main execution
main() {
    echo "Starting synchronization check..."
    echo ""

    # Check Archon accessibility
    if ! check_archon; then
        echo ""
        echo "Please start Archon server and try again"
        echo "Run: cd ../Archon && docker compose up -d"
        exit 1
    fi

    # Read configuration
    if ! read_config; then
        echo ""
        echo "Please configure your project first"
        echo "Run: ./init-project.sh"
        exit 1
    fi

    # Run synchronization checks
    sync_documents
    check_tasks

    # Generate report
    generate_report

    # Show suggestions
    suggest_actions

    echo ""
    echo "Synchronization check complete!"
}

# Run main function
main