// Test script for enhanced mood tracking via chat integration
// This verifies the new natural language patterns work correctly

import { chatEntityParser } from '../chatEntityParser'
import { EntityOperationHandler } from '../entityOperationHandler'

// Test cases for the enhanced mood detection patterns
const testCases = [
  // Format: "I am feeling happy today (8/10)"
  {
    input: "I am feeling happy today (8/10)",
    expectedIntent: 'create',
    expectedEntityType: 'mood',
    expectedMoodRating: 8,
    description: "Should detect mood rating from 'I am feeling happy today (8/10)'"
  },

  // Format: "Mood: excited about the presentation"
  {
    input: "Mood: excited about the presentation",
    expectedIntent: 'create',
    expectedEntityType: 'mood',
    expectedNotes: "excited about the presentation",
    description: "Should extract context from 'Mood: excited about the presentation'"
  },

  // Format: "Show mood trends"
  {
    input: "Show mood trends",
    expectedIntent: 'view',
    expectedEntityType: 'mood',
    expectedTrendQuery: true,
    description: "Should detect trend analysis request from 'Show mood trends'"
  },

  // Additional test cases
  {
    input: "I feel great (9/10)",
    expectedIntent: 'create',
    expectedEntityType: 'mood',
    expectedMoodRating: 9,
    description: "Should handle 'I feel great (9/10)'"
  },

  {
    input: "Mood: anxious about work 4/10",
    expectedIntent: 'create',
    expectedEntityType: 'mood',
    expectedMoodRating: 4,
    expectedNotes: "anxious about work",
    description: "Should extract both mood rating and notes"
  },

  {
    input: "How has my mood been trending?",
    expectedIntent: 'view',
    expectedEntityType: 'mood',
    expectedTrendQuery: true,
    description: "Should detect trend query from 'How has my mood been trending?'"
  },

  {
    input: "Feeling excited and energetic today",
    expectedIntent: 'create',
    expectedEntityType: 'mood',
    expectedMoodRating: 8, // 'excited' should map to ~8
    expectedEnergyLevel: 8, // 'energetic' should map to ~8
    description: "Should detect both mood and energy from descriptive words"
  }
]

// Helper function to run tests
async function runMoodChatTests() {
  console.log('🧪 Testing Enhanced Mood Chat Integration\n')

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`Test ${i + 1}: ${testCase.description}`)
    console.log(`Input: "${testCase.input}"`)

    try {
      // Parse the message
      const parsed = await chatEntityParser.parseMessage(testCase.input)

      if (!parsed) {
        console.log(`❌ FAIL: Could not parse message`)
        continue
      }

      // Check intent
      if (parsed.intent !== testCase.expectedIntent) {
        console.log(`❌ FAIL: Expected intent '${testCase.expectedIntent}', got '${parsed.intent}'`)
        continue
      }

      // Check entity type
      if (parsed.entityType !== testCase.expectedEntityType) {
        console.log(`❌ FAIL: Expected entity type '${testCase.expectedEntityType}', got '${parsed.entityType}'`)
        continue
      }

      // Check specific parameters
      let passed = true

      if (testCase.expectedMoodRating !== undefined) {
        if (parsed.parameters.mood_rating !== testCase.expectedMoodRating) {
          console.log(`❌ FAIL: Expected mood rating ${testCase.expectedMoodRating}, got ${parsed.parameters.mood_rating}`)
          passed = false
        }
      }

      if (testCase.expectedEnergyLevel !== undefined) {
        if (parsed.parameters.energy_level !== testCase.expectedEnergyLevel) {
          console.log(`❌ FAIL: Expected energy level ${testCase.expectedEnergyLevel}, got ${parsed.parameters.energy_level}`)
          passed = false
        }
      }

      if (testCase.expectedNotes !== undefined) {
        if (!parsed.parameters.notes || !parsed.parameters.notes.includes(testCase.expectedNotes)) {
          console.log(`❌ FAIL: Expected notes to contain '${testCase.expectedNotes}', got '${parsed.parameters.notes}'`)
          passed = false
        }
      }

      if (passed) {
        console.log(`✅ PASS: Correctly parsed with confidence ${parsed.confidence.toFixed(2)}`)
        console.log(`   Parameters: ${JSON.stringify(parsed.parameters, null, 2)}`)
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    }

    console.log('') // Empty line for readability
  }
}

// Export for potential use in other test files
export { testCases, runMoodChatTests }

// If running directly (for manual testing)
if (require.main === module) {
  runMoodChatTests().then(() => {
    console.log('🎉 Mood chat integration tests completed!')
  }).catch(console.error)
}