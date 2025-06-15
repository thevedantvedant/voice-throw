const startButton = document.getElementById('startButton');
const statusText = document.getElementById('status');
let audioContext;

startButton.addEventListener('click', async () => {
  try {
    startButton.disabled = true;
    statusText.textContent = "Starting...";

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 0.001, // Aggressive low-latency
      sampleRate: 48000
    });

    await audioContext.resume();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0,
        sampleRate: 48000,
        channelCount: 1
      }
    });

    const source = audioContext.createMediaStreamSource(stream);
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    source.connect(gainNode).connect(audioContext.destination);

    statusText.textContent = "🎧 Live mic is routing to your output!";
  } catch (err) {
    console.error(err);
    statusText.textContent = "Error: " + err.message;
    startButton.disabled = false;
  }
});
