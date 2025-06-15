const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const micSelect = document.getElementById('micSelect');
const statusText = document.getElementById('status');
const volumeBar = document.getElementById('volumeBar');

let audioContext;
let stream;
let source;
let gainNode;
let analyser;
let animationId;

// List available mics
async function loadMicOptions() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  micSelect.innerHTML = '';
  devices
    .filter(device => device.kind === 'audioinput')
    .forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Mic ${micSelect.length + 1}`;
      micSelect.appendChild(option);
    });
}

navigator.mediaDevices.getUserMedia({ audio: true }).then(loadMicOptions);

startButton.addEventListener('click', async () => {
  try {
    startButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = "Starting...";

    const deviceId = micSelect.value;

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0,
        sampleRate: 48000,
        channelCount: 1
      }
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 0.001,
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
        let val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      const width = Math.min(100, Math.floor(volume * 400)); // scale to 0–100
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
  if (source) source.disconnect();
  if (gainNode) gainNode.disconnect();
  if (analyser) analyser.disconnect();
  if (audioContext) audioContext.close();
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  cancelAnimationFrame(animationId);
  volumeBar.style.width = '0%';

  statusText.textContent = "🔇 Mic stopped.";
  startButton.disabled = false;
  stopButton.disabled = true;
});
