'use client'

interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  className?: string
}

export default function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 8,
  className = ''
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${
            percentage >= 80 ? 'text-green-500' :
            percentage >= 60 ? 'text-blue-500' :
            percentage >= 40 ? 'text-yellow-500' :
            'text-red-500'
          }`}
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}