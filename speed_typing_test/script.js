const gameContainer = document.getElementById('game-container');
const textPrompt = document.getElementById('text-prompt');
const typingInput = document.getElementById('typing-input');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty');
const resultModal = document.getElementById('result-modal');
const wpmResult = document.getElementById('wpm-result');
const accuracyResult = document.getElementById('accuracy-result');
const loadingScreen = document.querySelector('.loading');

// Text samples for each difficulty
const texts = {
    easy: "The quick brown fox jumps over the lazy dog. This is a simple sentence to type and practice your speed.",
    medium: "Programming is an art that requires patience, logic, and creativity. Practice makes perfect in this field of endless possibilities.",
    hard: "The labyrinthine complexity of quantum mechanics baffles even the most astute physicists, requiring meticulous precision and unwavering dedication."
};

let gameStarted = false, timeLeft, timerInterval, typedText = '', promptText = '';
const timeLimits = { easy: 60, medium: 45, hard: 30 }; // Seconds per difficulty

// Initialize
setTimeout(() => loadingScreen.classList.add('hidden'), 1500);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    const difficulty = difficultySelect.value;
    promptText = texts[difficulty];
    textPrompt.textContent = promptText;
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();
    startBtn.textContent = 'Restart';
    timeLeft = timeLimits[difficulty];
    timerDisplay.textContent = timeLeft;
    resultModal.classList.remove('active');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameStarted = false;
    clearInterval(timerInterval);
    typingInput.disabled = true;
    const difficulty = difficultySelect.value;
    const totalTime = timeLimits[difficulty] / 60; // Convert to minutes
    typedText = typingInput.value.trim();
    
    // Calculate WPM
    const wordsTyped = typedText.split(/\s+/).length;
    const wpm = Math.round(wordsTyped / totalTime);
    
    // Calculate Accuracy
    const correctChars = typedText.split('').filter((char, i) => char === promptText[i]).length;
    const accuracy = Math.round((correctChars / promptText.length) * 100);

    wpmResult.textContent = `Typing Speed: ${wpm} WPM`;
    accuracyResult.textContent = `Accuracy: ${accuracy}%`;
    resultModal.classList.add('active');
}

function restartGame() {
    gameStarted = false;
    clearInterval(timerInterval);
    typingInput.disabled = true;
    startBtn.textContent = 'Start Test';
    timerDisplay.textContent = timeLimits[difficultySelect.value];
    textPrompt.textContent = '';
    typingInput.value = '';
    resultModal.classList.remove('active');
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (gameStarted) {
        restartGame();
        startGame();
    } else {
        startGame();
    }
});

typingInput.addEventListener('input', (e) => {
    typedText = e.target.value;
});

// Prevent pasting (optional for fairness)
typingInput.addEventListener('paste', (e) => e.preventDefault());