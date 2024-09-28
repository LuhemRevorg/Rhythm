// src/pages/MainPage.js
import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import Navbar from '../components/Navbar';
import RecordRTC from 'recordrtc';

function MainPage() {
  const [script, setScript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(new Uint8Array(0));
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const audioPlayerRef = useRef(new Audio()); // Reference to the audio player

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
    }
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

  const handleSubmit = () => {
    if (script && audioURL) {
      setIsSubmitting(true); // Show spinner
      setScript(''); // Clear the script
      setAudioURL(null); // Clear the audio URL

      // Hide spinner after 10 seconds
      setTimeout(() => {
        setIsSubmitting(false);
      }, 10000);
    } else {
      alert('Please fill in the script and record audio before submitting.');
    }
  };

  return (
    <div className={`${styles.page} ${isSubmitting ? styles.blurred : ''}`}>
      <Navbar />
      <div className={styles.scriptContainer}>
        <h1>Welcome to the Main Page</h1>
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
            </>
          )}
          <button className={styles.submitButton} onClick={handleSubmit}>
            Submit Script & Audio
          </button>
        </div>
        <canvas ref={canvasRef} width="600" height="100" className={styles.visualizer}></canvas>
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
