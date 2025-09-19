// Animation Configuration for Personal Guide
// Centralized animation styles for consistent UI behavior

export const animations = {
  // Transition durations
  durations: {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
    slowest: 'duration-700',
  },

  // Ease functions
  ease: {
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    linear: 'ease-linear',
  },

  // Common transitions
  transitions: {
    // Basic transitions
    colors: 'transition-colors',
    all: 'transition-all',
    transform: 'transition-transform',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',

    // Fast transitions (150ms)
    fast: {
      colors: 'transition-colors duration-150',
      all: 'transition-all duration-150',
      transform: 'transition-transform duration-150',
      opacity: 'transition-opacity duration-150',
    },

    // Normal transitions (200ms)
    normal: {
      colors: 'transition-colors duration-200',
      all: 'transition-all duration-200',
      transform: 'transition-transform duration-200',
      opacity: 'transition-opacity duration-200',
      shadow: 'transition-shadow duration-200',
    },

    // Slow transitions (300ms)
    slow: {
      colors: 'transition-colors duration-300',
      all: 'transition-all duration-300',
      transform: 'transition-transform duration-300',
      opacity: 'transition-opacity duration-300',
    },
  },

  // Scale transforms
  scales: {
    // Hover effects
    hover: {
      subtle: 'hover:scale-[1.02]',
      normal: 'hover:scale-105',
      strong: 'hover:scale-110',
    },

    // Active (click) effects
    active: {
      subtle: 'active:scale-[0.98]',
      normal: 'active:scale-95',
      strong: 'active:scale-90',
    },

    // Combined hover and active
    interactive: {
      subtle: 'hover:scale-[1.02] active:scale-[0.98]',
      normal: 'hover:scale-105 active:scale-95',
      strong: 'hover:scale-110 active:scale-90',
    },
  },

  // Loading animations
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    ping: 'animate-ping',

    // Custom spinners
    spinner: {
      small: 'w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin',
      medium: 'w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin',
      large: 'w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin',
    },
  },

  // Button animations
  buttons: {
    // Primary buttons
    primary: 'transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md',

    // Secondary buttons
    secondary: 'transition-colors duration-200 hover:bg-opacity-80',

    // Icon buttons
    icon: 'transition-colors duration-200 hover:bg-opacity-20 rounded-full',

    // Floating action buttons
    fab: 'transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl',
  },

  // Card animations
  cards: {
    // Basic card hover
    hover: 'transition-shadow duration-200 hover:shadow-md',

    // Interactive card
    interactive: 'transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]',

    // Soft hover
    soft: 'transition-all duration-200 hover:shadow-sm hover:border-gray-300',
  },

  // List item animations
  listItems: {
    // Basic hover
    hover: 'transition-colors duration-200 hover:bg-gray-50',

    // With scale
    interactive: 'transition-all duration-200 hover:bg-gray-50 hover:scale-[1.01]',
  },

  // Navigation animations
  navigation: {
    // Tab transitions
    tab: 'transition-colors duration-200',

    // Mobile tab
    mobileTab: 'transition-colors duration-150',
  },

  // Form animations
  forms: {
    // Input focus
    input: 'transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',

    // Button hover
    button: 'transition-colors duration-200 hover:bg-opacity-90',
  },

  // Mood/emotion specific animations
  mood: {
    // Emoji hover effects
    emoji: 'transition-all duration-200 hover:scale-110',

    // Mood selection
    selection: 'transition-all duration-200 hover:scale-105 active:scale-95',
  },

  // Habit tracker specific
  habits: {
    // Completion button
    complete: 'transition-transform duration-200 hover:scale-110 relative',

    // Habit card
    card: 'transition-all duration-200 hover:shadow-sm',

    // Quick actions
    quickAction: 'transition-all duration-200 transform hover:scale-105 active:scale-95',
  },

  // Dashboard specific
  dashboard: {
    // Quick action buttons
    quickAction: 'transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]',

    // Stats cards
    stats: 'transition-shadow duration-200 hover:shadow-md',

    // Command center buttons
    command: 'transition-all duration-200 transform hover:scale-105 active:scale-95',
  },

  // Special effects
  effects: {
    // Fade in/out
    fadeIn: 'transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in',
    fadeOut: 'transition-opacity duration-300 ease-in-out opacity-100 animate-fade-out',

    // Slide effects
    slideUp: 'transform transition-transform duration-300 ease-out translate-y-4 animate-slide-up',
    slideDown: 'transform transition-transform duration-300 ease-out -translate-y-4 animate-slide-down',

    // Stagger delays for lists
    stagger: {
      item1: 'animation-delay-75',
      item2: 'animation-delay-150',
      item3: 'animation-delay-225',
      item4: 'animation-delay-300',
    },
  },

  // Accessibility considerations
  accessibility: {
    // Reduced motion classes
    reduced: 'motion-reduce:transition-none motion-reduce:transform-none',

    // Respect user preferences
    respectMotion: 'motion-safe:transition-all motion-reduce:transition-none',
  },
} as const

