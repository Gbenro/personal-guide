import { z } from 'zod'

// =============================================================================
// HABIT VALIDATION SCHEMAS
// =============================================================================

export const habitSchema = z.object({
  title: z.string()
    .min(1, 'Habit title is required')
    .max(100, 'Habit title must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  category: z.enum(['health', 'productivity', 'learning', 'relationships', 'personal', 'other'])
    .optional()
    .default('personal'),
  frequency: z.enum(['daily', 'weekly', 'monthly'])
    .default('daily'),
  target_value: z.number()
    .int()
    .min(1, 'Target value must be at least 1')
    .max(1000, 'Target value must be less than 1000')
    .default(1),
  target_unit: z.string()
    .max(20, 'Target unit must be less than 20 characters')
    .default('times'),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  reminder_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional(),
  is_active: z.boolean().default(true)
})

export const habitCompletionSchema = z.object({
  habit_id: z.string().uuid('Invalid habit ID'),
  user_id: z.string().uuid('Invalid user ID'),
  completed_value: z.number()
    .int()
    .min(0, 'Completed value must be non-negative')
    .max(1000, 'Completed value must be less than 1000'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  completed_at: z.string()
    .datetime('Invalid date format')
    .optional()
})

// =============================================================================
// JOURNAL VALIDATION SCHEMAS
// =============================================================================

export const journalEntrySchema = z.object({
  title: z.string()
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  content: z.string()
    .min(1, 'Journal content is required')
    .max(10000, 'Content must be less than 10,000 characters')
    .trim(),
  mood_rating: z.number()
    .int()
    .min(1, 'Mood rating must be between 1 and 10')
    .max(10, 'Mood rating must be between 1 and 10')
    .optional(),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be less than 50 characters')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Tag contains invalid characters')
  )
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  is_favorite: z.boolean().default(false)
})

export const journalUpdateSchema = journalEntrySchema.partial()

// =============================================================================
// MOOD & ENERGY VALIDATION SCHEMAS
// =============================================================================

export const moodEnergyEntrySchema = z.object({
  mood_rating: z.number()
    .int()
    .min(1, 'Mood rating must be between 1 and 10')
    .max(10, 'Mood rating must be between 1 and 10'),
  energy_level: z.number()
    .int()
    .min(1, 'Energy level must be between 1 and 10')
    .max(10, 'Energy level must be between 1 and 10'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Tag contains invalid characters')
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  context: z.object({
    weather: z.string().max(50).optional(),
    location: z.string().max(100).optional(),
    activities: z.array(z.string().max(50)).max(10).optional(),
    sleep_hours: z.number().min(0).max(24).optional(),
    exercise: z.boolean().optional()
  }).optional()
})

export const moodEntrySchema = z.object({
  rating: z.number()
    .int()
    .min(1, 'Mood rating must be between 1 and 10')
    .max(10, 'Mood rating must be between 1 and 10'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  journal_entry_id: z.string().optional()
})

// =============================================================================
// USER & AUTH VALIDATION SCHEMAS
// =============================================================================

export const userProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  timezone: z.string()
    .max(50, 'Timezone must be less than 50 characters')
    .optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.boolean().default(true),
    weekly_summary: z.boolean().default(true),
    reminder_sound: z.boolean().default(true)
  }).optional()
})

// =============================================================================
// FILTER & SEARCH VALIDATION SCHEMAS
// =============================================================================

export const journalFiltersSchema = z.object({
  searchQuery: z.string()
    .max(200, 'Search query must be less than 200 characters')
    .optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  showFavoritesOnly: z.boolean().default(false),
  sortBy: z.enum(['created_at', 'updated_at', 'mood_rating', 'word_count'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional()
})

export const habitFiltersSchema = z.object({
  category: z.enum(['health', 'productivity', 'learning', 'relationships', 'personal', 'other'])
    .optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  sortBy: z.enum(['created_at', 'title', 'category', 'frequency'])
    .default('created_at')
})

// =============================================================================
// API RESPONSE VALIDATION SCHEMAS
// =============================================================================

export const paginationSchema = z.object({
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0),
  page: z.number()
    .int()
    .min(1, 'Page must be at least 1')
    .optional()
})

export const dateRangeSchema = z.object({
  startDate: z.string()
    .datetime('Invalid start date format'),
  endDate: z.string()
    .datetime('Invalid end date format')
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate']
  }
)

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

export function validateHabit(data: unknown) {
  return habitSchema.safeParse(data)
}

export function validateJournalEntry(data: unknown) {
  return journalEntrySchema.safeParse(data)
}

export function validateMoodEnergyEntry(data: unknown) {
  return moodEnergyEntrySchema.safeParse(data)
}

export function validateMoodEntry(data: unknown) {
  return moodEntrySchema.safeParse(data)
}

export function validateUserProfile(data: unknown) {
  return userProfileSchema.safeParse(data)
}

// Type exports for TypeScript
export type HabitInput = z.infer<typeof habitSchema>
export type HabitCompletionInput = z.infer<typeof habitCompletionSchema>
export type JournalEntryInput = z.infer<typeof journalEntrySchema>
export type JournalUpdateInput = z.infer<typeof journalUpdateSchema>
export type MoodEnergyEntryInput = z.infer<typeof moodEnergyEntrySchema>
export type MoodEntryInput = z.infer<typeof moodEntrySchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type JournalFiltersInput = z.infer<typeof journalFiltersSchema>
export type HabitFiltersInput = z.infer<typeof habitFiltersSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>

// Error formatting helper
export function formatValidationErrors(errors: z.ZodError) {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }))
}