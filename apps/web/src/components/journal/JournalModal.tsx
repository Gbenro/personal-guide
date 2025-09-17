'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonalGuideStore, useJournalModal } from '@/stores/personalGuideStore'
import { createJournalEntry, updateJournalEntry } from '@/lib/journalService'
import { createMoodEntry } from '@/lib/journalService'
import {
  XMarkIcon,
  HeartIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  TagIcon,
  CalendarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface JournalModalProps {
  onSuccess?: () => void
}

const MOOD_LABELS = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😔', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Poor' },
  { value: 4, emoji: '🙁', label: 'Below Average' },
  { value: 5, emoji: '😊', label: 'Okay' },
  { value: 6, emoji: '😌', label: 'Good' },
  { value: 7, emoji: '😄', label: 'Great' },
  { value: 8, emoji: '😁', label: 'Very Good' },
  { value: 9, emoji: '🤩', label: 'Excellent' },
  { value: 10, emoji: '🥳', label: 'Amazing' }
]

export default function JournalModal({ onSuccess }: JournalModalProps) {
  const { user } = useAuth()
  const { isOpen, selectedEntry, close } = useJournalModal()
  const {
    addJournalEntry,
    updateJournalEntry: updateEntry,
    addMoodEntry,
    setJournalLoading,
    setJournalError
  } = usePersonalGuideStore()

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moodRating, setMoodRating] = useState<number | undefined>()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  // Refs
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Initialize form when entry changes
  useEffect(() => {
    if (selectedEntry) {
      setTitle(selectedEntry.title || '')
      setContent(selectedEntry.content || '')
      setMoodRating(selectedEntry.mood_rating)
      setTags(selectedEntry.tags || [])
      setWordCount(selectedEntry.word_count || 0)
    } else {
      // Reset form for new entry
      setTitle('')
      setContent('')
      setMoodRating(undefined)
      setTags([])
      setTagInput('')
      setWordCount(0)
    }
  }, [selectedEntry])

  // Update word count when content changes
  useEffect(() => {
    if (content.trim()) {
      const count = content.trim().split(/\s+/).length
      setWordCount(count)
    } else {
      setWordCount(0)
    }
  }, [content])

  // Focus content area when modal opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setTimeout(() => contentRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleClose = () => {
    if (isSaving) return // Prevent closing while saving
    close()
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!user || !content.trim()) return

    setIsSaving(true)
    setJournalLoading(true)
    setJournalError(undefined)

    try {
      const entryData = {
        title: title.trim() || undefined,
        content: content.trim(),
        mood_rating: moodRating,
        tags
      }

      if (selectedEntry) {
        // Update existing entry
        const updated = await updateJournalEntry(
          selectedEntry.id,
          user.id,
          entryData
        )

        if (updated) {
          updateEntry(selectedEntry.id, updated)
        } else {
          throw new Error('Failed to update journal entry')
        }
      } else {
        // Create new entry
        const created = await createJournalEntry(user.id, entryData)

        if (created) {
          addJournalEntry(created)

          // Also create a mood entry if mood was rated
          if (moodRating) {
            const moodEntry = await createMoodEntry(user.id, {
              rating: moodRating,
              journal_entry_id: created.id
            })

            if (moodEntry) {
              addMoodEntry(moodEntry)
            }
          }
        } else {
          throw new Error('Failed to create journal entry')
        }
      }

      onSuccess?.()
      close()
    } catch (error) {
      console.error('Error saving journal entry:', error)
      setJournalError('Failed to save journal entry. Please try again.')
    } finally {
      setIsSaving(false)
      setJournalLoading(false)
    }
  }

  const canSave = content.trim().length > 0 && !isSaving

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpenIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind today?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your thoughts
              </label>
              <textarea
                ref={contentRef}
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your thoughts, experiences, or reflections..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSaving}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </p>
                <p className="text-xs text-gray-500">
                  {content.length} characters
                </p>
              </div>
            </div>

            {/* Mood Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How are you feeling? (optional)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_LABELS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setMoodRating(moodRating === mood.value ? undefined : mood.value)}
                    disabled={isSaving}
                    className={`p-3 rounded-lg border-2 transition-all text-center hover:scale-105 ${
                      moodRating === mood.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-xs text-gray-600">{mood.label}</div>
                  </button>
                ))}
              </div>
              {moodRating && (
                <p className="text-sm text-blue-600 mt-2 text-center">
                  Feeling {MOOD_LABELS.find(m => m.value === moodRating)?.label} today
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSaving}
                      className="ml-1 hover:text-blue-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isSaving}
                />
                <button
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || isSaving}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TagIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to add a tag, or click the + button
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            {wordCount > 0 && (
              <div className="flex items-center space-x-1">
                <BookOpenIcon className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{selectedEntry ? 'Update Entry' : 'Save Entry'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}