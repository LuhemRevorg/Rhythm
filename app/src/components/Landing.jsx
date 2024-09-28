import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './landing.module.css';
import BackgroundVideo from '../videos/background-video.mp4'; 
import Navbar from './Navbar';
import Speaker1 from "../images/Speaker1.png"

const sentences = [
  "Revolutionalize the world",
  "Make each move with confidence",
  "Reach the hearts of people",
  "Boost your confidence",
  "Train your inner speaker",
  "Master Vocal projection"
];

function Landing() {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showSpeakerBoxes, setShowSpeakerBoxes] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false); // New state for navbar visibility

  const navigate = useNavigate();

  useEffect(() => {
    const timerBlur = setTimeout(() => {
      setIsBlurred(true);
      setIsTextVisible(true);
    }, 5000);

    const textCycleInterval = setInterval(() => {
      setCurrentSentenceIndex((prevIndex) => (prevIndex + 1) % sentences.length);
    }, 3000);

    const speakerTimer = setTimeout(() => {
      setShowSpeakerBoxes(true);
    }, 5500);

    const navbarTimer = setTimeout(() => {
      setShowNavbar(true); // Show navbar after text appears
    }, 6000); // Delay to show navbar after the text

    return () => {
      clearTimeout(timerBlur);
      clearTimeout(speakerTimer);
      clearTimeout(navbarTimer);
      clearInterval(textCycleInterval);
    };
  }, []);

  const getStyledSentence = (sentence) => {
    const words = sentence.split(' ');
    return (
      <>
        <span className={styles.purple_word}>{words[0]}</span> {words.slice(1).join(' ')}
      </>
    );
  };

  return (
    <div className={styles.landing_page}>
      <video
        autoPlay
        muted
        loop
        className={`${styles.background_video} ${isBlurred ? styles.blur_effect : ''}`}
      >
        <source src={BackgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className={`${styles.text_container} ${isTextVisible ? styles.text_fade_in : ''}`}>
        <h1 className={styles.main_text}>RHYTHM</h1>
        <h1 className={styles.main_text}>{getStyledSentence(sentences[currentSentenceIndex])}</h1>
      </div>
      
      <div className={`${styles.speaker_container} ${showSpeakerBoxes ? styles.show : ''}`}>
        <div className={`${styles.speaker_box} ${styles.speaker1}`}>
          <label className={styles.speaker_label}>Try us!</label>
          <img src={Speaker1} alt="Speaker 1" className={styles.speaker_image} />
          <button className={styles.speaker_button} onClick={() => navigate('/main')}>↑</button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
