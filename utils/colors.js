// TODO memoize this for performance
export function evaluateCSSVariable(color) {
  return window.getComputedStyle(document.body).getPropertyValue(color.match(/\((.*?)\)/)[1]);
}

export function getCounterColor(colorLabel) {
  let color = null;

  const config = window.CONFIG || {};
  const counterColors = config.COUNTER_COLORS || {};
  color = counterColors[colorLabel];

  if (color) {
    return color;
  }
  // Maybe if colors have been modified and old recording are in DB, we need to render a default
  // color
  return '#AEAEAE';
}

export function getAvailableCounterColors() {
  const config = window.CONFIG || {};
  const counterColors = config.COUNTER_COLORS || {};
  return Object.keys(counterColors);
}

export function getDefaultCounterColor() {
  const config = window.CONFIG || {};
  const counterColors = config.COUNTER_COLORS || {};
  const labels = Object.keys(counterColors);
  // Return the first available label or a sensible default label
  return labels.length > 0 ? labels[0] : 'default';
}

export function getPathfinderColors() {
  const config = window.CONFIG || {};
  const pathfinderColors = config.PATHFINDER_COLORS;
  return Array.isArray(pathfinderColors) ? pathfinderColors : [];
}

export function getDisplayClasses() {
  const config = window.CONFIG || {};
  return config.DISPLAY_CLASSES || [];
}
