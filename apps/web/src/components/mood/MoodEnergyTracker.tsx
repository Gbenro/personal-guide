'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Battery,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Sun,
  Moon,
  Cloud,
  Zap,
  Coffee,
  Bed,
  Activity,
  Edit,
  Save,
  X
} from 'lucide-react'

interface MoodEnergyTrackerProps {
  onSubmit: (data: {
    moodRating: number
    energyLevel: number
    notes?: string
    tags?: string[]
    context?: any
  }) => void
  initialMood?: number
  initialEnergy?: number
  compact?: boolean
}

export default function MoodEnergyTracker({
  onSubmit,
  initialMood = 5,
  initialEnergy = 5,
  compact = false
}: MoodEnergyTrackerProps) {
  const [mood, setMood] = useState(initialMood)
  const [energy, setEnergy] = useState(initialEnergy)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [context, setContext] = useState({
    weather: '',
    location: '',
    activities: [] as string[],
    sleep_hours: 7,
    exercise: false
  })

  const moodEmojis = ['😔', '😟', '😕', '😐', '🙂', '😊', '😄', '😃', '😁', '🤩']
  const energyIcons = [Battery, Battery, Battery, Battery, Battery, Battery, Battery, Battery, Battery, Battery]

  const tags = [
    'work', 'family', 'friends', 'exercise', 'creative',
    'stressed', 'relaxed', 'productive', 'tired', 'energetic',
    'happy', 'anxious', 'focused', 'social', 'alone'
  ]

  const activities = [
    'Working', 'Exercising', 'Reading', 'Socializing', 'Relaxing',
    'Creating', 'Learning', 'Meditating', 'Walking', 'Eating'
  ]

  const handleSubmit = () => {
    onSubmit({
      moodRating: mood,
      energyLevel: energy,
      notes: notes.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      context: showDetails ? context : undefined
    })

    // Reset form
    if (!compact) {
      setNotes('')
      setSelectedTags([])
      setShowDetails(false)
    }
  }

  const getMoodColor = (rating: number) => {
    if (rating <= 3) return 'text-red-500'
    if (rating <= 5) return 'text-yellow-500'
    if (rating <= 7) return 'text-green-500'
    return 'text-emerald-500'
  }

  const getEnergyColor = (level: number) => {
    if (level <= 3) return 'text-red-500'
    if (level <= 5) return 'text-orange-500'
    if (level <= 7) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Check-in</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showDetails ? 'Less' : 'More'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Mood Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Mood</span>
              <span className={`text-lg ${getMoodColor(mood)}`}>{moodEmojis[mood - 1]}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Energy Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Energy</span>
              <Zap className={`w-4 h-4 ${getEnergyColor(energy)}`} />
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700"
            >
              <input
                type="text"
                placeholder="Quick note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </motion.div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Log Check-in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          How are you feeling?
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your mood and energy levels to identify patterns
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Mood
          </label>
          <div className="flex items-center justify-between mb-2">
            {moodEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => setMood(index + 1)}
                className={`text-2xl transition-all ${
                  mood === index + 1 ? 'scale-125' : 'opacity-50 hover:opacity-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Very Low</span>
            <span className={`font-bold ${getMoodColor(mood)}`}>{mood}/10</span>
            <span>Very High</span>
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Energy Level
          </label>
          <div className="flex items-center justify-between mb-2">
            {[...Array(10)].map((_, index) => (
              <button
                key={index}
                onClick={() => setEnergy(index + 1)}
                className={`transition-all ${
                  energy >= index + 1 ? getEnergyColor(energy) : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                <Battery className="w-5 h-5" />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Exhausted</span>
            <span className={`font-bold ${getEnergyColor(energy)}`}>{energy}/10</span>
            <span>Energetic</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What describes your day? (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Context Details (Expandable) */}
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span>Add Context (optional)</span>
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {/* Sleep Hours */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Sleep (hours)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Bed className="w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={context.sleep_hours}
                      onChange={(e) => setContext(prev => ({
                        ...prev,
                        sleep_hours: parseFloat(e.target.value)
                      }))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Exercise */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={context.exercise}
                      onChange={(e) => setContext(prev => ({
                        ...prev,
                        exercise: e.target.checked
                      }))}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Exercised today
                    </span>
                  </label>
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Activities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((activity) => (
                      <button
                        key={activity}
                        onClick={() => {
                          setContext(prev => ({
                            ...prev,
                            activities: prev.activities.includes(activity)
                              ? prev.activities.filter(a => a !== activity)
                              : [...prev.activities, activity]
                          }))
                        }}
                        className={`px-2 py-1 rounded-lg text-xs ${
                          context.activities.includes(activity)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any thoughts or reflections..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          Save Check-in
        </button>
      </div>
    </div>
  )
}

// Missing import
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}