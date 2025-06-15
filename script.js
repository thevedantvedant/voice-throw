const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusText = document.getElementById('status');
const volumeBar = document.getElementById('volumeBar');

let audioContext;
let stream;
let source;
let gainNode;
let analyser;
let animationId;

startButton.addEventListener('click', async () => {
  try {
    startButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = "Starting...";

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0,
        channelCount: 1
      }
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 48000
    });

    await audioContext.resume();

    source = audioContext.createMediaStreamSource(stream);
    gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(gainNode).connect(audioContext.destination);
    source.connect(analyser);

    const updateMeter = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      const width = Math.min(100, Math.floor(volume * 400));
      volumeBar.style.width = `${width}%`;
      animationId = requestAnimationFrame(updateMeter);
    };

    updateMeter();
    statusText.textContent = "🎧 Mic is live!";
  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Error: " + err.message;
    startButton.disabled = false;
    stopButton.disabled = true;
  }
});

stopButton.addEventListener('click', () => {
  try {
    if (animationId) cancelAnimationFrame(animationId);
    if (source) source.disconnect();
    if (gainNode) gainNode.disconnect();
    if (analyser) analyser.disconnect();
    if (audioContext && audioContext.state !== 'closed') audioContext.close();

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    volumeBar.style.width = '0%';
    statusText.textContent = "🔇 Mic stopped.";
    startButton.disabled = false;
    stopButton.disabled = true;
  } catch (err) {
    console.error('Stop error:', err);
    statusText.textContent = "❌ Stop failed";
  }
});
/* ... keep existing consts ... */

let usbMicId = null;

// Detect devices on load
async function detectUsbMic() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices
      .filter(d => d.kind === 'audioinput')
      .forEach(d => {
        // Many USB mics have 'USB' or 'External' in label
        if (/usb|external|type-c/i.test(d.label)) {
          usbMicId = d.deviceId;
        }
      });
  } catch (e) {
    console.warn('Device enumeration fail:', e);
  }
}

// Run detection at start
detectUsbMic();

startButton.addEventListener('click', async () => {
  try {
    startButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = 'Starting...';

    const micConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      latency: 0,
      channelCount: 1
    };

    if (usbMicId) {
      micConstraints.deviceId = { exact: usbMicId };
      console.log('Using USB mic ID:', usbMicId);
    }

    stream = await navigator.mediaDevices.getUserMedia({ audio: micConstraints });
    /* ... rest of your setup: audioContext, analyser, meter ... */
  } catch (err) {
    console.error(err);
    statusText.textContent = '❌ Error: ' + err.message;
    startButton.disabled = false;
    stopButton.disabled = true;
  }
});

