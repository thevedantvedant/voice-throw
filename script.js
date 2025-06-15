const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusText = document.getElementById('status');

let audioContext;
let stream;
let source;
let gainNode;

startButton.addEventListener('click', async () => {
  try {
    startButton.disabled = true;
    statusText.textContent = "Starting...";

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 0.001,
      sampleRate: 48000
    });

    await audioContext.resume();

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0,
        sampleRate: 48000,
        channelCount: 1
      }
    });

    source = audioContext.createMediaStreamSource(stream);
    gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    source.connect(gainNode).connect(audioContext.destination);

    statusText.textContent = "🎧 Mic is live!";
    stopButton.disabled = false;
  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Error: " + err.message;
    startButton.disabled = false;
  }
});

stopButton.addEventListener('click', () => {
  try {
    if (source) source.disconnect();
    if (gainNode) gainNode.disconnect();
    if (audioContext) audioContext.close();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    statusText.textContent = "🔇 Mic stopped.";
    startButton.disabled = false;
    stopButton.disabled = true;
  } catch (err) {
    console.error(err);
    statusText.textContent = "Error stopping: " + err.message;
  }
});
