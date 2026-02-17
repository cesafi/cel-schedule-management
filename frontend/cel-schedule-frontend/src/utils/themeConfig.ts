/**
 * Theme Configuration
 * 
 * Centralized configuration for theme behaviors and features.
 */

/**
 * ENABLE/DISABLE THEME TRANSITION OVERLAY
 * 
 * Set to true to show a full-screen image overlay during theme transitions.
 * Set to false to disable the transition overlay.
 * 
 * USAGE:
 * export const ENABLE_THEME_TRANSITION_OVERLAY = true;   // Enabled
 * export const ENABLE_THEME_TRANSITION_OVERLAY = false;  // Disabled
 */
export const ENABLE_THEME_TRANSITION_OVERLAY = true;

/**
 * Duration (in milliseconds) that the transition overlay is visible
 * 
 * Recommended range: 400-800ms
 * Default: 600ms
 */
export const TRANSITION_OVERLAY_DURATION = 800;

/**
 * TRANSITION PROBABILITY
 * 
 * Set the probability that the overlay will appear (0.0 to 100.0)
 * 
 * Examples:
 * - 0.01 = 0.01% chance (1 in 10,000 transitions)
 * - 0.1 = 0.1% chance (1 in 1,000 transitions)
 * - 1 = 1% chance (1 in 100 transitions)
 * - 10 = 10% chance (1 in 10 transitions)
 * - 100 = 100% chance (every transition)
 * 
 * Default: 0.01% (very rare easter egg!)
 */
export const TRANSITION_OVERLAY_PROBABILITY = 1;

/**
 * TRANSITION DIRECTION
 * 
 * Set which direction(s) should trigger the overlay
 * 
 * Options:
 * - 'night-to-day': Only when switching from night mode to day mode
 * - 'day-to-night': Only when switching from day mode to night mode
 * - 'both': Triggers on both directions
 * 
 * Default: 'night-to-day'
 */
export const TRANSITION_OVERLAY_DIRECTION: 'night-to-day' | 'day-to-night' | 'both' = 'night-to-day';

/**
 * Optional: Custom image URL for the transition overlay
 * Leave as null to use the default gradient animation
 * 
 * HOW TO ADD A CUSTOM IMAGE:
 * 1. Place your image in the public folder (e.g., /public/assets/sunrise.jpg)
 * 2. Update the path below:
 *    export const TRANSITION_OVERLAY_IMAGE_URL = '/assets/sunrise.jpg';
 * 
 * Examples:
 * - '/assets/sunrise.jpg' for a sunrise image
 * - '/assets/sunset.jpg' for a sunset image
 * - '/assets/sky-transition.gif' for an animated GIF
 * - null for default gradient (sunrise gradient for day, night gradient for night)
 * 
 * TIPS:
 * - Use high-quality images (1920x1080 or higher)
 * - Keep file size under 500KB for fast loading
 * - Consider using optimized formats (WebP, optimized JPG)
 */
export const TRANSITION_OVERLAY_IMAGE_URL: string | null = "/Flashy.jpg";

