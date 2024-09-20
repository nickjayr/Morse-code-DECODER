const video = document.getElementById('video');
const output = document.getElementById('output');
const canvas = document.getElementById('canvasOutput');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const saveButton = document.getElementById('saveButton');
const thresholdSlider = document.getElementById('thresholdSlider');

// Morse code dictionary
const morseCode = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
    '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
    '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
    '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
    '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
    '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9'
};

// Start camera on button click
startButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.style.display = 'block';
            startButton.style.display = 'none';
            processVideo();
        })
        .catch(err => {
            console.error("Error accessing the camera: ", err);
            alert("Error accessing the camera. Please try again.");
        });
});

// Save decoded message
saveButton.addEventListener('click', () => {
    const text = output.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'decoded_message.txt';
    anchor.click();
});

// Initialize OpenCV.js
cv['onRuntimeInitialized'] = () => {
    const cap = new cv.VideoCapture(video);
    const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    const gray = new cv.Mat();
    const threshold = new cv.Mat();

    let lastFlashTime = 0;
    let morseString = '';
    let decoding = false;

    function processVideo() {
        cap.read(src);
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.threshold(gray, threshold, parseInt(thresholdSlider.value), 255, cv.THRESH_BINARY);

        // Detect flashes
        let mean = cv.mean(threshold)[0];
        let currentTime = Date.now();

        if (mean > 200) { // Flash detected
            if (!decoding) {
                decoding = true;
                lastFlashTime = currentTime;
            } else {
                let duration = currentTime - lastFlashTime;
                if (duration > 200 && duration < 600) {
                    morseString += '.';
                } else if (duration >= 600) {
                    morseString += '-';
                }
                lastFlashTime = currentTime;
            }
        } else if (decoding) {
            let duration = currentTime - lastFlashTime;
            if (duration >= 600) {
                if (morseString) {
                    output.innerText += morseCode[morseString] || '';
                    morseString = '';
                }
                decoding = false;
            }
        }

        cv.imshow('canvasOutput', threshold);
        requestAnimationFrame(processVideo);
    }
};
