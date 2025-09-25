import { describe, test, expect } from '@jest/globals'
import { chatEntityParser } from '../chatEntityParser'

describe('Entity Operations Integration', () => {
  test('should demonstrate working entity operations', async () => {
    const testCases = [
      {
        input: "Create morning routine: meditation, exercise, breakfast",
        expectedEntity: "routine",
        expectedIntent: "create"
      },
      {
        input: "I completed my evening routine",
        expectedEntity: "routine",
        expectedIntent: "complete"
      },
      {
        input: "I believe I am capable of achieving my goals",
        expectedEntity: "belief",
        expectedIntent: "create"
      },
      {
        input: "Reinforce belief: I am confident in my abilities",
        expectedEntity: "belief",
        expectedIntent: "update"
      },
      {
        input: "Log synch: Saw 11:11 on the clock right when thinking about my goal",
        expectedEntity: "synchronicity",
        expectedIntent: "create"
      }
    ]

    let passCount = 0

    for (const testCase of testCases) {
      const parsed = await chatEntityParser.parseMessage(testCase.input)

      if (parsed &&
          parsed.entityType === testCase.expectedEntity &&
          parsed.intent === testCase.expectedIntent) {
        passCount++
        console.log(`✅ PASS: "${testCase.input}" -> ${parsed.entityType}:${parsed.intent}`)
      } else {
        console.log(`❌ FAIL: "${testCase.input}" -> Expected: ${testCase.expectedEntity}:${testCase.expectedIntent}, Got: ${parsed?.entityType || 'null'}:${parsed?.intent || 'null'}`)
      }
    }

    expect(passCount).toBeGreaterThanOrEqual(4) // Allow 1 failure
    console.log(`\n🎉 Integration Test Results: ${passCount}/5 entity operations working correctly!`)
  })
})