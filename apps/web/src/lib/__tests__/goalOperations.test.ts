// Test file to verify goal operations functionality
// This is a basic verification test for the goal operations handler

import { EntityOperationHandler } from '../entityOperationHandler'
import { GoalsService } from '../goalsService'

// Mock the GoalsService
jest.mock('../goalsService', () => ({
  GoalsService: {
    createGoal: jest.fn(),
    getGoals: jest.fn(),
    getGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    getGoalStats: jest.fn(),
  }
}))

describe('Goal Operations Handler', () => {
  let handler: EntityOperationHandler
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    handler = new EntityOperationHandler(mockUserId)
    jest.clearAllMocks()
  })

  describe('createGoalFromChat', () => {
    it('should create a goal successfully', async () => {
      const mockGoal = {
        id: 'goal-123',
        title: 'Lose 10 pounds',
        description: '',
        category: 'health',
        progress_percentage: 0
      }

      ;(GoalsService.createGoal as jest.Mock).mockResolvedValue(mockGoal)

      const operation = {
        entityType: 'goal' as const,
        intent: 'create' as const,
        parameters: {
          title: 'Lose 10 pounds',
          category: 'health',
          target_date: '2025-03-01',
          priority: 'medium'
        },
        confidence: 0.9
      }

      const result = await handler.executeOperation(operation)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Created goal "Lose 10 pounds" successfully!')
      expect(GoalsService.createGoal).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
        title: 'Lose 10 pounds',
        category: 'health'
      }))
    })
  })

  describe('viewGoalsFromChat', () => {
    it('should display goals with statistics', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Read 12 books',
          progress_percentage: 50,
          status: 'active',
          target_date: new Date('2025-12-31')
        },
        {
          id: 'goal-2',
          title: 'Exercise daily',
          progress_percentage: 75,
          status: 'active',
          target_date: new Date('2025-06-01')
        }
      ]

      const mockStats = {
        total_goals: 2,
        active_goals: 2,
        completed_goals: 0,
        completion_rate_this_month: 65,
        overdue_goals: 0,
        due_this_week: 1
      }

      ;(GoalsService.getGoals as jest.Mock).mockResolvedValue(mockGoals)
      ;(GoalsService.getGoalStats as jest.Mock).mockResolvedValue(mockStats)

      const operation = {
        entityType: 'goal' as const,
        intent: 'view' as const,
        parameters: {
          title: 'dummy' // Required by GoalSchema even for view operations
        },
        confidence: 0.9
      }

      const result = await handler.executeOperation(operation)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Your Goals (2 active)')
      expect(result.message).toContain('65% completion rate this month')
      expect(result.data.goals).toHaveLength(2)
      expect(result.data.stats).toEqual(mockStats)
    })

    it('should handle empty goals list', async () => {
      ;(GoalsService.getGoals as jest.Mock).mockResolvedValue([])

      const operation = {
        entityType: 'goal' as const,
        intent: 'view' as const,
        parameters: {
          title: 'dummy' // Required by GoalSchema even for view operations
        },
        confidence: 0.9
      }

      const result = await handler.executeOperation(operation)

      expect(result.success).toBe(true)
      expect(result.message).toContain('You have no active goals yet')
      expect(result.suggestedActions).toContain('Add a new goal like "Create goal to lose 10 pounds by March"')
    })
  })

  describe('updateGoalFromChat', () => {
    it('should update goal progress successfully', async () => {
      const mockGoal = {
        id: 'goal-123',
        title: 'Lose 10 pounds',
        progress_percentage: 60,
        target_value: 10,
        current_value: 6
      }

      const mockUpdatedGoal = {
        ...mockGoal,
        progress_percentage: 70
      }

      ;(GoalsService.getGoals as jest.Mock).mockResolvedValue([mockGoal])
      ;(GoalsService.updateGoal as jest.Mock).mockResolvedValue(mockUpdatedGoal)

      const operation = {
        entityType: 'goal' as const,
        intent: 'update' as const,
        parameters: {
          title: 'Lose 10 pounds',
          progress_percentage: 70
        },
        confidence: 0.9
      }

      const result = await handler.executeOperation(operation)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Updated goal "Lose 10 pounds" successfully!')
      expect(GoalsService.updateGoal).toHaveBeenCalledWith(mockUserId, 'goal-123', expect.objectContaining({
        progress_percentage: 70
      }))
    })
  })

  describe('completeGoalFromChat', () => {
    it('should mark goal as completed', async () => {
      const mockGoal = {
        id: 'goal-123',
        title: 'Read 12 books',
        status: 'active'
      }

      const mockCompletedGoal = {
        ...mockGoal,
        status: 'completed',
        progress_percentage: 100
      }

      ;(GoalsService.getGoals as jest.Mock).mockResolvedValue([mockGoal])
      ;(GoalsService.updateGoal as jest.Mock).mockResolvedValue(mockCompletedGoal)

      const operation = {
        entityType: 'goal' as const,
        intent: 'complete' as const,
        parameters: {
          title: 'Read 12 books'
        },
        confidence: 0.9
      }

      const result = await handler.executeOperation(operation)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Congratulations! You\'ve completed "Read 12 books"!')
      expect(GoalsService.updateGoal).toHaveBeenCalledWith(mockUserId, 'goal-123', expect.objectContaining({
        status: 'completed',
        progress_percentage: 100
      }))
    })
  })
})