# Mood Detection Service

## Overview

The Mood Detection Service provides comprehensive sentiment analysis and mood detection capabilities for the Personal Guide application. It analyzes text input to determine emotional state, confidence levels, and extract relevant emotional keywords.

## Features

### Core Capabilities
- **Advanced Sentiment Analysis**: Uses both keyword-based analysis and AI-powered sentiment detection
- **Mood Categorization**: Maps emotions to five main categories: `happy`, `neutral`, `sad`, `anxious`, `energized`
- **Confidence Scoring**: Provides 0-1 confidence score for transparency
- **Emotional Keywords**: Extracts specific emotional indicators from text
- **Response Caching**: Improves performance with intelligent caching
- **Fallback Support**: Graceful degradation when AI services are unavailable

### API Integration
- **Standalone Endpoint**: `POST /api/analyze-mood` for independent mood analysis
- **Chat Integration**: Seamlessly integrated with existing chat interface
- **Enhanced Personalities**: Mood data informs AI personality responses

## API Documentation

### Analyze Mood Endpoint

**Endpoint**: `POST /api/analyze-mood`

**Request Body**:
```json
{
  "text": "I'm feeling really excited about this new project!"
}
```

**Response**:
```json
{
  "mood": "happy",
  "mood_confidence": 0.87,
  "emotional_keywords": ["excited", "project"],
  "sentiment_details": {
    "primary_emotion": "happy",
    "secondary_emotions": ["energized"],
    "emotional_intensity": 0.87,
    "context_analysis": "High positive sentiment with enthusiasm indicators"
  }
}
```

### Service Info Endpoint

**Endpoint**: `GET /api/analyze-mood`

Returns service capabilities and configuration information.

## Mood Categories

| Category | Description | Example Keywords |
|----------|-------------|------------------|
| `happy` | Positive emotions, joy, contentment | happy, excited, wonderful, grateful |
| `sad` | Sadness, disappointment, grief | sad, depressed, heartbroken, devastated |
| `anxious` | Worry, stress, fear, uncertainty | anxious, worried, stressed, nervous |
| `energized` | Motivation, determination, drive | motivated, energized, focused, determined |
| `neutral` | Balanced, calm, reflective states | okay, normal, thinking, considering |

## Integration Points

### Chat Interface Enhancement
- **Real-time Mood Detection**: Analyzes user messages as they're sent
- **Visual Indicators**: Displays mood with emoji and confidence levels
- **Emotional Insights Panel**: Shows detected emotional keywords
- **Personality Adaptation**: AI responses adapt based on detected mood

### Database Schema
Enhanced message storage with mood-related fields:
- `mood`: Detected mood category
- `mood_confidence`: 0-1 confidence score
- `emotional_keywords`: Array of detected keywords
- `ai_provider`: Provider used for analysis

### Analytics Support
- **Mood Distribution**: Track mood patterns over time
- **Confidence Trends**: Monitor detection accuracy
- **Keyword Analysis**: Identify common emotional themes
- **Historical Insights**: Support for personal growth tracking

## Implementation Details

### Sentiment Analysis Pipeline

1. **Keyword Analysis**: Scans text for emotional keywords with weighted scoring
2. **Context Modifiers**: Applies intensifiers and diminishers for accuracy
3. **AI Enhancement**: Uses OpenAI/Claude for nuanced sentiment analysis
4. **Confidence Calculation**: Combines multiple signals for final confidence score
5. **Category Mapping**: Maps detailed emotions to simplified categories

### Caching Strategy
- **5-minute cache duration** for repeated analyses
- **LRU eviction** with 100-entry limit
- **Text-based keys** for exact match caching

### Error Handling
- **Graceful Fallback**: Falls back to keyword analysis if AI fails
- **Neutral Default**: Returns neutral mood with 0.5 confidence on error
- **Comprehensive Logging**: Detailed error tracking for debugging

## Usage Examples

