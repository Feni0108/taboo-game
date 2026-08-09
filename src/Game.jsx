import { useState, useEffect } from "react";
import cards from "./cards.js";
import { shuffleCards } from "./gameLogic.js";
import skipIcon from "./assets/skipIcon.png";
import tabooIcon from "./assets/tabooIcon.png";
import passIcon from "./assets/passIcon.png";

function Game() {
  // A megkevert pakli - csak egyszer keverjük meg, amikor a komponens elindul
  const [deck, setDeck] = useState(() => shuffleCards(cards));

  // Melyik indexnél tartunk a pakliban
  const [currentIndex, setCurrentIndex] = useState(0);

  // A jelenlegi kártya, amit mutatunk
  const currentCard = deck[currentIndex];

  // Skip counter
  const [skipsLeft, setSkipsLeft] = useState(2); // starting limit

  const [totalTime, setTotalTime] = useState(60);

  const [timer, setTimer] = useState(totalTime);

  const [gamePhase, setGamePhase] = useState("start"); // "start" | "playing" | "roundOver"

  const [correctCards, setCorrectCards] = useState([]);

  const [skippedCards, setSkippedCards] = useState([]);

  const [tabooCards, setTabooCards] = useState([]);

  // ---- Timer ring calculations ----
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = timer / totalTime;
  const strokeDashoffset = circumference * (1 - progress);

  function handleStart() {
    setTimer(totalTime);
    setGamePhase("playing");
  }

  function handleNewStart() {
    setGamePhase("start");
  }

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
    setSkippedCards([...skippedCards, currentCard]);
    handleNext(); // reuse your existing "go to next card" logic
  }

  function handleCorrect() {
    setCorrectCards([...correctCards, currentCard]);
    handleNext();
  }

  function handleTaboo() {
    setTabooCards([...tabooCards, currentCard]);
    handleNext();
  }

  // Start timer
  useEffect(() => {
    if (gamePhase !== "playing") return; // don't tick unless we're actually playing

    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 0) {
          return prevTimer - 1;
        } else {
          clearInterval(interval);
          setGamePhase("roundOver"); // ← trigger the transition here
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase]);

  function CardDom({ card, className, icon }) {
    return (
      <div className={className}>
        <h1>{card.word}</h1>
        <ul>
          {card.taboo.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        {icon && <img src={icon} alt="" className="result-icon-overlay" />}
      </div>
    );
  }

  return (
    <div>
      {gamePhase === "start" && (
        <div className="start-page">
          <select
            className="time-select"
            value={totalTime}
            onChange={(e) => setTotalTime(Number(e.target.value))}
          >
            <option value={30}>⌛ 30 seconds</option>
            <option value={60}>⌛ 60 seconds</option>
            <option value={90}>⌛ 90 seconds</option>
            <option value={120}>⌛ 120 seconds</option>
            <option value={150}>⌛ 150 seconds</option>
            <option value={180}>⌛ 180 seconds</option>
          </select>

          <button className="start-button" onClick={handleStart}>
            Start
          </button>
        </div>
      )}

      {gamePhase === "playing" && (
        <div className="main-box">
          <div className="timer-box">
            <svg viewBox="0 0 120 120">
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
            <CardDom card={currentCard} className="card-box" />
          </div>
          <div className="button-box">
            <button className="icon-button skip-button" onClick={handleSkip}>
              <img src={skipIcon} alt="Skip" />
              <span className="badge">{skipsLeft}</span>
            </button>

            <button className="icon-button taboo-button" onClick={handleTaboo}>
              <img src={tabooIcon} alt="Taboo" className="taboo-img" />
            </button>

            <button className="icon-button pass-button" onClick={handleCorrect}>
              <img src={passIcon} alt="Correct" />
            </button>
          </div>
        </div>
      )}

      {gamePhase === "roundOver" && (
        <div className="results-box">
          <div className="written-result">
            <h1>Your Score: {correctCards.length - tabooCards.length}</h1>
            <h3>Correct answers: {correctCards.length}</h3>
            <h3>Mistakes: {tabooCards.length}</h3>
          </div>
          <ul className="results-list">
            {correctCards.map((card, i) => (
              <CardDom
                key={`correct-${i}`}
                card={card}
                className="result-card"
                icon={passIcon}
              />
            ))}
            {skippedCards.map((card, i) => (
              <CardDom
                key={`skip-${i}`}
                card={card}
                className="result-card"
                icon={skipIcon}
              />
            ))}
            {tabooCards.map((card, i) => (
              <CardDom
                key={`taboo-${i}`}
                card={card}
                className="result-card"
                icon={tabooIcon}
              />
            ))}
          </ul>
          <div className="play-again-button-box">
            <button className="play-again-button" onClick={handleNewStart}>
              Play again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
