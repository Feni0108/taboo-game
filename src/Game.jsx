import { useState, useEffect } from "react";
import cards from "./cards.js";
import { shuffleCards } from "./gameLogic.js";
import skipIcon from "./assets/skipIcon.png";
import tabooIcon from "./assets/tabooIcon.png";
import passIcon from "./assets/passIcon.png";

const TOTAL_TIME = 60;

function Game() {
  // A megkevert pakli - csak egyszer keverjük meg, amikor a komponens elindul
  const [deck, setDeck] = useState(() => shuffleCards(cards));

  // Melyik indexnél tartunk a pakliban
  const [currentIndex, setCurrentIndex] = useState(0);

  // A jelenlegi kártya, amit mutatunk
  const currentCard = deck[currentIndex];

  // Skip counter
  const [skipsLeft, setSkipsLeft] = useState(2); // starting limit

  const [timer, setTimer] = useState(TOTAL_TIME);

  // ---- Timer ring calculations ----
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = timer / TOTAL_TIME;
  const strokeDashoffset = circumference * (1 - progress);

  function handleNext() {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= deck.length) {
      // Elfogyott a pakli - keverjük újra, kezdjük elölről
      setDeck(shuffleCards(cards));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  function handleSkip() {
    if (skipsLeft <= 0) return; // no skips left, do nothing
    setSkipsLeft(skipsLeft - 1);
    handleNext(); // reuse your existing "go to next card" logic
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 0) {
          return prevTimer - 1;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-box">
      <div className="timer-box">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e4e7"
            strokeWidth="5"
            className="basic-circle"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="timer-progress-circle"
          />
        </svg>
        <span className="timer-number">{timer}</span>
      </div>
      <div className="card-box">
        <h1>{currentCard.word}</h1>
        <ul>
          {currentCard.taboo.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="button-box">
        <button className="icon-button skip-button" onClick={handleSkip}>
          <img src={skipIcon} alt="Skip" />
          <span className="badge">{skipsLeft}</span>
        </button>

        <button className="icon-button taboo-button">
          <img src={tabooIcon} alt="Taboo" className="taboo-img" />
        </button>

        <button className="icon-button pass-button" onClick={handleNext}>
          <img src={passIcon} alt="Correct" />
        </button>
      </div>
    </div>
  );
}

export default Game;
