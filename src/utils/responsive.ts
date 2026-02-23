// Responsive grid utilities for mobile-first design
export const responsiveGrid = {
  // Convert desktop grids to mobile-friendly layouts
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  },
  // Kanban board - horizontal scroll on mobile
  kanban: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  // Stats cards
  stats: 'grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4',
  // Content grid
  content: 'grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6',
};

// Touch target sizes (min 44px)
export const touchTargets = {
  min: 'min-h-[44px] min-w-[44px]',
  button: 'min-h-[44px] px-4 py-2.5',
  icon: 'p-2.5',
  nav: 'py-3 px-4',
};

// Mobile-safe spacing
export const safeAreas = {
  bottom: 'pb-safe', // Requires CSS: .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
  top: 'pt-safe',
  horizontal: 'px-safe',
};

// Responsive text sizes
export const textSizes = {
  h1: 'text-xl sm:text-2xl lg:text-3xl font-bold',
  h2: 'text-lg sm:text-xl lg:text-2xl font-bold',
  h3: 'text-base sm:text-lg font-bold',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
};

// Scroll utilities
export const scroll = {
  x: 'overflow-x-auto overflow-y-hidden scrollbar-thin',
  y: 'overflow-y-auto overflow-x-hidden scrollbar-thin',
  both: 'overflow-auto scrollbar-thin',
  hide: 'scrollbar-hide',
};
