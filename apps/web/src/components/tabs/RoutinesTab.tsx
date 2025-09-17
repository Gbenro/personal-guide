'use client'

export default function RoutinesTab() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔄 Routines</h1>
          <p className="text-gray-600 mt-2">
            Guided flows for morning, evening, and custom routines
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg p-8 text-white text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
          <p className="text-lg opacity-90">
            Guided step-by-step routines with timers and customizable flows
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">🌅 Morning Routines</div>
              <div>Start your day with purpose</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">🌙 Evening Routines</div>
              <div>Wind down mindfully</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">⚡ Custom Flows</div>
              <div>Build your own sequences</div>
            </div>
          </div>
        </div>

        {/* Preview Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Planned Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Step-by-step guided flows
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Built-in timers for each step
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Customizable routine templates
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Completion tracking & streaks
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Progress visualization
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Sample Morning Routine</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</span>
                <div>
                  <div className="font-medium">Hydration</div>
                  <div className="text-sm text-gray-600">Drink a full glass of water</div>
                </div>
                <div className="ml-auto text-sm text-gray-500">1 min</div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</span>
                <div>
                  <div className="font-medium">Meditation</div>
                  <div className="text-sm text-gray-600">Mindful breathing practice</div>
                </div>
                <div className="ml-auto text-sm text-gray-500">10 min</div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</span>
                <div>
                  <div className="font-medium">Journaling</div>
                  <div className="text-sm text-gray-600">Set intentions for the day</div>
                </div>
                <div className="ml-auto text-sm text-gray-500">5 min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}