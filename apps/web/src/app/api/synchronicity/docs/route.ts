import { NextRequest, NextResponse } from 'next/server'

// GET /api/synchronicity/docs - API documentation endpoint
export async function GET(request: NextRequest) {
  const documentation = {
    title: 'Synchronicity Tracking API',
    version: '1.0.0',
    description: 'Comprehensive API for tracking synchronicities, discovering patterns, and analyzing correlations in meaningful coincidences.',
    baseUrl: '/api/synchronicity',
    authentication: 'Required: Supabase user authentication',

    endpoints: {
      entries: {
        path: '/entries',
        description: 'CRUD operations for synchronicity entries',
        methods: {
          GET: {
            description: 'List user\'s synchronicity entries with filtering and pagination',
            parameters: {
              limit: { type: 'number', default: 50, description: 'Number of entries to return' },
              offset: { type: 'number', default: 0, description: 'Number of entries to skip' },
              tags: { type: 'string', description: 'Comma-separated list of tags to filter by' },
              minSignificance: { type: 'number', default: 1, description: 'Minimum significance level (1-10)' },
              maxSignificance: { type: 'number', default: 10, description: 'Maximum significance level (1-10)' },
              startDate: { type: 'string', format: 'YYYY-MM-DD', description: 'Filter entries from this date' },
              endDate: { type: 'string', format: 'YYYY-MM-DD', description: 'Filter entries until this date' },
              search: { type: 'string', description: 'Search in title and description' }
            },
            response: {
              entries: 'Array of synchronicity entries',
              pagination: {
                limit: 'number',
                offset: 'number',
                total: 'number',
                hasMore: 'boolean'
              }
            },
            example: '/api/synchronicity/entries?limit=10&tags=nature-signs,transformation&minSignificance=7'
          },
          POST: {
            description: 'Create a new synchronicity entry',
            body: {
              title: { type: 'string', required: true, description: 'Brief title of the synchronicity' },
              description: { type: 'string', required: true, description: 'Detailed description of what happened' },
              date: { type: 'string', format: 'YYYY-MM-DD', required: true, description: 'Date when it occurred' },
              tags: { type: 'array', items: 'string', default: [], description: 'Descriptive tags' },
              significance: { type: 'number', min: 1, max: 10, required: true, description: 'Personal significance rating' },
              context: { type: 'string', required: true, description: 'Where/when it happened' },
              emotions: { type: 'array', items: 'string', default: [], description: 'Emotions felt during the experience' },
              patterns: { type: 'array', items: 'string', default: [], description: 'Associated pattern IDs' }
            },
            response: {
              entry: 'Created synchronicity entry object'
            }
          }
        }
      },

      individualEntry: {
        path: '/entries/{id}',
        description: 'Operations on specific synchronicity entries',
        methods: {
          GET: {
            description: 'Get a specific synchronicity entry',
            parameters: {
              id: { type: 'string', required: true, description: 'Entry UUID' }
            },
            response: {
              entry: 'Synchronicity entry object'
            }
          },
          PUT: {
            description: 'Update a specific synchronicity entry',
            parameters: {
              id: { type: 'string', required: true, description: 'Entry UUID' }
            },
            body: 'Partial synchronicity entry object (same fields as POST, all optional)',
            response: {
              entry: 'Updated synchronicity entry object'
            }
          },
          DELETE: {
            description: 'Delete a specific synchronicity entry',
            parameters: {
              id: { type: 'string', required: true, description: 'Entry UUID' }
            },
            response: {
              success: 'boolean'
            }
          }
        }
      },

      patterns: {
        path: '/patterns',
        description: 'Pattern discovery and management',
        methods: {
          GET: {
            description: 'List discovered patterns',
            parameters: {
              limit: { type: 'number', default: 20, description: 'Number of patterns to return' },
              offset: { type: 'number', default: 0, description: 'Number of patterns to skip' },
              minSignificance: { type: 'number', default: 1, description: 'Minimum significance level' },
              minFrequency: { type: 'number', default: 1, description: 'Minimum pattern frequency' }
            },
            response: {
              patterns: 'Array of discovered patterns',
              pagination: 'Pagination information'
            }
          },
          POST: {
            description: 'Create pattern or trigger auto-discovery',
            body: {
              action: { type: 'string', enum: ['discover'], description: 'Use "discover" for auto-discovery' },
              name: { type: 'string', description: 'Pattern name (for manual creation)' },
              description: { type: 'string', description: 'Pattern description (for manual creation)' },
              entry_ids: { type: 'array', items: 'string', description: 'Entry UUIDs (for manual creation)' },
              significance: { type: 'number', min: 1, max: 10, description: 'Pattern significance (for manual creation)' }
            },
            response: {
              patterns: 'Array of discovered/created patterns',
              message: 'Success message'
            },
            examples: {
              autoDiscovery: '{ "action": "discover" }',
              manualCreation: '{ "name": "Morning Synchronicities", "description": "Pattern of synchronicities in the morning", "entry_ids": ["uuid1", "uuid2"], "significance": 7 }'
            }
          }
        }
      },

      statistics: {
        path: '/stats',
        description: 'Statistical analysis of synchronicity data',
        methods: {
          GET: {
            description: 'Get comprehensive statistics',
            parameters: {
              timeframe: { type: 'string', enum: ['all', 'year', 'month', 'week'], default: 'all', description: 'Time period for analysis' },
              includePatterns: { type: 'boolean', default: false, description: 'Include pattern analysis' },
              includeCorrelations: { type: 'boolean', default: false, description: 'Include correlation analysis' }
            },
            response: {
              totalEntries: 'number',
              averageSignificance: 'number',
              mostCommonTags: 'array of strings',
              patternsDiscovered: 'number',
              streak: 'number (consecutive days)',
              additionalMetrics: {
                emotionAnalysis: 'Emotion frequency and patterns',
                temporalAnalysis: 'Time-based patterns',
                significanceDistribution: 'Distribution across significance levels',
                contextAnalysis: 'Common context themes',
                trends: 'Recent activity and significance trends'
              }
            },
            example: '/api/synchronicity/stats?timeframe=month&includePatterns=true'
          }
        }
      },

      correlations: {
        path: '/correlations',
        description: 'Correlation and pattern analysis',
        methods: {
          GET: {
            description: 'Analyze correlations in synchronicity data',
            parameters: {
              type: { type: 'string', enum: ['all', 'tags', 'emotions', 'temporal', 'significance'], default: 'all', description: 'Type of correlation analysis' },
              minConfidence: { type: 'number', default: 0.3, description: 'Minimum confidence level for correlations' },
              minOccurrences: { type: 'number', default: 3, description: 'Minimum occurrences for correlation validity' },
              timeframe: { type: 'string', description: 'Optional time period filter' }
            },
            response: {
              tagCorrelations: 'Array of tag co-occurrence patterns',
              emotionCorrelations: 'Array of emotion correlation patterns',
              temporalPatterns: 'Array of time-based patterns',
              significancePatterns: 'Analysis of significance level patterns'
            },
            examples: {
              tagAnalysis: '/api/synchronicity/correlations?type=tags&minConfidence=0.5',
              comprehensiveAnalysis: '/api/synchronicity/correlations?type=all&minOccurrences=2'
            }
          },
          POST: {
            description: 'Custom correlation analysis on specific entries',
            body: {
              entryIds: { type: 'array', items: 'string', description: 'Specific entry UUIDs to analyze' },
              analysisTypes: { type: 'array', items: 'string', default: ['tags', 'emotions'], description: 'Types of analysis to perform' },
              customParameters: { type: 'object', description: 'Custom analysis parameters' }
            },
            response: {
              customAnalysis: 'Analysis results based on specified parameters',
              entryIds: 'Analyzed entry IDs',
              analysisTypes: 'Types of analysis performed',
              generatedAt: 'Timestamp'
            }
          }
        }
      },

      testing: {
        path: '/test',
        description: 'Testing and validation endpoints',
        methods: {
          GET: {
            description: 'Test API functionality',
            parameters: {
              full: { type: 'boolean', default: false, description: 'Run comprehensive test suite' }
            },
            response: {
              status: 'Test result status',
              tests: 'Individual test results',
              timestamp: 'Test execution time'
            },
            examples: {
              basicTest: '/api/synchronicity/test',
              fullTest: '/api/synchronicity/test?full=true'
            }
          },
          POST: {
            description: 'Create sample data for testing',
            body: {
              createSampleData: { type: 'boolean', required: true, description: 'Set to true to create sample entries' }
            },
            response: {
              message: 'Success message',
              created: 'Number of entries and patterns created',
              data: 'Created entries and patterns'
            }
          }
        }
      }
    },

    dataTypes: {
      SynchronicityEntry: {
        id: { type: 'string', description: 'UUID identifier' },
        title: { type: 'string', description: 'Brief title' },
        description: { type: 'string', description: 'Detailed description' },
        date: { type: 'Date', description: 'Occurrence date' },
        tags: { type: 'array', items: 'string', description: 'Descriptive tags' },
        significance: { type: 'number', min: 1, max: 10, description: 'Personal significance rating' },
        context: { type: 'string', description: 'Situational context' },
        emotions: { type: 'array', items: 'string', description: 'Associated emotions' },
        patterns: { type: 'array', items: 'string', description: 'Associated pattern IDs' },
        createdAt: { type: 'Date', description: 'Creation timestamp' },
        updatedAt: { type: 'Date', description: 'Last update timestamp' }
      },

      SynchronicityPattern: {
        id: { type: 'string', description: 'UUID identifier' },
        name: { type: 'string', description: 'Pattern name' },
        description: { type: 'string', description: 'Pattern description' },
        entries: { type: 'array', items: 'string', description: 'Entry IDs in this pattern' },
        frequency: { type: 'number', description: 'Number of occurrences' },
        discoveredAt: { type: 'Date', description: 'Discovery timestamp' },
        significance: { type: 'number', min: 1, max: 10, description: 'Pattern significance' }
      },

      TagCorrelation: {
        tag1: { type: 'string', description: 'First tag' },
        tag2: { type: 'string', description: 'Second tag' },
        coOccurrences: { type: 'number', description: 'Number of co-occurrences' },
        confidence: { type: 'number', description: 'Confidence level (0-1)' },
        support: { type: 'number', description: 'Support level (0-1)' },
        lift: { type: 'number', description: 'Lift ratio' }
      },

      EmotionCorrelation: {
        emotion1: { type: 'string', description: 'First emotion' },
        emotion2: { type: 'string', description: 'Second emotion' },
        coOccurrences: { type: 'number', description: 'Number of co-occurrences' },
        confidence: { type: 'number', description: 'Confidence level (0-1)' },
        avgSignificanceTogether: { type: 'number', description: 'Average significance when both present' }
      }
    },

    errorCodes: {
      400: 'Bad Request - Invalid parameters or missing required fields',
      401: 'Unauthorized - Authentication required',
      404: 'Not Found - Entry or pattern not found',
      500: 'Internal Server Error - Server error occurred'
    },

    examples: {
      createEntry: {
        url: 'POST /api/synchronicity/entries',
        body: {
          title: '11:11 During Important Decision',
          description: 'Saw 11:11 on the clock right as I was deciding whether to apply for that new job. Felt like a clear sign to move forward.',
          date: '2024-01-15',
          tags: ['time-synchronicity', 'career', 'decision-making'],
          significance: 8,
          context: 'Home office, morning coffee',
          emotions: ['excited', 'hopeful', 'guided']
        }
      },

      searchEntries: {
        url: 'GET /api/synchronicity/entries?search=butterfly&tags=nature-signs&minSignificance=7',
        description: 'Search for entries containing "butterfly" with nature-signs tag and significance 7+'
      },

      discoverPatterns: {
        url: 'POST /api/synchronicity/patterns',
        body: { action: 'discover' },
        description: 'Automatically discover patterns in user\'s synchronicity entries'
      },

      getDetailedStats: {
        url: 'GET /api/synchronicity/stats?timeframe=month&includePatterns=true&includeCorrelations=true',
        description: 'Get comprehensive statistics for the current month including patterns and correlations'
      },

      analyzeTagCorrelations: {
        url: 'GET /api/synchronicity/correlations?type=tags&minConfidence=0.5&minOccurrences=3',
        description: 'Analyze tag correlations with minimum 50% confidence and 3+ occurrences'
      }
    },

    rateLimiting: {
      note: 'Currently no rate limiting implemented. Recommended for production: 100 requests per minute per user.',
      recommendations: [
        'Implement per-user rate limiting',
        'Cache frequently accessed statistics',
        'Use pagination for large datasets',
        'Implement request throttling for pattern discovery'
      ]
    },

    bestPractices: {
      efficiency: [
        'Use pagination for large datasets',
        'Filter by date ranges when possible',
        'Cache statistics and correlation results',
        'Batch pattern discovery operations'
      ],
      dataQuality: [
        'Ensure consistent tag naming conventions',
        'Use descriptive contexts for better analysis',
        'Maintain balanced significance ratings',
        'Include relevant emotions for richer analysis'
      ],
      privacy: [
        'All data is user-scoped and private',
        'No data sharing between users',
        'Row-level security enforced at database level',
        'Authentication required for all operations'
      ]
    },

    integrationGuide: {
      frontend: {
        hook: 'Use the useSynchronicity() React hook for easy integration',
        example: `
import { useSynchronicity } from '@/hooks/useSynchronicity'

function SynchronicityComponent() {
  const { entries, loading, createEntry, fetchEntries } = useSynchronicity()

  useEffect(() => {
    fetchEntries({ limit: 10 })
  }, [fetchEntries])

  return (
    <div>
      {loading ? 'Loading...' : entries.map(entry => (
        <div key={entry.id}>{entry.title}</div>
      ))}
    </div>
  )
}`
      },
      service: {
        description: 'Use the SynchronicityService class for backend operations',
        example: `
import { SynchronicityService } from '@/lib/synchronicityService'

const service = new SynchronicityService(userId)
const entries = await service.getEntries({ tags: ['nature-signs'] })
const patterns = await service.discoverPatterns()
const stats = await service.getStats('month')`
      }
    }
  }

  return NextResponse.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  })
}