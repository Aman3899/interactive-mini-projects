document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const amPmEl = document.getElementById('am-pm');
    const dayNameEl = document.getElementById('day-name');
    const dayEl = document.getElementById('day');
    const monthEl = document.getElementById('month');
    const yearEl = document.getElementById('year');
    const themeSwitch = document.getElementById('theme-switch');
    const worldClocksContainer = document.getElementById('world-clocks');
    const addTimezoneBtn = document.getElementById('add-timezone');
    const modal = document.getElementById('timezone-modal');
    const closeModalBtn = modal.querySelector('.close');
    const addCityBtn = document.getElementById('add-city');
    const cityNameInput = document.getElementById('city-name');
    const timezoneSelect = document.getElementById('timezone-select');
    const footerYearEl = document.getElementById('footer-year');

    // Stopwatch elements
    const stopwatchDisplay = document.querySelector('.stopwatch-display');
    const stopwatchStartBtn = document.getElementById('stopwatch-start');
    const stopwatchPauseBtn = document.getElementById('stopwatch-pause');
    const stopwatchResetBtn = document.getElementById('stopwatch-reset');
    const stopwatchFeature = document.querySelector('.feature.stopwatch'); // For visual feedback

    // Timer elements
    const timerHoursInput = document.getElementById('hours-input');
    const timerMinutesInput = document.getElementById('minutes-input');
    const timerSecondsInput = document.getElementById('seconds-input');
    const timerDisplay = document.querySelector('.timer-display');
    const timerStartBtn = document.getElementById('timer-start');
    const timerPauseBtn = document.getElementById('timer-pause');
    const timerResetBtn = document.getElementById('timer-reset');
    const timerFeature = document.querySelector('.feature.timer'); // For visual feedback

    // --- State Variables ---
    let savedTimezones = JSON.parse(localStorage.getItem('worldClocks')) || [
        { city: 'New York', timezone: 'America/New_York' },
        { city: 'London', timezone: 'Europe/London' },
        { city: 'Tokyo', timezone: 'Asia/Tokyo' },
    ];

    // Stopwatch state
    let stopwatchInterval;
    let stopwatchStartTime;
    let stopwatchElapsedTime = 0;
    let stopwatchRunning = false;

    // Timer state
    let timerInterval;
    let timerEndTime;
    let timerPausedTime = 0; // Stores remaining time when paused
    let timerRunning = false;
    let timerInitialDuration = 0; // Stores the initial set duration
    let timerTimeoutId; // To clear timeout for visual feedback

    // --- Utility Functions ---
    function formatTime(num) {
        return num.toString().padStart(2, '0');
    }

    // --- Clock Update Functions ---
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        // Update DOM only if value changed to prevent unnecessary reflows
        if (hoursEl.textContent !== formatTime(hours)) hoursEl.textContent = formatTime(hours);
        if (minutesEl.textContent !== formatTime(minutes)) minutesEl.textContent = formatTime(minutes);
        if (secondsEl.textContent !== formatTime(seconds)) secondsEl.textContent = formatTime(seconds);
        if (amPmEl.textContent !== ampm) amPmEl.textContent = ampm;

        const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

        const currentDayName = dayNames[now.getDay()];
        const currentDay = formatTime(now.getDate());
        const currentMonth = monthNames[now.getMonth()];
        const currentYear = now.getFullYear();

        if (dayNameEl.textContent !== currentDayName) dayNameEl.textContent = currentDayName;
        if (dayEl.textContent !== currentDay) dayEl.textContent = currentDay;
        if (monthEl.textContent !== currentMonth) monthEl.textContent = currentMonth;
        if (yearEl.textContent !== currentYear.toString()) yearEl.textContent = currentYear.toString();
        if (footerYearEl.textContent !== currentYear.toString()) footerYearEl.textContent = currentYear.toString(); // Update footer year
    }

    function updateWorldClocks() {
        const clockElements = worldClocksContainer.querySelectorAll('.world-clock');
        clockElements.forEach(clock => {
            const timeEl = clock.querySelector('.world-clock-time');
            const dateEl = clock.querySelector('.world-clock-date');
            const timezone = timeEl.dataset.timezone;

            if (!timezone) return; // Skip if timezone data is missing

            try {
                const now = new Date();
                const optionsTime = { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
                const optionsDate = { timeZone: timezone, weekday: 'short', day: '2-digit', month: 'short' };

                const formattedTime = now.toLocaleTimeString('en-US', optionsTime);
                const formattedDate = now.toLocaleDateString('en-US', optionsDate);

                // Update DOM only if value changed
                if (timeEl.textContent !== formattedTime) timeEl.textContent = formattedTime;
                if (dateEl.textContent !== formattedDate) dateEl.textContent = formattedDate;

            } catch (error) {
                // Handle invalid timezones gracefully
                if (error instanceof RangeError) { // Specifically catch timezone errors
                    if (timeEl.textContent !== 'Invalid TZ') timeEl.textContent = 'Invalid TZ';
                    if (dateEl.textContent !== 'Error') dateEl.textContent = 'Error';
                    console.error(`Invalid timezone specified: ${timezone}`);
                } else {
                    console.error(`Error updating world clock for ${timezone}:`, error);
                     if (timeEl.textContent !== 'Error') timeEl.textContent = 'Error';
                     if (dateEl.textContent !== '') dateEl.textContent = '';
                }
            }
        });
    }

    // --- Theme Toggle ---
    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            themeSwitch.checked = false;
        } else {
            document.documentElement.classList.add('dark');
            themeSwitch.checked = true;
        }
    }

    themeSwitch.addEventListener('change', () => {
        const selectedTheme = themeSwitch.checked ? 'dark' : 'light';
        localStorage.setItem('theme', selectedTheme);
        applyTheme(selectedTheme);
    });

    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Default to dark if no preference saved and system prefers dark
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) { // Only change if user hasn't manually set a theme
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });


    // --- World Clock Management ---
    function renderWorldClock(city, timezone) {
        const clockDiv = document.createElement('div');
        // Added transition classes for smoother removal animation if needed later
        clockDiv.className = 'world-clock bg-white/5 dark:bg-gray-900/30 rounded-xl p-5 relative border border-gray-400/20 dark:border-gray-700/30 shadow-md flex flex-col gap-2 transition-opacity duration-300 ease-out';
        clockDiv.innerHTML = `
            <div class="world-clock-city font-orbitron text-lg font-semibold text-pink-500 dark:text-pink-400 truncate">${city}</div>
            <div class="world-clock-time font-orbitron text-2xl font-bold text-gray-800 dark:text-gray-100 tabular-nums" data-timezone="${timezone}">--:--:--</div>
            <div class="world-clock-date text-sm text-gray-600 dark:text-gray-400">Loading...</div>
            <button class="remove-clock absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-lg leading-none focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full" aria-label="Remove ${city} clock">
                <i class="fas fa-times fa-fw"></i>
            </button>
        `;
        worldClocksContainer.appendChild(clockDiv);

        // Add remove functionality
        clockDiv.querySelector('.remove-clock').addEventListener('click', () => {
            removeWorldClock(city, timezone, clockDiv);
        });
    }

     function loadSavedWorldClocks() {
        worldClocksContainer.innerHTML = ''; // Clear container before loading
        if (savedTimezones.length === 0) {
            // Optionally display a message if no clocks are saved
            // worldClocksContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 col-span-full">No world clocks added yet.</p>';
        } else {
            savedTimezones.forEach(tz => renderWorldClock(tz.city, tz.timezone));
            updateWorldClocks(); // Initial update after rendering
        }
    }

    function removeWorldClock(city, timezone, element) {
        // Animate out (optional)
        element.style.opacity = '0';
        setTimeout(() => {
            savedTimezones = savedTimezones.filter(tz => !(tz.city === city && tz.timezone === timezone));
            localStorage.setItem('worldClocks', JSON.stringify(savedTimezones));
            element.remove();
             if (savedTimezones.length === 0) {
                 // Optionally display a message if no clocks are left
             }
        }, 300); // Match duration in CSS transition
    }

    // Populate Timezone Select
    function populateTimezoneSelect() {
        try {
            // Use Intl API if available
            const timezones = Intl.supportedValuesOf('timeZone');
            timezoneSelect.innerHTML = '<option value="" disabled selected>Select a timezone...</option>'; // Clear previous options and add placeholder

            timezones.forEach(tz => {
                const option = document.createElement('option');
                option.value = tz;
                // Try to create a more readable label
                const label = tz.replace(/_/g, ' ').split('/').pop(); // Get last part after /
                option.textContent = `${tz} (${label})`;
                timezoneSelect.appendChild(option);
            });

             // Try to pre-select user's local timezone
             const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
             if (timezones.includes(userTimezone)) {
                timezoneSelect.value = userTimezone;
             }
             timezoneSelect.disabled = false;
             addCityBtn.disabled = false;

        } catch (e) {
            console.error("Timezone listing via Intl failed:", e);
            timezoneSelect.innerHTML = '<option value="" disabled selected>Timezone list unavailable</option>';
            timezoneSelect.disabled = true;
            addCityBtn.disabled = true;
            // Optionally provide a fallback or link to manual entry
        }
    }


    // Modal Handling
    addTimezoneBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Use flex to center content
        cityNameInput.focus(); // Focus the first input
    });

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        cityNameInput.value = ''; // Clear input on close
        // Reset select to default or user's timezone if desired
    }

    closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        // Close if clicking on the backdrop (the modal container itself)
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    addCityBtn.addEventListener('click', () => {
        const city = cityNameInput.value.trim();
        const timezone = timezoneSelect.value;

        if (!city) {
            alert('Please enter a city name.');
            cityNameInput.focus();
            return;
        }
        if (!timezone) {
             alert('Please select a timezone.');
             timezoneSelect.focus();
             return;
        }

        // Prevent duplicates (case-insensitive city check)
        const exists = savedTimezones.some(tz =>
            tz.city.toLowerCase() === city.toLowerCase() || tz.timezone === timezone
        );

        if (!exists) {
            savedTimezones.push({ city, timezone });
            localStorage.setItem('worldClocks', JSON.stringify(savedTimezones));
            renderWorldClock(city, timezone);
            updateWorldClocks(); // Update immediately
            closeModal();
        } else {
             alert('A clock for this city or timezone already exists.');
        }
    });

    // --- Stopwatch ---
    function formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10); // Show hundredths
        // Use innerHTML to render the smaller milliseconds part
        return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}<span class="text-base align-baseline font-normal">.${formatTime(milliseconds)}</span>`;
    }

    function updateStopwatchDisplay() {
        const currentTime = Date.now();
        const currentElapsedTime = stopwatchElapsedTime + (currentTime - stopwatchStartTime);
        stopwatchDisplay.innerHTML = formatStopwatchTime(currentElapsedTime);
    }

    stopwatchStartBtn.addEventListener('click', () => {
        if (!stopwatchRunning) {
            stopwatchStartTime = Date.now(); // Record start time for this segment
            stopwatchInterval = setInterval(updateStopwatchDisplay, 50); // Update more frequently for ms accuracy feel
            stopwatchRunning = true;
            stopwatchStartBtn.disabled = true;
            stopwatchPauseBtn.disabled = false;
            stopwatchResetBtn.disabled = false;
             stopwatchFeature.classList.add('border-green-500/50', 'dark:border-green-400/50'); // Visual feedback
             stopwatchFeature.classList.remove('border-yellow-500/50', 'dark:border-yellow-400/50');
        }
    });

    stopwatchPauseBtn.addEventListener('click', () => {
        if (stopwatchRunning) {
            clearInterval(stopwatchInterval);
            stopwatchRunning = false;
            const currentTime = Date.now();
            stopwatchElapsedTime += (currentTime - stopwatchStartTime); // Add elapsed time of the last run segment
            stopwatchStartBtn.disabled = false;
            stopwatchPauseBtn.disabled = true;
             stopwatchFeature.classList.add('border-yellow-500/50', 'dark:border-yellow-400/50'); // Visual feedback
             stopwatchFeature.classList.remove('border-green-500/50', 'dark:border-green-400/50');
        }
    });

    stopwatchResetBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchElapsedTime = 0;
        stopwatchDisplay.innerHTML = formatStopwatchTime(0);
        stopwatchStartBtn.disabled = false;
        stopwatchPauseBtn.disabled = true;
        stopwatchResetBtn.disabled = true;
        stopwatchFeature.classList.remove('border-green-500/50', 'dark:border-green-400/50', 'border-yellow-500/50', 'dark:border-yellow-400/50'); // Remove visual feedback
    });

    // --- Timer ---
    function formatTimerTime(ms) {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
    }

    function clearTimerVisuals() {
        timerFeature.classList.remove('animate-pulse', 'bg-red-500/20', 'dark:bg-red-400/20', 'border-green-500/50', 'dark:border-green-400/50', 'border-yellow-500/50', 'dark:border-yellow-400/50');
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
    }

    function updateTimerDisplay() {
        const now = Date.now();
        let remaining = timerEndTime - now;

        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerPausedTime = 0;
            timerInitialDuration = 0;
            timerDisplay.textContent = '00:00:00';
            resetTimerControls(true); // Enable inputs after finish
            alert('Timer Finished!');
            // Visual indication
            timerFeature.classList.add('animate-pulse', 'bg-red-500/20', 'dark:bg-red-400/20');
            timerTimeoutId = setTimeout(clearTimerVisuals, 5000); // Remove pulse after 5s
            return;
        }
        timerDisplay.textContent = formatTimerTime(remaining);
    }

    function resetTimerControls(enableInputs) {
        timerStartBtn.disabled = false;
        timerPauseBtn.disabled = true;
        timerResetBtn.disabled = true; // Usually disabled until running or paused
        timerHoursInput.disabled = !enableInputs;
        timerMinutesInput.disabled = !enableInputs;
        timerSecondsInput.disabled = !enableInputs;
        clearTimerVisuals();
    }

    timerStartBtn.addEventListener('click', () => {
        if (timerRunning) return; // Prevent multiple starts

         let durationMs;
         if (timerPausedTime > 0) {
             // Resuming timer
             timerEndTime = Date.now() + timerPausedTime;
             durationMs = timerPausedTime;
             timerPausedTime = 0; // Clear paused time
         } else {
             // Starting new or restarting after reset
             const hours = parseInt(timerHoursInput.value) || 0;
             const minutes = parseInt(timerMinutesInput.value) || 0;
             const seconds = parseInt(timerSecondsInput.value) || 0;
             durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

             if (durationMs <= 0) {
                 alert("Please set a timer duration greater than 0 seconds.");
                 return;
             }
             timerInitialDuration = durationMs; // Store the initial set time
             timerEndTime = Date.now() + durationMs;
         }

         // Update display immediately before interval starts
         timerDisplay.textContent = formatTimerTime(durationMs);

         clearTimerVisuals(); // Clear any previous visual states
         timerInterval = setInterval(updateTimerDisplay, 1000);
         timerRunning = true;

         timerStartBtn.disabled = true;
         timerPauseBtn.disabled = false;
         timerResetBtn.disabled = false; // Enable reset once started
         timerHoursInput.disabled = true;
         timerMinutesInput.disabled = true;
         timerSecondsInput.disabled = true;
         timerFeature.classList.add('border-green-500/50', 'dark:border-green-400/50'); // Visual feedback
         timerFeature.classList.remove('border-yellow-500/50', 'dark:border-yellow-400/50');

    });

    timerPauseBtn.addEventListener('click', () => {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerPausedTime = timerEndTime - Date.now(); // Store remaining time accurately
            timerStartBtn.disabled = false;
            timerPauseBtn.disabled = true;
            // Keep Reset enabled
             timerFeature.classList.add('border-yellow-500/50', 'dark:border-yellow-400/50'); // Visual feedback
             timerFeature.classList.remove('border-green-500/50', 'dark:border-green-400/50');
        }
    });

    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        timerPausedTime = 0;
        // Reset display to the initial duration set by user, or 0 if never started properly
        timerDisplay.textContent = formatTimerTime(timerInitialDuration);
        resetTimerControls(true); // Re-enable inputs on reset
        timerInitialDuration = 0; // Reset initial duration memory
        // Optionally clear inputs:
        // timerHoursInput.value = '';
        // timerMinutesInput.value = '';
        // timerSecondsInput.value = '';
    });

    // Add input constraints for timer fields
    [timerHoursInput, timerMinutesInput, timerSecondsInput].forEach(input => {
        input.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;
            const min = parseInt(e.target.min) || 0;
            const max = parseInt(e.target.max); // Max can be undefined for hours

            if (value < min) value = min;
            if (max !== undefined && value > max) value = max;

            // Prevent leading zeros unless value is 0
            e.target.value = value; // Update value without leading zero if > 0
        });
    });

    // --- Initialization ---
    updateClock(); // Initial call for main clock
    populateTimezoneSelect();
    loadSavedWorldClocks(); // Load and render saved/default world clocks

    // Start intervals
    setInterval(updateClock, 1000); // Update main clock every second
    setInterval(updateWorldClocks, 5000); // Update world clocks every 5 seconds (less frequent is fine)

    // Set initial states for buttons
    stopwatchPauseBtn.disabled = true;
    stopwatchResetBtn.disabled = true;
    timerPauseBtn.disabled = true;
    timerResetBtn.disabled = true;
    timerDisplay.textContent = formatTimerTime(0); // Initial timer display
    stopwatchDisplay.innerHTML = formatStopwatchTime(0); // Initial stopwatch display

    // About link (simple alert)
    const aboutLink = document.getElementById('about-link');
    if(aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Stylish Digital Clock v1.1\n\nFeatures:\n- Main Clock & Date\n- Light/Dark Theme (syncs with system preference)\n- World Clock (add/remove, persists in localStorage)\n- Stopwatch\n- Timer\n- Responsive Design');
        });
    }

}); // End DOMContentLoaded