document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application when DOM is fully loaded
    initApp();
});

// Wait for all resources to load
window.addEventListener('load', function() {
    // Hide loading screen with animation
    setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 1000);
});

function initApp() {
    // Initialize all modules
    setupThemeToggle();
    setupNavigation();
    setupConverterUI();
    setupVisualizationControls();
    setupFactsSlider();
    initThermometer();
}

// Theme toggle functionality
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    // Check for saved theme preference or use preferred color scheme
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
    }

    // Toggle theme when user clicks theme button
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        // Save user preference
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
}

// Smooth scrolling navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .hero-cta a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Smooth scroll to target
                    targetSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                    
                    // Update active navigation link
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    
                    document.querySelector(`.nav-link[href="${targetId}"]`).classList.add('active');
                }
            }
        });
    });

    // Handle scroll events to update active nav item
    window.addEventListener('scroll', debounce(function() {
        let currentSection = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= (sectionTop - sectionHeight / 3)) {
                currentSection = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }, 100));
}

// Debounce helper function for scroll events
function debounce(func, wait = 20, immediate = true) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Set up the temperature converter UI interactions
function setupConverterUI() {
    const temperatureInput = document.getElementById('temperature');
    const convertBtn = document.getElementById('convert-btn');
    const resultNumber = document.getElementById('result-number');
    const resultUnit = document.getElementById('result-unit');
    const formulaText = document.getElementById('formula-text');
    const thermometerMercury = document.querySelector('.thermometer-mercury');
    const fromUnitOptions = document.querySelectorAll('.from-unit .unit-option');
    const toUnitOptions = document.querySelectorAll('.to-unit .unit-option');
    const swapBtn = document.querySelector('.swap-btn');

    // Set up unit selector toggles
    fromUnitOptions.forEach(option => {
        option.addEventListener('click', function() {
            fromUnitOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            updateFormula();
        });
    });

    toUnitOptions.forEach(option => {
        option.addEventListener('click', function() {
            toUnitOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            updateFormula();
            updateResultUnit();
        });
    });

    // Swap from/to units
    swapBtn.addEventListener('click', function() {
        // Get current active units
        const fromUnit = document.querySelector('.from-unit .unit-option.active').dataset.unit;
        const toUnit = document.querySelector('.to-unit .unit-option.active').dataset.unit;
        
        // Swap them
        fromUnitOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.unit === toUnit) {
                option.classList.add('active');
            }
        });
        
        toUnitOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.unit === fromUnit) {
                option.classList.add('active');
            }
        });
        
        // Update UI
        updateFormula();
        updateResultUnit();
        
        // If there's already a result, recalculate
        if (resultNumber.textContent !== '--') {
            convertTemperature();
        }
    });

    // Update formula text based on selected units
    function updateFormula() {
        const fromUnit = document.querySelector('.from-unit .unit-option.active').dataset.unit;
        const toUnit = document.querySelector('.to-unit .unit-option.active').dataset.unit;
        
        let formula = '';
        
        if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
            formula = 'Formula: (°C × 9/5) + 32 = °F';
        } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
            formula = 'Formula: (°F - 32) × 5/9 = °C';
        } else if (fromUnit === 'celsius' && toUnit === 'kelvin') {
            formula = 'Formula: °C + 273.15 = K';
        } else if (fromUnit === 'kelvin' && toUnit === 'celsius') {
            formula = 'Formula: K - 273.15 = °C';
        } else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') {
            formula = 'Formula: (°F - 32) × 5/9 + 273.15 = K';
        } else if (fromUnit === 'kelvin' && toUnit === 'fahrenheit') {
            formula = 'Formula: (K - 273.15) × 9/5 + 32 = °F';
        } else {
            formula = 'No conversion needed: units are the same';
        }
        
        formulaText.textContent = formula;
    }

    // Update result unit display
    function updateResultUnit() {
        const toUnit = document.querySelector('.to-unit .unit-option.active').dataset.unit;
        
        switch (toUnit) {
            case 'celsius':
                resultUnit.textContent = '°C';
                break;
            case 'fahrenheit':
                resultUnit.textContent = '°F';
                break;
            case 'kelvin':
                resultUnit.textContent = 'K';
                break;
        }
    }

    // Validate input as the user types
    temperatureInput.addEventListener('input', function() {
        const inputValue = this.value.trim();
        const isValid = /^-?\d*\.?\d*$/.test(inputValue); // Allow negative and decimal numbers
        
        const inputGroup = this.parentElement;
        
        if (!isValid && inputValue !== '' && inputValue !== '-') {
            inputGroup.classList.add('error');
        } else {
            inputGroup.classList.remove('error');
        }
    });

    // Convert temperature when button is clicked
    convertBtn.addEventListener('click', function() {
        convertTemperature();
    });

    // Also convert when Enter key is pressed in input field
    temperatureInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convertTemperature();
        }
    });

    // Perform temperature conversion
    function convertTemperature() {
        // Get input value and validate
        const inputValue = parseFloat(temperatureInput.value);
        const inputGroup = temperatureInput.parentElement;
        
        if (isNaN(inputValue)) {
            inputGroup.classList.add('error');
            return;
        } else {
            inputGroup.classList.remove('error');
        }
        
        // Get current from/to units
        const fromUnit = document.querySelector('.from-unit .unit-option.active').dataset.unit;
        const toUnit = document.querySelector('.to-unit .unit-option.active').dataset.unit;
        
        // Import conversion functions from conversions.js
        let result;
        
        if (fromUnit === toUnit) {
            result = inputValue;
        } else if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
            result = celsiusToFahrenheit(inputValue);
        } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
            result = fahrenheitToCelsius(inputValue);
        } else if (fromUnit === 'celsius' && toUnit === 'kelvin') {
            result = celsiusToKelvin(inputValue);
        } else if (fromUnit === 'kelvin' && toUnit === 'celsius') {
            result = kelvinToCelsius(inputValue);
        } else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') {
            result = fahrenheitToKelvin(inputValue);
        } else if (fromUnit === 'kelvin' && toUnit === 'fahrenheit') {
            result = kelvinToFahrenheit(inputValue);
        }
        
        // Display result
        resultNumber.textContent = result.toFixed(2);
        updateThermometer(result, toUnit);
        
        // Add animation effect
        resultNumber.classList.add('highlight');
        setTimeout(() => {
            resultNumber.classList.remove('highlight');
        }, 1500);
    }

    // Update thermometer visualization
    function updateThermometer(value, unit) {
        // Convert value to Celsius for thermometer display
        let celsius;
        
        switch (unit) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = fahrenheitToCelsius(value);
                break;
            case 'kelvin':
                celsius = kelvinToCelsius(value);
                break;
        }
        
        // Calculate height percentage (thermometer range from -50°C to 100°C)
        const minTemp = -50;
        const maxTemp = 100;
        const range = maxTemp - minTemp;
        
        // Clamp the value
        celsius = Math.max(minTemp, Math.min(celsius, maxTemp));
        
        // Calculate percentage
        const percentage = ((celsius - minTemp) / range) * 100;
        
        // Update mercury height
        thermometerMercury.style.height = `${percentage}%`;
        
        // Change mercury color based on temperature
        if (celsius < 0) {
            thermometerMercury.style.background = `linear-gradient(to top, var(--cold), var(--cold-dark))`;
        } else if (celsius > 50) {
            thermometerMercury.style.background = `linear-gradient(to top, var(--hot-dark), var(--hot))`;
        } else {
            thermometerMercury.style.background = `linear-gradient(to top, var(--mild-dark), var(--mild))`;
        }
    }

    // Initialize with default values
    updateFormula();
    updateResultUnit();
}

