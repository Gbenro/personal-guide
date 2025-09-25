import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { chatEntityParser } from '../chatEntityParser'
import { EntityOperationHandler } from '../entityOperationHandler'

// Mock the services
jest.mock('../routinesService')
jest.mock('../beliefsService')
jest.mock('../synchronicityService')

describe('Entity Operations Chat Integration', () => {
  let handler: EntityOperationHandler
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    handler = new EntityOperationHandler(mockUserId)
    jest.clearAllMocks()
  })

  describe('Routines Chat Integration', () => {
    test('should parse morning routine creation', async () => {
      const message = "Create morning routine: meditation, exercise, breakfast"
      const parsed = await chatEntityParser.parseMessage(message)

      expect(parsed).toBeTruthy()
      expect(parsed?.entityType).toBe('routine')
      expect(parsed?.intent).toBe('create')
      expect(parsed?.parameters.name).toContain('morning')
    })

    test('should parse routine completion', async () => {
      const message = "I completed my evening routine"
      const parsed = await chatEntityParser.parseMessage(message)

      expect(parsed).toBeTruthy()
      expect(parsed?.entityType).toBe('routine')
      expect(parsed?.intent).toBe('complete')
    })
  })

  describe('Beliefs Chat Integration', () => {
    test('should parse belief creation with affirmation', async () => {
      const message = "I believe I am capable of achieving my goals"
      const parsed = await chatEntityParser.parseMessage(message)

      expect(parsed).toBeTruthy()
      expect(parsed?.entityType).toBe('belief')
      expect(parsed?.intent).toBe('create')
      expect(parsed?.parameters.statement).toContain('capable')
    })

    test('should parse belief reinforcement', async () => {
      const message = "Reinforce belief: I am confident in my abilities"
      const parsed = await chatEntityParser.parseMessage(message)

      expect(parsed).toBeTruthy()
      expect(parsed?.entityType).toBe('belief')
      expect(parsed?.intent).toBe('update')
      expect(parsed?.parameters.action).toBe('reinforce')
    })
  })

  describe('Synchronicity Chat Integration', () => {
    test('should parse synchronicity logging', async () => {
      const message = "Log synch: Saw 11:11 on the clock right when thinking about my goal"
      const parsed = await chatEntityParser.parseMessage(message)

      expect(parsed).toBeTruthy()
      expect(parsed?.entityType).toBe('synchronicity')
      expect(parsed?.intent).toBe('create')
      expect(parsed?.parameters.title).toContain('11:11')
    })

    test('should extract synchronicity details', async () => {
      const message = "Amazing synchronicity! Met someone who mentioned the exact book I was just thinking about"
      const parsed = await chatEntityParser.parseMessage(message)

      expect(parsed).toBeTruthy()
      expect(parsed?.entityType).toBe('synchronicity')
      expect(parsed?.parameters.description).toContain('book')
      expect(parsed?.parameters.significance).toBeGreaterThan(5)
    })
  })

  describe('Natural Language Processing', () => {
    test('should extract routine categories correctly', async () => {
      const testCases = [
        { input: "morning meditation routine", expected: "wellness" },
        { input: "workout routine", expected: "fitness" },
        { input: "bedtime routine", expected: "sleep" },
        { input: "work routine", expected: "productivity" }
      ]

      for (const testCase of testCases) {
        const parsed = await chatEntityParser.parseMessage(`Create ${testCase.input}`)
        if (parsed) {
          expect(parsed.parameters.category).toBe(testCase.expected)
        }
      }
    })

    test('should extract belief types correctly', async () => {
      const testCases = [
        { input: "I am worthy of success", expected: "self_worth" },
        { input: "I can achieve my goals", expected: "capability" },
        { input: "I have abundance in my life", expected: "abundance" },
        { input: "I am healthy and strong", expected: "health" }
      ]

      for (const testCase of testCases) {
        const parsed = await chatEntityParser.parseMessage(testCase.input)
        if (parsed) {
          expect(parsed.parameters.belief_type).toBe(testCase.expected)
        }
      }
    })
  })
})