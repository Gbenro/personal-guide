'use client'

export default function BeliefsTab() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧠 Beliefs</h1>
          <p className="text-gray-600 mt-2">
            21-day belief installation cycles with daily reinforcement
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg p-8 text-white text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-bold mb-2">Transform Your Mindset</h2>
          <p className="text-lg opacity-90">
            Install empowering beliefs through proven 21-day neuroplasticity cycles
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">📖 Read</div>
              <div>Daily affirmations</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">🗣️ Repeat</div>
              <div>Spoken reinforcement</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">🎯 Visualize</div>
              <div>Guided imagery</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold">✍️ Write</div>
              <div>Journal integration</div>
            </div>
          </div>
        </div>

        {/* Sample Beliefs */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">💪 Example Belief Cycles</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-400 pl-4 py-2">
                <div className="font-medium text-gray-900">"I am disciplined and consistent"</div>
                <div className="text-sm text-gray-600">Perfect for building habit consistency</div>
              </div>
              <div className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="font-medium text-gray-900">"I deserve success and happiness"</div>
                <div className="text-sm text-gray-600">Overcome self-worth limitations</div>
              </div>
              <div className="border-l-4 border-purple-400 pl-4 py-2">
                <div className="font-medium text-gray-900">"I am capable of achieving my goals"</div>
                <div className="text-sm text-gray-600">Build unshakeable confidence</div>
              </div>
              <div className="border-l-4 border-pink-400 pl-4 py-2">
                <div className="font-medium text-gray-900">"I attract positive relationships"</div>
                <div className="text-sm text-gray-600">Improve social connections</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">🔄 21-Day Process</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-1">
                  ✓
                </div>
                <div>
                  <div className="font-medium">Daily Reinforcement</div>
                  <div className="text-sm text-gray-600">
                    Complete 4 activities: read, repeat, visualize, write
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-1">
                  📊
                </div>
                <div>
                  <div className="font-medium">Progress Tracking</div>
                  <div className="text-sm text-gray-600">
                    Monitor belief strength and completion rates
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-1">
                  🧠
                </div>
                <div>
                  <div className="font-medium">Neuroplasticity</div>
                  <div className="text-sm text-gray-600">
                    Rewire neural pathways through consistent practice
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-1">
                  🎉
                </div>
                <div>
                  <div className="font-medium">Integration</div>
                  <div className="text-sm text-gray-600">
                    Belief becomes automatic and natural
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🚧 Under Development</h3>
          <p className="text-gray-600">
            The belief installation system is currently being built. Soon you'll be able to:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Create custom beliefs</span>
            <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Track 21-day cycles</span>
            <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Daily reinforcement activities</span>
            <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Progress monitoring</span>
          </div>
        </div>
      </div>
    </div>
  )
}