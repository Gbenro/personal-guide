// Quick debug script to test the parser
const { chatEntityParser } = require('./src/lib/chatEntityParser.ts')

async function testParser() {
  const testCases = [
    "Create morning routine: meditation, exercise, breakfast",
    "I believe I am capable of achieving my goals",
    "Log synch: Saw 11:11 on the clock right when thinking about my goal"
  ]

  for (const test of testCases) {
    console.log(`\nTesting: "${test}"`)
    try {
      const result = await chatEntityParser.parseMessage(test)
      console.log('Result:', JSON.stringify(result, null, 2))
    } catch (error) {
      console.log('Error:', error.message)
    }
  }
}

testParser()