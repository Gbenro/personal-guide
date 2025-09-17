'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sun,
  Moon,
  Cloud,
  Sunrise,
  Sunset,
  Activity,
  Battery,
  Heart
} from 'lucide-react'
import type { MoodEnergyEntry, MoodEnergyStats } from '@/lib/moodEnergyService'

interface MoodEnergyChartProps {
  entries: MoodEnergyEntry[]
  stats: MoodEnergyStats
  period?: '7d' | '30d' | '90d'
}

export default function MoodEnergyChart({
  entries,
  stats,
  period = '7d'
}: MoodEnergyChartProps) {
  // Process entries for chart
  const chartData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.created_at)
        return entryDate.toDateString() === date.toDateString()
      })

      data.push({
        date: date.toISOString(),
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        mood: dayEntries.length > 0
          ? dayEntries.reduce((sum, e) => sum + e.mood_rating, 0) / dayEntries.length
          : null,
        energy: dayEntries.length > 0
          ? dayEntries.reduce((sum, e) => sum + e.energy_level, 0) / dayEntries.length
          : null,
        count: dayEntries.length
      })
    }

    return data
  }, [entries, period])

  const maxValue = 10
  const chartHeight = 200

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTimeIcon = (time: string) => {
    switch (time) {
      case 'morning':
        return <Sunrise className="w-4 h-4 text-yellow-500" />
      case 'afternoon':
        return <Sun className="w-4 h-4 text-orange-500" />
      case 'evening':
        return <Sunset className="w-4 h-4 text-purple-500" />
      case 'night':
        return <Moon className="w-4 h-4 text-indigo-500" />
      default:
        return <Sun className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Mood & Energy Trends
        </h3>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Heart className="w-4 h-4 text-pink-500" />
              {getTrendIcon(stats.moodTrend)}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageMood.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Avg Mood
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Battery className="w-4 h-4 text-yellow-500" />
              {getTrendIcon(stats.energyTrend)}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageEnergy.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Avg Energy
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              {getTimeIcon(stats.bestTimeOfDay)}
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">
              {stats.bestTimeOfDay}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Best Time
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {entries.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Check-ins
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>

          <div className="ml-8">
            <svg
              width="100%"
              height={chartHeight}
              className="overflow-visible"
              viewBox={`0 0 ${chartData.length * 50} ${chartHeight}`}
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y * chartHeight}
                  x2={chartData.length * 50}
                  y2={y * chartHeight}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  className="text-gray-400"
                />
              ))}

              {/* Mood line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                d={chartData
                  .filter(d => d.mood !== null)
                  .map((d, i) => {
                    const x = chartData.indexOf(d) * 50 + 25
                    const y = chartHeight - (d.mood! / maxValue) * chartHeight
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  })
                  .join(' ')}
                fill="none"
                stroke="url(#moodGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Energy line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeInOut', delay: 0.2 }}
                d={chartData
                  .filter(d => d.energy !== null)
                  .map((d, i) => {
                    const x = chartData.indexOf(d) * 50 + 25
                    const y = chartHeight - (d.energy! / maxValue) * chartHeight
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  })
                  .join(' ')}
                fill="none"
                stroke="url(#energyGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data points */}
              {chartData.map((d, i) => (
                <g key={i}>
                  {d.mood !== null && (
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      cx={i * 50 + 25}
                      cy={chartHeight - (d.mood / maxValue) * chartHeight}
                      r="4"
                      fill="#EC4899"
                      className="cursor-pointer hover:r-6"
                    />
                  )}
                  {d.energy !== null && (
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 + 0.2 }}
                      cx={i * 50 + 25}
                      cy={chartHeight - (d.energy / maxValue) * chartHeight}
                      r="4"
                      fill="#F59E0B"
                      className="cursor-pointer hover:r-6"
                    />
                  )}
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EAB308" />
                </linearGradient>
              </defs>
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              {chartData.map((d, i) => (
                <div key={i} className="w-12 text-center">
                  {d.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Mood</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Energy</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      {stats.insights.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Insights
          </h4>
          <div className="space-y-2">
            {stats.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-2"
              >
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Pattern */}
      {stats.weeklyPattern.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Weekly Pattern
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {stats.weeklyPattern.map((day) => (
              <div
                key={day.day}
                className="text-center"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {day.day.slice(0, 3)}
                </div>
                <div
                  className="h-8 bg-gradient-to-t from-indigo-100 to-indigo-500 dark:from-indigo-900 dark:to-indigo-500 rounded"
                  style={{
                    height: `${(day.avgMood / 10) * 32}px`,
                    opacity: 0.8
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}