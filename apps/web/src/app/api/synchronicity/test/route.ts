import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SynchronicityService } from '@/lib/synchronicityService'

// GET /api/synchronicity/test - Test endpoint to verify all synchronicity functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runFullTest = searchParams.get('full') === 'true'

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - please authenticate first' }, { status: 401 })
    }

    const testResults: any = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      tests: {},
      status: 'success'
    }

    try {
      // Test 1: Database connectivity
      const { data: dbTest, error: dbError } = await supabase
        .from('synchronicity_entries')
        .select('count')
        .eq('user_id', user.id)
        .limit(1)

      testResults.tests.databaseConnectivity = {
        status: dbError ? 'failed' : 'passed',
        error: dbError?.message,
        note: 'Testing connection to synchronicity_entries table'
      }

      // Test 2: Basic CRUD operations
      if (!dbError && runFullTest) {
        // Create test entry
        const testEntry = {
          title: 'Test Synchronicity Entry',
          description: 'This is a test entry for API validation',
          date: new Date(),
          tags: ['test', 'api-validation'],
          significance: 7,
          context: 'API testing environment',
          emotions: ['curious', 'hopeful']
        }

        const service = new SynchronicityService(user.id)

        try {
          // CREATE
          const createdEntry = await service.createEntry(testEntry)
          testResults.tests.createEntry = {
            status: 'passed',
            entryId: createdEntry.id,
            note: 'Successfully created test entry'
          }

          // READ
          const fetchedEntry = await service.getEntry(createdEntry.id)
          testResults.tests.readEntry = {
            status: fetchedEntry ? 'passed' : 'failed',
            note: 'Successfully fetched created entry'
          }

          // UPDATE
          const updatedEntry = await service.updateEntry(createdEntry.id, {
            significance: 8,
            tags: ['test', 'api-validation', 'updated']
          })
          testResults.tests.updateEntry = {
            status: updatedEntry.significance === 8 ? 'passed' : 'failed',
            note: 'Successfully updated entry significance and tags'
          }

          // LIST
          const { entries } = await service.getEntries({ limit: 10 })
          testResults.tests.listEntries = {
            status: entries.length >= 1 ? 'passed' : 'failed',
            count: entries.length,
            note: 'Successfully listed entries'
          }

          // DELETE
          const deleted = await service.deleteEntry(createdEntry.id)
          testResults.tests.deleteEntry = {
            status: deleted ? 'passed' : 'failed',
            note: 'Successfully deleted test entry'
          }

        } catch (crudError) {
          testResults.tests.crudOperations = {
            status: 'failed',
            error: crudError instanceof Error ? crudError.message : 'Unknown CRUD error'
          }
        }

        // Test 3: Pattern discovery (if user has entries)
        try {
          const patterns = await service.discoverPatterns()
          testResults.tests.patternDiscovery = {
            status: 'passed',
            patternsFound: patterns.length,
            note: 'Pattern discovery service is functional'
          }
        } catch (patternError) {
          testResults.tests.patternDiscovery = {
            status: 'failed',
            error: patternError instanceof Error ? patternError.message : 'Pattern discovery failed'
          }
        }

        // Test 4: Statistics calculation
        try {
          const stats = await service.getStats()
          testResults.tests.statisticsCalculation = {
            status: 'passed',
            totalEntries: stats.totalEntries,
            averageSignificance: stats.averageSignificance,
            note: 'Statistics calculation is functional'
          }
        } catch (statsError) {
          testResults.tests.statisticsCalculation = {
            status: 'failed',
            error: statsError instanceof Error ? statsError.message : 'Statistics calculation failed'
          }
        }

        // Test 5: Correlation analysis
        try {
          const correlations = await service.getCorrelations('tags')
          testResults.tests.correlationAnalysis = {
            status: 'passed',
            correlationsFound: correlations.tagCorrelations?.length || 0,
            note: 'Correlation analysis is functional'
          }
        } catch (correlationError) {
          testResults.tests.correlationAnalysis = {
            status: 'failed',
            error: correlationError instanceof Error ? correlationError.message : 'Correlation analysis failed'
          }
        }

        // Test 6: API endpoints
        const apiTests = await testApiEndpoints()
        testResults.tests.apiEndpoints = apiTests

      } else if (!runFullTest) {
        testResults.tests.note = 'Basic connectivity test only. Use ?full=true for comprehensive testing.'
      }

      // Check if any tests failed
      const failedTests = Object.values(testResults.tests).filter((test: any) =>
        typeof test === 'object' && test.status === 'failed'
      )

      if (failedTests.length > 0) {
        testResults.status = 'partial-failure'
        testResults.failedTestCount = failedTests.length
      }

    } catch (error) {
      testResults.status = 'error'
      testResults.error = error instanceof Error ? error.message : 'Unknown test error'
    }

    const statusCode = testResults.status === 'success' ? 200 :
                      testResults.status === 'partial-failure' ? 207 : 500

    return NextResponse.json(testResults, { status: statusCode })

  } catch (error) {
    console.error('Synchronicity test endpoint error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper function to test API endpoints
async function testApiEndpoints() {
  const results: any = {}

  try {
    // Test entries endpoint
    const entriesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/synchronicity/entries?limit=1`)
    results.entriesEndpoint = {
      status: entriesResponse.ok ? 'passed' : 'failed',
      statusCode: entriesResponse.status,
      note: 'GET /api/synchronicity/entries'
    }
  } catch (error) {
    results.entriesEndpoint = {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown API error'
    }
  }

  try {
    // Test patterns endpoint
    const patternsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/synchronicity/patterns?limit=1`)
    results.patternsEndpoint = {
      status: patternsResponse.ok ? 'passed' : 'failed',
      statusCode: patternsResponse.status,
      note: 'GET /api/synchronicity/patterns'
    }
  } catch (error) {
    results.patternsEndpoint = {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown API error'
    }
  }

  try {
    // Test stats endpoint
    const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/synchronicity/stats`)
    results.statsEndpoint = {
      status: statsResponse.ok ? 'passed' : 'failed',
      statusCode: statsResponse.status,
      note: 'GET /api/synchronicity/stats'
    }
  } catch (error) {
    results.statsEndpoint = {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown API error'
    }
  }

  try {
    // Test correlations endpoint
    const correlationsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/synchronicity/correlations?type=tags`)
    results.correlationsEndpoint = {
      status: correlationsResponse.ok ? 'passed' : 'failed',
      statusCode: correlationsResponse.status,
      note: 'GET /api/synchronicity/correlations'
    }
  } catch (error) {
    results.correlationsEndpoint = {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown API error'
    }
  }

  return results
}