// Set up the 3D visualization controls
function setupVisualizationControls() {
    const tempSlider = document.getElementById('visual-temp');
    const tempValueDisplay = document.getElementById('visual-temp-value');
    const unitButtons = document.querySelectorAll('.visualization-buttons .btn');
    const equivCelsius = document.getElementById('equiv-celsius');
    const equivFahrenheit = document.getElementById('equiv-fahrenheit');
    const equivKelvin = document.getElementById('equiv-kelvin');
    const tempFact = document.getElementById('temp-fact');
    const tempIndicators = document.querySelectorAll('.temp-info');
    
    // Current unit for the visualization
    let currentUnit = 'celsius';

    // Update visualization when slider value changes
    tempSlider.addEventListener('input', function() {
        updateVisualization(parseFloat(this.value), currentUnit);
    });

    // Handle unit button clicks
    unitButtons.forEach(button => {
        button.addEventListener('click', function() {
            unitButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentUnit = this.dataset.unit;
            
            // Convert current slider value to the new unit
            const currentValue = parseFloat(tempSlider.value);
            let convertedValue;
            
            if (currentUnit === 'fahrenheit') {
                convertedValue = celsiusToFahrenheit(currentValue);
                tempSlider.min = celsiusToFahrenheit(-50);
                tempSlider.max = celsiusToFahrenheit(150);
                tempSlider.value = convertedValue;
            } else if (currentUnit === 'kelvin') {
                convertedValue = celsiusToKelvin(currentValue);
                tempSlider.min = celsiusToKelvin(-50);
                tempSlider.max = celsiusToKelvin(150);
                tempSlider.value = convertedValue;
            } else {
                // Celsius (default)
                tempSlider.min = -50;
                tempSlider.max = 150;
                tempSlider.value = currentValue;
                convertedValue = currentValue;
            }
            
            updateVisualization(convertedValue, currentUnit);
        });
    });

    // Update the visualization based on temperature and unit
    function updateVisualization(value, unit) {
        // Display value with unit
        tempValueDisplay.textContent = Math.round(value);
        
        // Calculate equivalent values in all units
        let celsius, fahrenheit, kelvin;
        
        switch (unit) {
            case 'celsius':
                celsius = value;
                fahrenheit = celsiusToFahrenheit(value);
                kelvin = celsiusToKelvin(value);
                break;
            case 'fahrenheit':
                celsius = fahrenheitToCelsius(value);
                fahrenheit = value;
                kelvin = fahrenheitToKelvin(value);
                break;
            case 'kelvin':
                celsius = kelvinToCelsius(value);
                fahrenheit = kelvinToFahrenheit(value);
                kelvin = value;
                break;
        }
        
        // Update equivalent temperature displays
        equivCelsius.textContent = celsius.toFixed(2);
        equivFahrenheit.textContent = fahrenheit.toFixed(2);
        equivKelvin.textContent = kelvin.toFixed(2);
        
        // Update temperature indicator
        tempIndicators.forEach(indicator => indicator.classList.remove('active'));
        
        if (celsius < 0) {
            document.querySelector('.temp-info.cold').classList.add('active');
            updateTempFact('cold', celsius);
        } else if (celsius > 40) {
            document.querySelector('.temp-info.hot').classList.add('active');
            updateTempFact('hot', celsius);
        } else {
            document.querySelector('.temp-info.mild').classList.add('active');
            updateTempFact('mild', celsius);
        }
        
        // Update the 3D visualization - function defined in temperature-visualization.js
        if (typeof updateTemperatureModel === 'function') {
            updateTemperatureModel(celsius);
        }
    }

    // Update temperature facts based on temperature
    function updateTempFact(category, celsius) {
        let fact = '';
        
        if (category === 'cold') {
            if (celsius < -30) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), mercury freezes solid. This extreme cold is dangerous to exposed skin, causing frostbite in minutes.`;
            } else if (celsius < -10) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), automobile batteries lose considerable power and engine oil thickens, making cars difficult to start.`;
            } else if (celsius < 0) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), water freezes into ice. Cold weather crops like kale and Brussels sprouts actually taste sweeter after a frost.`;
            }
        } else if (category === 'hot') {
            if (celsius > 100) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), water boils at sea level. This temperature is used in cooking, sterilization, and various industrial processes.`;
            } else if (celsius > 70) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), proteins in meat rapidly denature. This is why meat cooks faster at higher temperatures, creating a seared exterior.`;
            } else if (celsius > 40) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), heat exhaustion and heat stroke become serious risks. The highest temperature ever recorded on Earth was 56.7°C (134°F) in Death Valley.`;
            }
        } else {
            if (celsius >= 30 && celsius <= 40) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), the human body activates cooling mechanisms like sweating. Average human body temperature is around 37°C (98.6°F).`;
            } else if (celsius >= 20 && celsius < 30) {
                fact = `${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F) is considered room temperature, comfortable for most people without additional heating or cooling.`;
            } else if (celsius >= 0 && celsius < 20) {
                fact = `At ${celsius.toFixed(1)}°C (${celsiusToFahrenheit(celsius).toFixed(1)}°F), metabolism in many plants slows down. Most refrigerators are kept at about 4°C (39°F) to slow bacterial growth in food.`;
            }
        }
        
        tempFact.textContent = fact;
    }

    // Initialize with default value
    updateVisualization(parseFloat(tempSlider.value), currentUnit);
}

// Set up the temperature facts slider
function setupFactsSlider() {
    const factsSlider = document.querySelector('.facts-slider');
    const factSlides = document.querySelectorAll('.fact-slide');
    const prevBtn = document.querySelector('.prev-fact');
    const nextBtn = document.querySelector('.next-fact');
    const indicatorsContainer = document.querySelector('.fact-indicators');
    
    if (!factsSlider || !factSlides.length) return;
    
    let currentSlide = 0;
    
    // Create indicator dots
    factSlides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('fact-indicator');
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });
    
    // Add slide indicators
    const indicators = document.querySelectorAll('.fact-indicator');
    
    // Initialize slider
    goToSlide(0);
    
    // Event listeners for controls
    prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });
    
    nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
    });
    
    // Auto-advance slides
    const slideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 8000);
    
    // Pause auto-advance when hovering over slider
    factsSlider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    // Function to change slide
    function goToSlide(index) {
        // Handle wraparound
        if (index < 0) index = factSlides.length - 1;
        if (index >= factSlides.length) index = 0;
        
        // Update currentSlide
        currentSlide = index;
        
        // Update slide positions
        factSlides.forEach((slide, i) => {
            slide.classList.remove('active');
            slide.style.transform = `translateX(${100 * (i - index)}%)`;
            slide.style.opacity = i === index ? '1' : '0';
        });
        
        // Activate current slide
        factSlides[currentSlide].classList.add('active');
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === currentSlide);
        });
    }
}

// Initialize animated thermometer for hero section
function initThermometer() {
    // If using 3D thermometer, initialize it here
    // This will be handled by temperature-visualization.js
}