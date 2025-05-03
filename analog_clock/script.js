document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    const digitalTimeEl = document.getElementById('digital-time');
    const dateDisplayEl = document.getElementById('date-display');
    const localTimezoneNameEl = document.getElementById('local-timezone-name');
    const markingsContainer = document.getElementById('markings-container'); // Main clock face markings
    const clockFace = document.getElementById('clock-face'); // Need this for radius calculation

    const worldClocksGrid = document.getElementById('world-clocks-grid');
    const addTimezoneBtn = document.getElementById('add-timezone-btn');
    const timezoneModal = document.getElementById('timezone-modal');
    const modalContent = timezoneModal.querySelector('.modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalCityNameInput = document.getElementById('modal-city-name');
    const modalTimezoneSelect = document.getElementById('modal-timezone-select');
    const addCityConfirmBtn = document.getElementById('add-city-confirm-btn');

    // --- State Variables ---
    let worldClocks = JSON.parse(localStorage.getItem('worldClocks')) || [
        { city: 'London', timezone: 'Europe/London' },
        { city: 'Tokyo', timezone: 'Asia/Tokyo' },
    ];
    let intervalId = null;

    // --- Utility Functions ---
    function formatTime(num) {
        return num.toString().padStart(2, '0');
    }

    function getCityFromTimezone(timezone) {
        const parts = timezone.split('/');
        return parts[parts.length - 1].replace(/_/g, ' ');
    }

    // --- Clock Rendering ---

    // Function to create markings for a clock face (REVISED)
    function createMarkings(container, faceElement, size) {
        container.innerHTML = ''; // Clear existing marks
        const isMini = size === 'mini';
        // Use the clock face element's size for radius calculation
        const clockRadius = faceElement.offsetWidth / 2;

        // Adjust these based on clock size and desired look
        const majorMarkHeight = isMini ? 4 : 7; // Slightly adjust height
        const majorMarkWidth = isMini ? 1 : 1.5; // Use px for better control
        const minorMarkHeight = isMini ? 2 : 4;
        const minorMarkWidth = 0.5;
        const numeralPadding = isMini ? 8 : 18; // Distance numerals are inset from the edge

        for (let i = 1; i <= 60; i++) {
            const angleDegrees = i * 6;
            const angleRadians = angleDegrees * (Math.PI / 180);
            const isHourMark = i % 5 === 0;
            const hour = i / 5;

            // --- Create the Mark Line ---
            const markLineContainer = document.createElement('div');
            markLineContainer.className = 'mark-line absolute w-full h-full top-0 left-0';
            markLineContainer.style.transform = `rotate(${angleDegrees}deg)`;

            const markElement = document.createElement('div');
            markElement.className = `absolute left-1/2 transform -translate-x-1/2 top-0 rounded-full ${isHourMark ? 'bg-gray-800 dark:bg-gray-300' : 'bg-gray-400 dark:bg-gray-500'}`;
            markElement.style.width = `${isHourMark ? majorMarkWidth : minorMarkWidth}px`;
            markElement.style.height = `${isHourMark ? majorMarkHeight : minorMarkHeight}px`;

            markLineContainer.appendChild(markElement);
            container.appendChild(markLineContainer); // Add the mark line container

            // --- Add Numerals (Only for Main Clock and specific hours) ---
            // Position numerals absolutely relative to the clock face center
            if (isHourMark && !isMini && [12, 3, 6, 9].includes(hour === 0 ? 12 : hour)) {
                const numeralElement = document.createElement('div');
                const displayHour = hour === 0 ? 12 : hour;

                // Calculate position using trigonometry
                // Place it slightly beyond the major mark height
                const numeralRadius = clockRadius - numeralPadding - majorMarkHeight;
                const x = numeralRadius * Math.sin(angleRadians);
                const y = -numeralRadius * Math.cos(angleRadians); // Negative Y is up

                numeralElement.className = 'numeral absolute text-center font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 z-10'; // Added z-index
                // Position the center of the numeral element at the calculated coordinates
                numeralElement.style.left = `calc(50% + ${x}px)`;
                numeralElement.style.top = `calc(50% + ${y}px)`;
                numeralElement.style.transform = 'translate(-50%, -50%)'; // Center the element

                numeralElement.textContent = displayHour;
                container.appendChild(numeralElement); // Add numeral directly to the markings container
            }
        }
    }


    // Function to update any analog clock's hands
    function updateAnalogHands(time, prefix = '') {
        // Ensure elements exist before trying to style them
        const secondHandEl = document.getElementById(`${prefix}second-hand`);
        const minuteHandEl = document.getElementById(`${prefix}minute-hand`);
        const hourHandEl = document.getElementById(`${prefix}hour-hand`);

        if (!hourHandEl || !minuteHandEl) return; // Skip if essential hands missing

        const seconds = time.getSeconds();
        const minutes = time.getMinutes();
        const hours = time.getHours();

        const secondsDeg = seconds * 6;
        const minutesDeg = minutes * 6 + seconds * 0.1;
        const hoursDeg = (hours % 12) * 30 + minutes * 0.5;

        if (secondHandEl) secondHandEl.style.transform = `translateX(-50%) rotate(${secondsDeg}deg)`;
        minuteHandEl.style.transform = `translateX(-50%) rotate(${minutesDeg}deg)`;
        hourHandEl.style.transform = `translateX(-50%) rotate(${hoursDeg}deg)`;
    }

    // Format Date and Time String
    function formatDateTime(time, timeZone) {
        const optionsDate = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: timeZone };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: timeZone };

        const dateStr = time.toLocaleDateString('en-US', optionsDate);
        const timeStr = time.toLocaleTimeString('en-US', optionsTime);

        // Calculate UTC offset using Intl.DateTimeFormat parts
        let offsetStr = 'UTC'; // Default
        try {
            const formatter = Intl.DateTimeFormat('en-US', { timeZoneName: 'longOffset', timeZone: timeZone });
            const parts = formatter.formatToParts(time);
            const tzPart = parts.find(part => part.type === 'timeZoneName');
            if (tzPart) {
                // Extract offset like GMT+5, GMT+5:30, UTC-8 etc.
                const offsetMatch = tzPart.value.match(/(?:GMT|UTC)\s?([+-])(\d{1,2})(?::(\d{2}))?/);
                if (offsetMatch && offsetMatch[1] && offsetMatch[2]) {
                    const sign = offsetMatch[1];
                    const hours = offsetMatch[2];
                    const minutes = offsetMatch[3] || '00'; // Handle optional minutes like in IST
                    // Only show minutes if they are not 00
                    offsetStr = `UTC${sign}${hours}${minutes !== '00' ? ':' + minutes : ''}`;
                }
            }
        } catch (e) { console.warn("Could not get offset for", timeZone, e); }


        return { dateStr, timeStr, offsetStr };
    }

    // --- Main Clock Update ---
    function updateMainClock() {
        const now = new Date();
        updateAnalogHands(now); // Update main analog clock

        // Digital Clock & Date
        const { dateStr, timeStr } = formatDateTime(now); // Use local implicit timezone
        digitalTimeEl.textContent = timeStr;
        dateDisplayEl.textContent = dateStr;

        // Display local timezone name
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            localTimezoneNameEl.textContent = `(${userTimezone.replace(/_/g, ' ')})`;
        } catch (e) {
            localTimezoneNameEl.textContent = '(Timezone Unknown)';
        }
    }

    // --- World Clock Rendering & Update ---
    function renderWorldClockCard(clockData) {
        const { city, timezone } = clockData;
        const cardId = timezone.replace(/[^a-zA-Z0-9]/g, '');

        const card = document.createElement('div');
        card.className = 'world-clock-card bg-white/50 dark:bg-black/30 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-xl p-4 shadow-lg flex flex-col items-center gap-3 relative transition-all duration-300';
        card.dataset.timezone = timezone;
        card.id = `worldcard-${cardId}`;

        card.innerHTML = `
            <button class="remove-clock-btn absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-lg leading-none rounded-full focus:outline-none focus:ring-1 focus:ring-red-500" aria-label="Remove ${city} clock">
                <i class="fas fa-times fa-fw"></i>
            </button>
            <h3 class="city-name text-lg font-semibold text-blue-600 dark:text-blue-400 mt-2 truncate w-full text-center">${city}</h3>
            <div class="mini-analog-clock relative w-28 h-28 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-800 shadow-inner flex items-center justify-center">
                <!-- Mini markings container -->
                <div class="absolute inset-0" id="mini-marks-${cardId}"></div>
                <!-- Center Dot -->
                <div class="absolute w-1.5 h-1.5 bg-gray-700 dark:bg-gray-300 rounded-full z-20"></div>
                <!-- Hands -->
                <div id="mini-${cardId}-hour-hand" class="clock-hand absolute bottom-1/2 left-1/2 transform -translate-x-1/2 w-1 h-[30%] bg-gray-800 dark:bg-gray-400 rounded-t-full origin-bottom z-10"></div>
                <div id="mini-${cardId}-minute-hand" class="clock-hand absolute bottom-1/2 left-1/2 transform -translate-x-1/2 w-0.5 h-[40%] bg-gray-700 dark:bg-gray-300 rounded-t-full origin-bottom z-10"></div>
                <!-- Optional mini second hand
                <div id="mini-${cardId}-second-hand" class="second-hand clock-hand absolute bottom-1/2 left-1/2 transform -translate-x-1/2 w-0.5 h-[45%] bg-blue-500 dark:bg-blue-400 rounded-t-full origin-bottom z-10"></div>
                -->
            </div>
            <div class="digital-time font-orbitron text-lg text-gray-800 dark:text-gray-200 tabular-nums">--:--:-- --</div>
            <div class="date text-xs text-gray-600 dark:text-gray-400">Loading Date...</div>
            <div class="offset text-xs text-gray-500 dark:text-gray-500">UTC+/-?</div>
        `;

        worldClocksGrid.appendChild(card);
        // Pass the mini clock face element itself for radius calculation
        const miniClockFace = card.querySelector('.mini-analog-clock');
        createMarkings(card.querySelector(`#mini-marks-${cardId}`), miniClockFace, 'mini');

        card.querySelector('.remove-clock-btn').addEventListener('click', () => removeWorldClock(timezone));
    }

    function updateWorldClocks() {
        const now = new Date();

        worldClocks.forEach(clockData => {
            const { timezone } = clockData;
            const cardId = timezone.replace(/[^a-zA-Z0-9]/g, '');
            const cardElement = document.getElementById(`worldcard-${cardId}`);
            if (!cardElement) return;

            try {
                // Get current time in the target timezone using a reliable method
                // Create a date object representing the current instant but formatted for the target zone
                const worldTimeForAnalog = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

                updateAnalogHands(worldTimeForAnalog, `mini-${cardId}-`);

                // Update Digital Time, Date, Offset
                const { dateStr, timeStr, offsetStr } = formatDateTime(now, timezone); // Pass current instant `now`
                const digitalEl = cardElement.querySelector('.digital-time');
                const dateEl = cardElement.querySelector('.date');
                const offsetEl = cardElement.querySelector('.offset');

                if (digitalEl) digitalEl.textContent = timeStr;
                if (dateEl) dateEl.textContent = dateStr;
                if (offsetEl) offsetEl.textContent = offsetStr;

            } catch (e) {
                console.error(`Error updating clock for ${timezone}:`, e);
                const digitalEl = cardElement.querySelector('.digital-time');
                if (digitalEl) {
                    digitalEl.textContent = 'Error';
                    cardElement.querySelector('.date').textContent = 'Invalid Timezone?';
                    cardElement.querySelector('.offset').textContent = '';
                }
            }
        });
    }

    function removeWorldClock(timezone) {
        const cardId = timezone.replace(/[^a-zA-Z0-9]/g, '');
        const cardElement = document.getElementById(`worldcard-${cardId}`);
        if (cardElement) {
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.9)';
            setTimeout(() => cardElement.remove(), 300);
        }

        worldClocks = worldClocks.filter(clock => clock.timezone !== timezone);
        localStorage.setItem('worldClocks', JSON.stringify(worldClocks));
    }

    // --- Modal Handling --- (Code is identical to previous version, included for completeness)
    function openModal() {
        populateTimezoneSelect();
        modalCityNameInput.value = '';
        timezoneModal.classList.remove('hidden');
        timezoneModal.classList.add('flex');
        requestAnimationFrame(() => {
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
            timezoneModal.style.opacity = '1';
        });
    }

    function closeModal() {
        modalContent.style.transform = 'scale(0.95)';
        modalContent.style.opacity = '0';
        timezoneModal.style.opacity = '0';
        setTimeout(() => {
            timezoneModal.classList.add('hidden');
            timezoneModal.classList.remove('flex');
        }, 300);
    }

    addTimezoneBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    timezoneModal.addEventListener('click', (e) => {
        if (e.target === timezoneModal) {
            closeModal();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !timezoneModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    function populateTimezoneSelect() {
        if (modalTimezoneSelect.options.length > 1) return;

        try {
            const timezones = Intl.supportedValuesOf('timeZone');
            modalTimezoneSelect.innerHTML = '<option value="" disabled selected>Select a timezone...</option>';

            timezones.forEach(tz => {
                const option = document.createElement('option');
                option.value = tz;
                option.textContent = tz.replace(/_/g, ' ');
                modalTimezoneSelect.appendChild(option);
            });
            modalTimezoneSelect.disabled = false;
            addCityConfirmBtn.disabled = false;

        } catch (e) {
            console.error("Timezone listing failed:", e);
            modalTimezoneSelect.innerHTML = '<option value="" disabled selected>Timezone list unavailable</option>';
            modalTimezoneSelect.disabled = true;
            addCityConfirmBtn.disabled = true;
        }
    }

    addCityConfirmBtn.addEventListener('click', () => {
        const selectedTimezone = modalTimezoneSelect.value;
        if (!selectedTimezone) {
            alert('Please select a timezone.');
            return;
        }

        if (worldClocks.some(clock => clock.timezone === selectedTimezone)) {
            alert('This timezone has already been added.');
            return;
        }

        const customCityName = modalCityNameInput.value.trim();
        const cityName = customCityName || getCityFromTimezone(selectedTimezone);

        const newClockData = { city: cityName, timezone: selectedTimezone };
        worldClocks.push(newClockData);
        localStorage.setItem('worldClocks', JSON.stringify(worldClocks));

        renderWorldClockCard(newClockData);
        updateWorldClocks(); // Update all immediately, including the new one
        closeModal();
    });


    // --- Initialization ---
    function initializeClocks() {
        if (intervalId) clearInterval(intervalId);

        // Create markings for the main clock face, passing the face element
        createMarkings(markingsContainer, clockFace, 'large');

        worldClocksGrid.innerHTML = '';
        worldClocks.forEach(renderWorldClockCard);

        updateMainClock();
        updateWorldClocks(); // Initial update necessary

        intervalId = setInterval(() => {
            updateMainClock();
            updateWorldClocks();
        }, 1000);
    }

    // Re-initialize if the window is resized significantly (optional, for radius accuracy)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Re-create markings if radius calculation depends on size
            createMarkings(markingsContainer, clockFace, 'large');
            // Re-render mini clocks' markings too if necessary
            document.querySelectorAll('.mini-analog-clock').forEach(miniClock => {
                const marksContainer = miniClock.querySelector('[id^="mini-marks-"]');
                if (marksContainer) createMarkings(marksContainer, miniClock, 'mini');
            });
        }, 250); // Debounce resize event
    });

    initializeClocks(); // Run on load

}); // End DOMContentLoaded