### Direct API Usage
```javascript
const response = await fetch('/api/analyze-mood', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: "I'm worried about tomorrow's meeting" })
})

const mood = await response.json()
console.log(`Detected mood: ${mood.mood} (${Math.round(mood.mood_confidence * 100)}%)`)
```

### Chat Integration
The mood detection automatically works within the chat interface, providing:
- Real-time mood indicators
- Personality-aware responses
- Emotional keyword highlights
- Confidence visualization

### Analytics Usage
```javascript
import { getMoodAnalytics } from '@/lib/chatService'

const analytics = await getMoodAnalytics(userId, 30) // Last 30 days
console.log('Mood distribution:', analytics.moodDistribution)
console.log('Top keywords:', analytics.topEmotionalKeywords)
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: For OpenAI-powered sentiment analysis
- `ANTHROPIC_API_KEY`: For Claude-powered sentiment analysis
- `NEXTAUTH_URL`: Base URL for internal API calls

### Customization Options
- **Keyword Dictionaries**: Modify `EMOTIONAL_KEYWORDS` in `/api/analyze-mood/route.ts`
- **Confidence Thresholds**: Adjust detection sensitivity
- **Cache Duration**: Modify `CACHE_DURATION` constant
- **Mood Categories**: Add or modify mood classifications

## Testing

### Automated Testing
Run the test script to verify functionality:
```bash
node test-mood-detection.js
```

### Manual Testing
1. Start the development server
2. Navigate to the chat interface
3. Send messages with different emotional content
4. Observe mood detection in the UI

### Test Cases
The service has been tested with:
- ✅ Positive emotions (happiness, excitement, gratitude)
- ✅ Negative emotions (sadness, anxiety, stress)
- ✅ Goal-oriented content (motivation, productivity)
- ✅ Reflective content (contemplation, learning)
- ✅ Neutral content (everyday conversations)

## Performance Considerations

### Optimization Features
- **Response Caching**: Reduces API calls for repeated text
- **Fallback Mechanism**: Maintains speed when AI services are slow
- **Keyword Pre-processing**: Fast initial analysis before AI enhancement
- **Confidence Thresholds**: Avoids unnecessary AI calls for obvious cases

### Expected Response Times
- **Cached Results**: < 10ms
- **Keyword Analysis Only**: < 50ms
- **With AI Enhancement**: 200-2000ms (depending on provider)

## Security & Privacy

### Data Handling
- **No Persistent Storage**: Text analysis doesn't store user input
- **Temporary Caching**: Cache cleared automatically after timeout
- **API Key Security**: Requires proper environment variable configuration

### Privacy Protection
- **Local Processing**: Keyword analysis happens server-side
- **Optional AI**: Can function without external AI services
- **User Consent**: Mood detection is transparent and visible to users

## Future Enhancements

### Planned Features
- **Emotion Trends**: Long-term emotional pattern analysis
- **Personalized Keywords**: User-specific emotional vocabulary learning
- **Multi-language Support**: Sentiment analysis in multiple languages
- **Integration APIs**: Webhooks for mood change notifications
- **Advanced Analytics**: Correlation with habits, goals, and activities

### Technical Improvements
- **Streaming Analysis**: Real-time mood detection as user types
- **Batch Processing**: Analyze multiple messages simultaneously
- **Model Fine-tuning**: Custom sentiment models for personal growth context
- **Performance Monitoring**: Detailed metrics and alerting

## Troubleshooting

### Common Issues

**Mood detection not working**
- Check API keys are configured correctly
- Verify database schema includes new mood columns
- Run database migration if needed

**Low confidence scores**
- Review text content for emotional indicators
- Check if AI providers are responding
- Verify keyword dictionaries are appropriate

**Performance issues**
- Monitor API response times
- Check cache hit rates
- Consider reducing AI timeout values

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` and checking console output for detailed mood analysis steps.

## Support

For issues or questions about the Mood Detection Service:
1. Check the console logs for detailed error messages
2. Verify all environment variables are configured
3. Test the API endpoints directly using the test script
4. Review the database schema for required columns

---

*Mood Detection Service v1.0.0 - Personal Guide Application*