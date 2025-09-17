import {
  getUserHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  completeHabit,
  getTodayCompletions,
  calculateStreak,
  getHabitCompletionsRange
} from '../habitService'
import { supabase } from '../supabase'

// Mock the supabase module
jest.mock('../supabase')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('habitService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserHabits', () => {
    it('should fetch user habits successfully', async () => {
      const mockHabits = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Exercise',
          description: 'Daily workout',
          color: '#3B82F6',
          target_frequency: 1,
          frequency_period: 'daily',
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockHabits,
          error: null
        })
      } as any)

      const result = await getUserHabits('user1')

      expect(result).toEqual(mockHabits)
      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })

    it('should return empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      } as any)

      const result = await getUserHabits('user1')

      expect(result).toEqual([])
    })
  })

  describe('createHabit', () => {
    it('should create a habit successfully', async () => {
      const mockHabit = {
        id: '1',
        user_id: 'user1',
        name: 'Exercise',
        description: 'Daily workout',
        color: '#3B82F6',
        target_frequency: 1,
        frequency_period: 'daily',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockHabit,
          error: null
        })
      } as any)

      const result = await createHabit('user1', 'Exercise', 'Daily workout', '#3B82F6', 1, 'daily')

      expect(result).toEqual(mockHabit)
      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })

    it('should return null on error', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' }
        })
      } as any)

      const result = await createHabit('user1', 'Exercise')

      expect(result).toBeNull()
    })
  })

  describe('completeHabit', () => {
    it('should record habit completion successfully', async () => {
      const mockCompletion = {
        id: '1',
        habit_id: 'habit1',
        user_id: 'user1',
        completed_at: '2023-01-01T10:00:00Z',
        notes: 'Good workout',
        created_at: '2023-01-01T10:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCompletion,
          error: null
        })
      } as any)

      const result = await completeHabit('habit1', 'user1', 'Good workout')

      expect(result).toEqual(mockCompletion)
      expect(mockSupabase.from).toHaveBeenCalledWith('habit_completions')
    })

    it('should return null on error', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' }
        })
      } as any)

      const result = await completeHabit('habit1', 'user1')

      expect(result).toBeNull()
    })
  })

  describe('calculateStreak', () => {
    it('should calculate streak correctly for consecutive days', async () => {
      const mockCompletions = [
        { completed_at: '2023-01-03T10:00:00Z' },
        { completed_at: '2023-01-02T10:00:00Z' },
        { completed_at: '2023-01-01T10:00:00Z' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCompletions,
          error: null
        })
      } as any)

      // Mock Date.now to return a fixed date for testing
      const fixedDate = new Date('2023-01-03T12:00:00Z')
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate as any)

      const result = await calculateStreak('habit1', 'user1')

      expect(result.current_streak).toBeGreaterThan(0)
      expect(result.total_completions).toBe(3)
      expect(result.habit_id).toBe('habit1')

      jest.restoreAllMocks()
    })

    it('should return zero streak for no completions', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      } as any)

      const result = await calculateStreak('habit1', 'user1')

      expect(result.current_streak).toBe(0)
      expect(result.longest_streak).toBe(0)
      expect(result.total_completions).toBe(0)
      expect(result.last_completed).toBeNull()
    })
  })

  describe('getTodayCompletions', () => {
    it('should fetch today\'s completions', async () => {
      const mockCompletions = [
        {
          id: '1',
          habit_id: 'habit1',
          user_id: 'user1',
          completed_at: new Date().toISOString(),
          notes: null,
          created_at: new Date().toISOString()
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({
          data: mockCompletions,
          error: null
        })
      } as any)

      const result = await getTodayCompletions('user1')

      expect(result).toEqual(mockCompletions)
      expect(mockSupabase.from).toHaveBeenCalledWith('habit_completions')
    })
  })

  describe('getHabitCompletionsRange', () => {
    it('should fetch completions for date range', async () => {
      const mockCompletions = [
        { completed_at: '2023-01-01T10:00:00Z' },
        { completed_at: '2023-01-02T10:00:00Z' },
        { completed_at: '2023-01-02T15:00:00Z' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockCompletions,
          error: null
        })
      } as any)

      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-01-03')
      const result = await getHabitCompletionsRange('habit1', 'user1', startDate, endDate)

      expect(result).toEqual({
        '2023-01-01': 1,
        '2023-01-02': 2
      })
    })

    it('should return empty object on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' }
        })
      } as any)

      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-01-03')
      const result = await getHabitCompletionsRange('habit1', 'user1', startDate, endDate)

      expect(result).toEqual({})
    })
  })

  describe('updateHabit', () => {
    it('should update habit successfully', async () => {
      const mockUpdatedHabit = {
        id: '1',
        user_id: 'user1',
        name: 'Updated Exercise',
        description: 'Updated workout',
        color: '#10B981',
        target_frequency: 2,
        frequency_period: 'daily',
        created_at: '2023-01-01',
        updated_at: '2023-01-02'
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedHabit,
          error: null
        })
      } as any)

      const result = await updateHabit('1', { name: 'Updated Exercise' })

      expect(result).toEqual(mockUpdatedHabit)
    })
  })

  describe('archiveHabit', () => {
    it('should archive habit successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      } as any)

      const result = await archiveHabit('habit1')

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })

    it('should return false on error', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Archive failed' }
        })
      } as any)

      const result = await archiveHabit('habit1')

      expect(result).toBe(false)
    })
  })
})