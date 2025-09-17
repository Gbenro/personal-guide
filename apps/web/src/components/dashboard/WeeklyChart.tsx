'use client'

import { useState } from 'react'
import { InformationCircleIcon, TrophyIcon } from '@heroicons/react/24/outline'
import type { WeeklyStats } from '@/lib/dashboardService'

interface WeeklyChartProps {
  weeklyStats: WeeklyStats
}

export default function WeeklyChart({ weeklyStats }: WeeklyChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxRate = Math.max(...weeklyStats.completionRates, 1)

  const getBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-400 hover:bg-green-500'
    if (rate >= 60) return 'bg-blue-400 hover:bg-blue-500'
    if (rate >= 40) return 'bg-yellow-400 hover:bg-yellow-500'
    if (rate > 0) return 'bg-red-400 hover:bg-red-500'
    return 'bg-gray-200 hover:bg-gray-300'
  }

  const getBarBorderColor = (rate: number) => {
    if (rate >= 80) return 'border-green-500'
    if (rate >= 60) return 'border-blue-500'
    if (rate >= 40) return 'border-yellow-500'
    if (rate > 0) return 'border-red-500'
    return 'border-gray-300'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Weekly Progress</h3>
            <p className="text-sm text-gray-600">
              {weeklyStats.averageCompletionRate}% average completion rate
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl lg:text-2xl font-bold text-blue-600">
            {weeklyStats.totalCompletions}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Total completions
          </div>
        </div>
      </div>

      {/* Interactive bar chart */}
      <div className="space-y-4">
        <div className="flex items-end justify-between h-24 lg:h-32 space-x-1 lg:space-x-2 relative">
          {weeklyStats.completionRates.map((rate, index) => {
            const isHovered = hoveredBar === index
            const isToday = index === new Date().getDay()

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center relative group"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md z-10 whitespace-nowrap animate-fade-in">
                    {rate}% completion
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}

                {/* Bar container */}
                <div className="w-full bg-gray-100 rounded-t-md flex flex-col justify-end h-16 lg:h-24 relative overflow-hidden">
                  {/* Animated bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-700 ease-out transform ${
                      getBarColor(rate)
                    } ${isHovered ? 'scale-105' : ''} ${
                      isToday ? `ring-2 ${getBarBorderColor(rate)}` : ''
                    }`}
                    style={{
                      height: `${(rate / maxRate) * 100}%`,
                      minHeight: rate > 0 ? '4px' : '0px',
                      animationDelay: `${index * 100}ms`
                    }}
                  />

                  {/* Today indicator */}
                  {isToday && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>

                {/* Day label */}
                <div className={`mt-2 text-xs font-medium ${
                  isToday ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {days[index]}
                </div>

                {/* Rate value */}
                <div className={`text-xs mt-1 ${
                  isHovered ? 'text-gray-700 font-medium' : 'text-gray-500'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {rate}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Performance legend */}
        <div className="hidden lg:flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span className="text-gray-600">Excellent (80%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span className="text-gray-600">Good (60-79%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-gray-600">Fair (40-59%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span className="text-gray-600">Needs focus (&lt;40%)</span>
          </div>
        </div>

        {/* Best/worst day insights with enhanced mobile layout */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-4 border-t border-gray-100">
          <div className="text-center p-2 lg:p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="text-sm font-medium text-green-600 mb-1">🏆 Best Day</div>
            <div className="text-xs text-gray-600 font-medium">{weeklyStats.bestDay}</div>
            {weeklyStats.bestDay && (
              <div className="text-xs text-green-700 mt-1">
                {weeklyStats.completionRates[days.indexOf(weeklyStats.bestDay)]}%
              </div>
            )}
          </div>
          <div className="text-center p-2 lg:p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="text-sm font-medium text-orange-600 mb-1">🎯 Focus Day</div>
            <div className="text-xs text-gray-600 font-medium">{weeklyStats.worstDay}</div>
            {weeklyStats.worstDay && (
              <div className="text-xs text-orange-700 mt-1">
                {weeklyStats.completionRates[days.indexOf(weeklyStats.worstDay)]}%
              </div>
            )}
          </div>
        </div>

        {/* Weekly insights */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <InformationCircleIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Weekly Insight</span>
          </div>
          <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
            {weeklyStats.averageCompletionRate >= 80
              ? "🌟 Outstanding week! You're building incredible momentum."
              : weeklyStats.averageCompletionRate >= 60
              ? "💪 Solid progress! Small improvements can make a big difference."
              : weeklyStats.averageCompletionRate >= 40
              ? "🚀 You're on the right track! Focus on consistency over perfection."
              : "🌱 Every journey starts with a single step. Keep building your foundation."
            }
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .group:hover .absolute {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}