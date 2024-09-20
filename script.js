const video = document.getElementById('video');
const output = document.getElementById('output');
const canvas = document.getElementById('canvasOutput');
const ctx = canvas.getContext('2d');

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

// Access the camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing the camera: ", err);
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
        cv.threshold(gray, threshold, 200, 255, cv.THRESH_BINARY);

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

    requestAnimationFrame(processVideo);
};