// POST /api/synchronicity/test - Create test data for demonstration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { createSampleData = false } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!createSampleData) {
      return NextResponse.json({
        message: 'Use { "createSampleData": true } to create sample synchronicity entries'
      })
    }

    const service = new SynchronicityService(user.id)

    // Sample synchronicity entries
    const sampleEntries = [
      {
        title: '11:11 During Important Call',
        description: 'Noticed the clock showing 11:11 right as my therapist mentioned following my intuition',
        date: new Date(),
        tags: ['time-synchronicity', 'therapy', 'intuition'],
        significance: 8,
        context: 'Virtual therapy session, home office',
        emotions: ['surprised', 'hopeful', 'guided']
      },
      {
        title: 'Butterfly in Unexpected Place',
        description: 'A beautiful orange butterfly flew into my apartment through an open window while I was reading about transformation',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        tags: ['nature-signs', 'transformation', 'animals', 'books'],
        significance: 9,
        context: 'Living room, afternoon reading session',
        emotions: ['wonder', 'peaceful', 'connected', 'grateful']
      },
      {
        title: 'Perfect Parking Spot',
        description: 'Found a parking spot right in front of the coffee shop just as I was running late for an important meeting',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tags: ['timing', 'meetings', 'flow-state'],
        significance: 6,
        context: 'Downtown, busy morning',
        emotions: ['relieved', 'grateful', 'supported']
      },
      {
        title: 'Song on Radio',
        description: 'The exact song my grandmother used to sing came on the radio moments after I was thinking about her',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ['music', 'family', 'memories', 'grandmother'],
        significance: 10,
        context: 'Car, driving to work',
        emotions: ['emotional', 'connected', 'loved', 'nostalgic']
      },
      {
        title: 'Repeated Number 444',
        description: 'Saw 444 on license plate, receipt total, and building number all within an hour',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tags: ['angel-numbers', 'repeated-patterns', '444'],
        significance: 7,
        context: 'Running errands around town',
        emotions: ['curious', 'protected', 'aware']
      }
    ]

    const createdEntries = []

    for (const entryData of sampleEntries) {
      try {
        const entry = await service.createEntry(entryData)
        createdEntries.push(entry)
      } catch (error) {
        console.error('Error creating sample entry:', error)
      }
    }

    // Discover patterns in the new data
    let discoveredPatterns = []
    try {
      discoveredPatterns = await service.discoverPatterns()
    } catch (error) {
      console.error('Error discovering patterns:', error)
    }

    return NextResponse.json({
      message: 'Sample data created successfully',
      created: {
        entries: createdEntries.length,
        patterns: discoveredPatterns.length
      },
      data: {
        entries: createdEntries,
        patterns: discoveredPatterns
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating sample data:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create sample data'
    }, { status: 500 })
  }
}