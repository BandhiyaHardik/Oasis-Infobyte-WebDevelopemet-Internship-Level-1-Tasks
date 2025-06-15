/**
 * Temperature Conversion Functions
 * This file contains all the functions needed to convert between
 * Celsius, Fahrenheit, and Kelvin temperature units.
 */

/**
 * Converts a temperature from Celsius to Fahrenheit
 * Formula: (°C × 9/5) + 32 = °F
 * 
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

/**
 * Converts a temperature from Fahrenheit to Celsius
 * Formula: (°F - 32) × 5/9 = °C
 * 
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

/**
 * Converts a temperature from Celsius to Kelvin
 * Formula: °C + 273.15 = K
 * 
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Kelvin
 */
function celsiusToKelvin(celsius) {
    return celsius + 273.15;
}

/**
 * Converts a temperature from Kelvin to Celsius
 * Formula: K - 273.15 = °C
 * 
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number} Temperature in Celsius
 */
function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}

/**
 * Converts a temperature from Fahrenheit to Kelvin
 * Formula: (°F - 32) × 5/9 + 273.15 = K
 * 
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Kelvin
 */
function fahrenheitToKelvin(fahrenheit) {
    return (fahrenheit - 32) * 5/9 + 273.15;
}

/**
 * Converts a temperature from Kelvin to Fahrenheit
 * Formula: (K - 273.15) × 9/5 + 32 = °F
 * 
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number} Temperature in Fahrenheit
 */
function kelvinToFahrenheit(kelvin) {
    return (kelvin - 273.15) * 9/5 + 32;
}

/**
 * Rounds a temperature value to a specified number of decimal places
 * 
 * @param {number} value - Temperature value to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded temperature value
 */
function roundTemperature(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Gets the appropriate temperature color based on Celsius value
 * 
 * @param {number} celsius - Temperature in Celsius
 * @returns {string} CSS color variable name
 */
function getTemperatureColor(celsius) {
    if (celsius < 0) {
        return 'var(--cold)';
    } else if (celsius < 40) {
        return 'var(--mild)';
    } else {
        return 'var(--hot)';
    }
}

/**
 * Validates if the input is a valid temperature
 * 
 * @param {string} input - User input to validate
 * @returns {boolean} Whether the input is a valid number
 */
function isValidTemperature(input) {
    // Remove any whitespace
    input = input.trim();
    
    // Check if it's a valid number (including negative and decimal)
    return /^-?\d*\.?\d*$/.test(input) && input !== '' && input !== '-';
}

/**
 * Gets temperature status description based on Celsius value
 * 
 * @param {number} celsius - Temperature in Celsius
 * @returns {string} Description of temperature range
 */
function getTemperatureStatus(celsius) {
    if (celsius <= -40) return 'Extremely Cold';
    if (celsius <= -20) return 'Very Cold';
    if (celsius <= 0) return 'Freezing';
    if (celsius <= 10) return 'Cold';
    if (celsius <= 20) return 'Cool';
    if (celsius <= 25) return 'Room Temperature';
    if (celsius <= 30) return 'Warm';
    if (celsius <= 40) return 'Hot';
    if (celsius <= 60) return 'Very Hot';
    return 'Extremely Hot';
}