document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const billInput = document.getElementById('bill-input');
    const peopleInput = document.getElementById('people-input');
    const tipButtons = document.querySelectorAll('.tip-button');
    const customTipInput = document.getElementById('custom-tip-input');
    const tipAmountEl = document.getElementById('tip-amount');
    const totalAmountEl = document.getElementById('total-amount');
    const resetBtn = document.getElementById('reset-btn');
    const peopleErrorEl = document.getElementById('people-error');

    const themeSelect = document.getElementById('theme-select');
    const currencySelect = document.getElementById('currency-select');
    const htmlElement = document.documentElement;

    // History Elements
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyModalContent = historyModal.querySelector('.history-modal-content');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyListEl = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const noHistoryMsg = document.getElementById('no-history-msg');

    // --- Currency Data ---
    const currencies = {
        'USD': { symbol: '$', name: 'US Dollar' },
        'EUR': { symbol: '€', name: 'Euro' },
        'GBP': { symbol: '£', name: 'British Pound' },
        'JPY': { symbol: '¥', name: 'Japanese Yen' },
        'CAD': { symbol: '$', name: 'Canadian Dollar' },
        'AUD': { symbol: '$', name: 'Australian Dollar' },
        'PKR': { symbol: 'Rs', name: 'Pakistani Rupee' }, // Added PKR
        'BRL': { symbol: 'R$', name: 'Brazilian Real' },
        'CHF': { symbol: 'CHF', name: 'Swiss Franc' },
        'CNY': { symbol: '¥', name: 'Chinese Yuan' },
        'NZD': { symbol: '$', name: 'New Zealand Dollar' },
        'ZAR': { symbol: 'R', name: 'South African Rand' }
        // Removed INR
    };

    // --- State Variables ---
    let billValue = 0.0;
    let tipPercent = 0;
    let peopleValue = 1;
    let selectedCurrency = 'USD';
    let selectedTheme = 'dark'; // Default theme
    let calculationHistory = []; // Array to hold history objects

    // --- Populate Dropdowns ---
    function populateCurrencySelect() {
        currencySelect.innerHTML = '';
        for (const code in currencies) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} (${currencies[code].symbol})`;
            currencySelect.appendChild(option);
        }
    }

    // --- Utility Functions ---
    function formatCurrency(value) {
        const numericValue = parseFloat(value);
        const options = {
            style: 'currency',
            currency: selectedCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };
        let formattedValue = `${currencies[selectedCurrency]?.symbol || '$'}0.00`; // Default fallback

        if (!isNaN(numericValue) && isFinite(numericValue)) {
            try {
                formattedValue = new Intl.NumberFormat(navigator.language || 'en-US', options).format(numericValue);
            } catch (e) {
                console.warn(`Currency formatting failed for ${selectedCurrency}:`, e);
                // Basic fallback with symbol
                formattedValue = `${currencies[selectedCurrency]?.symbol || '$'}${numericValue.toFixed(2)}`;
            }
        }
         // Handle cases like JPY where Intl might not add symbol prefix sometimes
         // Or ensure symbol is always present if needed (though Intl usually handles it)
        return formattedValue;
    }

    function setActiveTipButton(selectedButton) {
        tipButtons.forEach(button => button.classList.remove('selected'));
        if (selectedButton) selectedButton.classList.add('selected');
    }

    // --- Theme Handling ---
    function applyTheme(themeName) {
        htmlElement.className = ''; // Clear all theme classes
        htmlElement.classList.add(`theme-${themeName}`);
        selectedTheme = themeName;
        localStorage.setItem('tipCalcTheme', themeName);
        if (themeSelect.value !== themeName) themeSelect.value = themeName;
    }

    // --- Currency Handling ---
    function applyCurrency(currencyCode) {
        if (currencies[currencyCode]) {
            selectedCurrency = currencyCode;
            localStorage.setItem('tipCalcCurrency', currencyCode);
            calculateTip(); // Recalculate with new format
            if (currencySelect.value !== currencyCode) currencySelect.value = currencyCode;
        }
    }

    // --- History Management ---
    function loadHistory() {
        const savedHistory = localStorage.getItem('tipCalcHistory');
        calculationHistory = savedHistory ? JSON.parse(savedHistory) : [];
        renderHistory(); // Update the modal display
    }

    function saveHistory(calculation) {
        calculationHistory.unshift(calculation); // Add new calculation to the beginning
        // Optional: Limit history size
        // if (calculationHistory.length > 50) {
        //     calculationHistory.pop(); // Remove the oldest item
        // }
        localStorage.setItem('tipCalcHistory', JSON.stringify(calculationHistory));
        renderHistory(); // Update modal display if it's open
    }

    function renderHistory() {
        historyListEl.innerHTML = ''; // Clear current list
        if (calculationHistory.length === 0) {
            noHistoryMsg.classList.remove('hidden');
            clearHistoryBtn.disabled = true;
        } else {
            noHistoryMsg.classList.add('hidden');
            clearHistoryBtn.disabled = false;
            calculationHistory.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item border rounded-lg p-3 text-sm flex flex-col gap-1';
                // Use saved formatted values for consistency
                historyItem.innerHTML = `
                    <div class="flex justify-between text-xs opacity-70 mb-1">
                        <span>#${calculationHistory.length - index}</span>
                        <span>${item.dateTime}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Bill:</span> <span class="font-medium text-right">${item.billFormatted}</span>
                        <span>Tip %:</span> <span class="font-medium text-right">${item.tipPercent}%</span>
                        <span>People:</span> <span class="font-medium text-right">${item.people}</span>
                        <span class="col-span-2 border-t my-1 border-current opacity-20"></span>
                        <span>Tip/Person:</span> <span class="font-medium text-right">${item.tipPerPersonFormatted}</span>
                        <span>Total/Person:</span> <span class="font-medium text-right">${item.totalPerPersonFormatted}</span>
                    </div>
                `;
                historyListEl.appendChild(historyItem);
            });
        }
    }

    function clearHistory() {
        if (confirm("Are you sure you want to clear all calculation history? This cannot be undone.")) {
            calculationHistory = [];
            localStorage.removeItem('tipCalcHistory');
            renderHistory();
        }
    }

    // --- Modal Handling ---
    function openHistoryModal() {
        renderHistory(); // Ensure latest history is shown
        historyModal.classList.remove('hidden');
        historyModal.classList.add('flex');
        requestAnimationFrame(() => historyModal.classList.add('open')); // Trigger animation
    }

    function closeHistoryModal() {
        historyModal.classList.remove('open');
        setTimeout(() => {
            historyModal.classList.add('hidden');
            historyModal.classList.remove('flex');
        }, 300); // Match animation duration
    }

    // --- Calculation Logic ---
    function calculateTip(saveToHistory = false) { // Add flag to control history saving
        // Validation
        if (isNaN(billValue) || billValue < 0) billValue = 0;
        if (isNaN(tipPercent) || tipPercent < 0) tipPercent = 0;

        let isPeopleValid = true;
        let currentPeopleValue = parseInt(peopleInput.value); // Read fresh value for validation
        if (isNaN(currentPeopleValue) || currentPeopleValue <= 0) {
             isPeopleValid = false;
             peopleErrorEl.classList.remove('hidden');
             peopleInput.classList.add('border-error');
        } else {
            peopleValue = currentPeopleValue; // Update state only if valid
            peopleErrorEl.classList.add('hidden');
            peopleInput.classList.remove('border-error');
        }

        // Calculate or reset results
        let tipPerPerson = 0, totalPerPerson = 0;
        let tipPerPersonFormatted = formatCurrency(0), totalPerPersonFormatted = formatCurrency(0);

        if (isPeopleValid) {
            const tipTotal = billValue * (tipPercent / 100);
            const totalBill = billValue + tipTotal;
            tipPerPerson = tipTotal / peopleValue;
            totalPerPerson = totalBill / peopleValue;

            tipPerPersonFormatted = formatCurrency(tipPerPerson);
            totalPerPersonFormatted = formatCurrency(totalPerPerson);
        }

        tipAmountEl.textContent = tipPerPersonFormatted;
        totalAmountEl.textContent = totalPerPersonFormatted;

        // Enable reset button logic
        const hasValue = billValue > 0 || tipPercent > 0 || customTipInput.value !== '' || peopleValue > 1;
        resetBtn.disabled = !hasValue && isPeopleValid;

        // Save to history if requested and valid calculation occurred
        if (saveToHistory && isPeopleValid && hasValue) {
            const now = new Date();
            const calculation = {
                bill: billValue,
                billFormatted: formatCurrency(billValue), // Save formatted bill too
                tipPercent: tipPercent,
                people: peopleValue,
                tipPerPerson: tipPerPerson,
                totalPerPerson: totalPerPerson,
                tipPerPersonFormatted: tipPerPersonFormatted, // Save formatted results
                totalPerPersonFormatted: totalPerPersonFormatted,
                currency: selectedCurrency,
                dateTime: now.toLocaleString() // Simple timestamp
            };
            saveHistory(calculation);
        }
    }

    // --- Event Handlers ---
    function handleBillInput() {
        billValue = parseFloat(billInput.value) || 0;
        calculateTip(true); // Save on valid input change completion
    }

    function handlePeopleInput() {
        calculateTip(true); // Validate and potentially save on valid input
    }

    function handleTipButtonClick(event) {
        const button = event.target;
        tipPercent = parseFloat(button.dataset.tip);
        customTipInput.value = '';
        setActiveTipButton(button);
        calculateTip(true); // Save when tip button is clicked
    }

    function handleCustomTipInput() {
        tipPercent = parseFloat(customTipInput.value) || 0;
        setActiveTipButton(null);
        calculateTip(true); // Save when custom tip changes
    }

    function handleThemeChange() { applyTheme(themeSelect.value); }
    function handleCurrencyChange() { applyCurrency(currencySelect.value); }

    function resetCalculator() {
        billValue = 0.0; tipPercent = 0; peopleValue = 1;
        billInput.value = ''; peopleInput.value = '1'; customTipInput.value = '';
        setActiveTipButton(null);
        calculateTip(); // Recalculate to show $0.00 and update reset state
    }

    // --- Event Listeners ---
    billInput.addEventListener('input', handleBillInput);
    peopleInput.addEventListener('input', handlePeopleInput);
    customTipInput.addEventListener('input', handleCustomTipInput);
    themeSelect.addEventListener('change', handleThemeChange);
    currencySelect.addEventListener('change', handleCurrencyChange);
    tipButtons.forEach(button => button.addEventListener('click', handleTipButtonClick));
    customTipInput.addEventListener('focus', () => setActiveTipButton(null));
    resetBtn.addEventListener('click', resetCalculator);

    // History Modal Listeners
    viewHistoryBtn.addEventListener('click', openHistoryModal);
    closeHistoryBtn.addEventListener('click', closeHistoryModal);
    clearHistoryBtn.addEventListener('click', clearHistory);
    historyModal.addEventListener('click', (e) => { if (e.target === historyModal) closeHistoryModal(); }); // Close on backdrop click
     window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && historyModal.classList.contains('open')) closeHistoryModal(); });


    // --- Initialization ---
    function initializeApp() {
        populateCurrencySelect();
        loadHistory(); // Load history first

        const savedTheme = localStorage.getItem('tipCalcTheme') || 'dark';
        applyTheme(savedTheme);

        const savedCurrency = localStorage.getItem('tipCalcCurrency') || 'USD';
        applyCurrency(savedCurrency);

        calculateTip(); // Initial display update
    }

    initializeApp();

}); // End DOMContentLoaded