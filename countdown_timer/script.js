document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const inputSection = document.getElementById('input-section');
    const displaySection = document.getElementById('display-section');
    const completionSection = document.getElementById('completion-message');

    const eventTitleInput = document.getElementById('event-title-input');
    const yearInput = document.getElementById('year-input');
    const monthInput = document.getElementById('month-input');
    const dayInput = document.getElementById('day-input');
    const hourInput = document.getElementById('hour-input');
    const minuteInput = document.getElementById('minute-input');

    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetCompleteBtn = document.getElementById('reset-complete-btn'); // Button on completion screen

    const eventTitleDisplay = document.getElementById('event-title-display');
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const timeValueElements = [daysEl, hoursEl, minutesEl, secondsEl]; // Array for animation trigger

    const completionTitleEl = document.getElementById('completion-title');
    const completionEventNameEl = document.getElementById('completion-event-name');

    // --- State Variables ---
    let countdownInterval = null;
    let targetDate = null;
    let currentEventTitle = "Event"; // Default title

    // --- Utility Functions ---
    function formatTime(num) {
        return num.toString().padStart(2, '0');
    }

    // Add animation class and remove it after duration
    function triggerTickAnimation(element) {
        if (!element) return;
        element.classList.add('animate-tick');
        // Remove the class slightly after the animation duration (300ms)
        setTimeout(() => {
            element.classList.remove('animate-tick');
        }, 350);
    }

    // Show/Hide Sections with Transition
    function showSection(sectionElement) {
        sectionElement.classList.remove('section-hidden');
        // Force reflow before adding opacity/transform for transition to work
        void sectionElement.offsetWidth;
        sectionElement.style.opacity = '1';
        sectionElement.style.transform = 'translateY(0)';
        sectionElement.style.height = ''; // Reset height if needed
        sectionElement.style.overflow = ''; // Reset overflow
    }

    function hideSection(sectionElement) {
        sectionElement.style.opacity = '0';
        sectionElement.style.transform = 'translateY(20px)';
        // Use transitionend event for more robust hiding
        sectionElement.addEventListener('transitionend', function handler() {
            sectionElement.classList.add('section-hidden');
            sectionElement.removeEventListener('transitionend', handler);
        }, { once: true });
         // Fallback timeout if transitionend doesn't fire (e.g., display:none)
         setTimeout(() => {
             sectionElement.classList.add('section-hidden');
         }, 500); // Match transition duration
    }

    // --- Core Countdown Logic ---
    function startCountdown() {
        const year = parseInt(yearInput.value);
        const month = parseInt(monthInput.value); // 1-12
        const day = parseInt(dayInput.value);
        const hour = parseInt(hourInput.value) || 0;
        const minute = parseInt(minuteInput.value) || 0;
        currentEventTitle = eventTitleInput.value.trim() || "Your Event";

        // --- Validation ---
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            alert("Please enter a valid Year, Month, and Day.");
            return;
        }
        if (month < 1 || month > 12) {
            alert("Month must be between 1 and 12.");
            return;
        }
        // Basic day validation (doesn't account for leap years or month lengths perfectly)
        if (day < 1 || day > 31) {
             alert("Day must be between 1 and 31.");
             return;
        }
         if (hour < 0 || hour > 23) {
             alert("Hour must be between 0 and 23.");
             return;
         }
          if (minute < 0 || minute > 59) {
             alert("Minute must be between 0 and 59.");
             return;
         }

        // Construct target date (JS months are 0-indexed)
        targetDate = new Date(year, month - 1, day, hour, minute, 0); // Target seconds = 0

        const now = new Date();
        if (targetDate <= now) {
            alert("Please select a date and time in the future!");
            targetDate = null; // Reset targetDate if invalid
            return;
        }

        // --- UI Updates ---
        hideSection(inputSection);
        hideSection(completionSection); // Ensure completion is hidden
        showSection(displaySection);
        eventTitleDisplay.textContent = `Countdown to ${currentEventTitle}`;

        // --- Start Timer ---
        if (countdownInterval) {
            clearInterval(countdownInterval); // Clear any existing timer
        }
        updateCountdown(); // Initial call to display immediately
        countdownInterval = setInterval(updateCountdown, 1000);

    }

    function updateCountdown() {
        if (!targetDate) return; // Exit if target date is not set

        const now = new Date();
        const timeDifference = targetDate - now;

        if (timeDifference <= 0) {
            handleCompletion();
            return;
        }

        // Calculate remaining time
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        // Update DOM and trigger animations only if value changes
        if (daysEl.textContent !== formatTime(days)) {
            daysEl.textContent = formatTime(days);
            triggerTickAnimation(daysEl.parentElement); // Animate the block
        }
         if (hoursEl.textContent !== formatTime(hours)) {
            hoursEl.textContent = formatTime(hours);
            triggerTickAnimation(hoursEl.parentElement);
        }
         if (minutesEl.textContent !== formatTime(minutes)) {
            minutesEl.textContent = formatTime(minutes);
             triggerTickAnimation(minutesEl.parentElement);
        }
        // Always update seconds visually
        secondsEl.textContent = formatTime(seconds);
        triggerTickAnimation(secondsEl.parentElement);

    }

    function handleCompletion() {
        clearInterval(countdownInterval);
        countdownInterval = null;
        targetDate = null;

        completionEventNameEl.textContent = `The countdown for "${currentEventTitle}" is complete.`;
        hideSection(displaySection);
        showSection(completionSection);
        // Optional: Play a sound
        // const audio = new Audio('path/to/completion-sound.mp3');
        // audio.play();
    }

    function resetCountdown() {
        clearInterval(countdownInterval);
        countdownInterval = null;
        targetDate = null;

        // Reset display values
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';

        // Reset input fields (optional, keep values for quick restart?)
        // eventTitleInput.value = '';
        // yearInput.value = ''; /* etc. */

        // Show input section, hide others
        hideSection(displaySection);
        hideSection(completionSection);
        showSection(inputSection);
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', startCountdown);
    resetBtn.addEventListener('click', resetCountdown);
    resetCompleteBtn.addEventListener('click', resetCountdown); // Also reset from completion screen

    // --- Initialization ---
    // Set initial state (input visible, others hidden)
     showSection(inputSection);
     displaySection.classList.add('section-hidden'); // Ensure hidden initially without transition
     completionSection.classList.add('section-hidden');

     // Set default year placeholder
     const currentYear = new Date().getFullYear();
     yearInput.placeholder = currentYear;
     yearInput.min = currentYear;


}); // End DOMContentLoaded