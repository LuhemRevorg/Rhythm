import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import RecordRTC from 'recordrtc';
import WaveM from "../videos/Waves.mp4";

function MainPage() {
  const [script, setScript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(new Uint8Array(0));
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());
  const intervalRef = useRef(null);
  const maxRecordingDuration = 60; // Set max duration to 60 seconds

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorderRef.current = RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/wav',
      bitsPerSecond: 128000,
    });

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 2048;

    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

    recorderRef.current.startRecording();
    setIsRecording(true);
    drawVisualizer();

    // Automatically stop recording after max duration
    setTimeout(stopRecording, maxRecordingDuration * 1000);
  };

  const stopRecording = () => {
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      setIsRecording(false);
      cancelAnimationFrame(animationRef.current);
      audioContextRef.current.close();
    });
  };

  const playRecording = () => {
    if (audioURL) {
      audioPlayerRef.current.src = audioURL; // Set the audio source
      audioPlayerRef.current.play(); // Play the audio

      audioPlayerRef.current.onloadedmetadata = () => {
        setDuration(Math.min(audioPlayerRef.current.duration, maxRecordingDuration)); // Set duration with a max limit
      };

      setCurrentTime(0); // Reset current time
      startTimer(); // Start the timer
    }
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      if (audioPlayerRef.current && !audioPlayerRef.current.ended) {
        setCurrentTime(audioPlayerRef.current.currentTime);
      }
    }, 1000);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
  };

  const handleAudioSeek = (event) => {
    const newTime = (event.target.value / 100) * duration;
    audioPlayerRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const stopPlayback = () => {
    audioPlayerRef.current.pause();
    pauseTimer();
  };

  const drawVisualizer = () => {
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;
    canvasContext.fillStyle = 'rgba(30, 30, 30, 0.8)';
    canvasContext.fillRect(0, 0, width, height);

    const barWidth = (width / dataArrayRef.current.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      barHeight = dataArrayRef.current[i];
      const red = (barHeight + 100) * 2;
      const green = 250 * (barHeight / 255);
      const blue = 50;

      canvasContext.fillStyle = `rgb(${red},${green},${blue})`;
      canvasContext.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }

    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  const downloadAudio = () => {
    if (audioURL) {
      const link = document.createElement('a');
      link.href = audioURL;
      link.download = 'recording.wav'; // Set the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async () => {
    if (script && audioURL) {
      setIsSubmitting(true); // Show spinner

      // Prepare the form data
      const formData = new FormData();
      formData.append('script', script);
      formData.append('audio', await fetch(audioURL).then(res => res.blob())); // Fetch the audio as a blob

      try {
        // Send the form data to the Flask backend
        const response = await fetch('http://localhost:8080/predict', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log(result); // Log the entire result for debugging

          // Display both the received message and the script message
          alert(`${result.message}\n${result.script}`);
        } else {
          console.error('Error sending audio to backend');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setScript(''); // Clear the script
        setAudioURL(null); // Clear the audio URL
        setIsSubmitting(false); // Hide spinner
        pauseTimer(); // Stop the timer
      }
    } else {
      alert('Please fill in the script and record audio before submitting.');
    }
  };

  useEffect(() => {
    // Clean up audio player on unmount
    return () => {
      audioPlayerRef.current.pause();
      pauseTimer();
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className={`${styles.page} ${isSubmitting ? styles.blurred : ''}`}>
      <div className={styles.boxContainer}>
        <div className={styles.scriptBoxes}>
          <div className={styles.scriptContainer}>
            <h1>Enter your Transcript and speak here!</h1>
            <textarea
              className={styles.scriptBox}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your script here..."
            />
            <div className={styles.buttonContainer}>
              {isRecording ? (
                <button className={styles.recordButton} onClick={stopRecording}>
                  Stop Recording
                </button>
              ) : (
                <button className={styles.recordButton} onClick={startRecording}>
                  Start Recording
                </button>
              )}
              {audioURL && (
                <>
                  <button className={styles.playButton} onClick={playRecording}>
                    Play Recording
                  </button>
                  <button className={styles.downloadButton} onClick={downloadAudio}>
                    Download Audio
                  </button>
                  <div className={styles.audioControls}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(currentTime / duration) * 100 || 0}
                      onChange={handleAudioSeek}
                      className={styles.audioSeekBar}
                    />
                    <div className={styles.audioTimer}>
                      {Math.floor(currentTime)} / {Math.floor(duration)} seconds
                    </div>
                  </div>
                </>
              )}
              <button className={styles.submitButton} onClick={handleSubmit}>
                Submit Script & Audio
              </button>
            </div>
            <canvas ref={canvasRef} width="600" height="100" className={styles.visualizer}></canvas>
          </div>

          <div className={styles.scriptContainer}>
            <h1>AI based feedback here:</h1>
          </div>
        </div>
      </div>

      <div className={styles.video_container}>
        <video className={styles.bottom_video} autoPlay loop muted>
          <source src={WaveM} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {isSubmitting && (
        <div className={styles.spinnerContainer}>
          <img src="/path/to/soundWave.png" alt="Sound Wave" className={styles.spinnerImage} />
        </div>
      )}
    </div>
  );
}

export default MainPage;