// Helper functions for combining animations
export const combineAnimations = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ')
}

// Animation presets for common UI patterns
export const animationPresets = {
  // Interactive button (primary CTA)
  primaryButton: combineAnimations(
    animations.transitions.normal.all,
    animations.scales.interactive.normal,
    'shadow-sm hover:shadow-md',
    animations.accessibility.reduced
  ),

  // Secondary button
  secondaryButton: combineAnimations(
    animations.transitions.normal.colors,
    'hover:bg-opacity-80',
    animations.accessibility.reduced
  ),

  // Card with hover effect
  interactiveCard: combineAnimations(
    animations.transitions.normal.all,
    'hover:shadow-lg',
    animations.scales.hover.subtle,
    animations.accessibility.reduced
  ),

  // Icon button
  iconButton: combineAnimations(
    animations.transitions.normal.colors,
    'hover:bg-opacity-20 rounded-full p-2',
    animations.accessibility.reduced
  ),

  // List item
  listItem: combineAnimations(
    animations.transitions.normal.colors,
    'hover:bg-gray-50',
    animations.accessibility.reduced
  ),

  // Loading spinner
  spinner: combineAnimations(
    animations.loading.spinner.medium,
    'mx-auto'
  ),

  // Habit completion button
  habitComplete: combineAnimations(
    animations.transitions.normal.transform,
    animations.scales.hover.strong,
    'relative',
    animations.accessibility.reduced
  ),

  // Dashboard quick action
  dashboardAction: combineAnimations(
    animations.transitions.normal.all,
    animations.scales.interactive.subtle,
    'shadow-sm hover:shadow-md',
    animations.accessibility.reduced
  ),
}

// Type definitions for better TypeScript support
export type AnimationDuration = keyof typeof animations.durations
export type AnimationEase = keyof typeof animations.ease
export type AnimationPreset = keyof typeof animationPresets

// Utility function to get animation classes by preset name
export const getAnimationPreset = (preset: AnimationPreset): string => {
  return animationPresets[preset]
}

// Utility function to create custom animation combinations
export const createAnimation = (config: {
  transition?: string
  duration?: AnimationDuration
  ease?: AnimationEase
  hover?: string
  active?: string
  additional?: string[]
}): string => {
  const parts = []

  if (config.transition) {
    let transition = `transition-${config.transition}`
    if (config.duration) {
      transition += ` ${animations.durations[config.duration]}`
    }
    if (config.ease) {
      transition += ` ${animations.ease[config.ease]}`
    }
    parts.push(transition)
  }

  if (config.hover) parts.push(config.hover)
  if (config.active) parts.push(config.active)
  if (config.additional) parts.push(...config.additional)

  parts.push(animations.accessibility.reduced)

  return parts.join(' ')
}