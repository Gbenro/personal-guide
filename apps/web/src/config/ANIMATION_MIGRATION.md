# Animation Migration Guide

This guide helps migrate existing animation classes to use the centralized animation configuration.

## Quick Reference

### Common Replacements

| Old Class | New Class |
|-----------|-----------|
| `transition-colors` | `animations.transitions.colors` |
| `transition-all duration-200` | `animations.transitions.normal.all` |
| `hover:scale-105 active:scale-95` | `animations.scales.interactive.normal` |
| `transition-shadow` | `animations.transitions.shadow` |

### Animation Presets

Use these presets for common UI patterns:

```tsx
import { animationPresets, animations } from '@/config/animations'

// Primary buttons
className={animationPresets.primaryButton}

// Secondary buttons
className={animationPresets.secondaryButton}

// Interactive cards
className={animationPresets.interactiveCard}

// Icon buttons
className={animationPresets.iconButton}

// List items
className={animationPresets.listItem}

// Loading spinners
className={animationPresets.spinner}
```

### Migration Examples

#### Before:
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm">
  Click me
</button>
```

#### After:
```tsx
import { animationPresets } from '@/config/animations'

<button className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm ${animationPresets.primaryButton}`}>
  Click me
</button>
```

#### Custom Animations:
```tsx
import { createAnimation } from '@/config/animations'

const customAnimation = createAnimation({
  transition: 'all',
  duration: 'slow',
  ease: 'inOut',
  hover: 'hover:scale-110',
  active: 'active:scale-90',
  additional: ['shadow-lg', 'hover:shadow-xl']
})

<div className={customAnimation}>Custom animated element</div>
```

## Component-Specific Patterns

### Habit Tracker
```tsx
// Completion buttons
className={animations.habits.complete}

// Habit cards
className={animations.habits.card}

// Quick actions
className={animations.habits.quickAction}
```

### Dashboard
```tsx
// Quick action buttons
className={animations.dashboard.quickAction}

// Stats cards
className={animations.dashboard.stats}

// Command center buttons
className={animations.dashboard.command}
```

### Forms
```tsx
// Input focus states
className={animations.forms.input}

// Form buttons
className={animations.forms.button}
```

### Mood Tracking
```tsx
// Emoji interactions
className={animations.mood.emoji}

// Mood selection
className={animations.mood.selection}
```

## Benefits

1. **Consistency**: All animations follow the same timing and easing patterns
2. **Maintainability**: Change animation behavior globally from one file
3. **Accessibility**: Built-in respect for `prefers-reduced-motion`
4. **Performance**: Optimized animation classes
5. **Type Safety**: TypeScript support for animation presets

## Best Practices

1. Use presets for common patterns
2. Use specific animation objects for component-specific needs
3. Always include accessibility considerations
4. Test animations on different devices and screen sizes
5. Consider performance impact of complex animations

## Accessibility

All animations include `motion-reduce:transition-none` to respect user preferences for reduced motion. This is automatically included in presets and can be added manually:

```tsx
className={`my-animation ${animations.accessibility.reduced}`}
```