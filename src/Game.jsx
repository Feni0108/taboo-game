import { useState, useEffect } from "react";
import cards from "./cards.js";
import { shuffleCards } from "./gameLogic.js";
import skipIcon from "./assets/skipIcon.png";
import tabooIcon from "./assets/tabooIcon.png";
import passIcon from "./assets/passIcon.png";
import { AnimatePresence, motion } from "framer-motion";
import CardDom from "./CardDom.jsx";

function Game() {
  // A megkevert pakli - csak egyszer keverjük meg, amikor a komponens elindul
  const [deck, setDeck] = useState(() => shuffleCards(cards));

  // Melyik indexnél tartunk a pakliban
  const [currentIndex, setCurrentIndex] = useState(0);

  // A jelenlegi kártya, amit mutatunk
  const currentCard = deck[currentIndex];

  // Skip counter
  const [skipsLeft, setSkipsLeft] = useState(2); // starting limit
  const [turnTime, setTurnTime] = useState(150); // 2m 30s default
  const [numberOfRounds, setNumberOfRounds] = useState(2);
  const [freePasses, setFreePasses] = useState(5);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timer, setTimer] = useState(turnTime);
  const [gamePhase, setGamePhase] = useState("start"); // "start" | "playing" | "roundOver"
  const [correctCards, setCorrectCards] = useState([]);
  const [skippedCards, setSkippedCards] = useState([]);
  const [tabooCards, setTabooCards] = useState([]);
  const [stamp, setStamp] = useState(null);

  // ---- Timer ring calculations ----
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = timer / turnTime;
  const strokeDashoffset = circumference * (1 - progress);

  function handleStart() {
    setTimer(turnTime);
    setGamePhase("playing");
    setCorrectCards([]);
    setSkippedCards([]);
    setTabooCards([]);
    setSkipsLeft(freePasses);
    setDeck(shuffleCards(cards));
    setCurrentIndex(0);
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
    if (skipsLeft <= 0 || stamp) return; // no skips left, do nothing
    setSkipsLeft((prev) => prev - 1);
    setSkippedCards((prev) => [...prev, currentCard]);
    setStamp("skip");
  }

  function handleCorrect() {
    if (stamp) return;

    setCorrectCards((prev) => [...prev, currentCard]);
    setStamp("correct");
  }

  function handleTaboo() {
    setTabooCards((prev) => [...prev, currentCard]);
    setStamp("taboo");
  }

  function finishCardAction() {
    setStamp(null);
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

  useEffect(() => {
    if (!stamp) return;

    const timeout = setTimeout(() => {
      finishCardAction();
    }, 600);

    return () => clearTimeout(timeout);
  }, [stamp]);

  return (
    <div>
      {gamePhase === "start" && (
        <div className="start-page">
          <button
            className="settings-summary-button"
            onClick={() => setIsSettingsOpen(true)}
            type="submit"
          >
            <span>
              ⏱ {Math.floor(turnTime / 60)}m {turnTime % 60}s
            </span>
            <span>🔄 {numberOfRounds}</span>
            <span>➜ {freePasses}</span>
          </button>

          <button type="submit" className="start-button" onClick={handleStart}>
            Start
          </button>

          {isSettingsOpen && (
            <div
              className="modal-overlay"
              onClick={() => setIsSettingsOpen(false)}
            >
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close"
                  onClick={() => setIsSettingsOpen(false)}
                  type="submit"
                >
                  ✕
                </button>
                <h2>Customise your game!</h2>

                <div className="setting-row">
                  <label>⏱ Turn time limit</label>
                  <div className="stepper">
                    <button
                      onClick={() => setTurnTime(Math.max(15, turnTime - 15))}
                      type="submit"
                    >
                      −
                    </button>
                    <span>
                      {Math.floor(turnTime / 60)}m {turnTime % 60}s
                    </span>
                    <button
                      onClick={() => setTurnTime(turnTime + 15)}
                      type="submit"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="setting-row">
                  <label>🔄 Number of rounds</label>
                  <div className="stepper">
                    <button
                      onClick={() =>
                        setNumberOfRounds(Math.max(1, numberOfRounds - 1))
                      }
                      type="submit"
                    >
                      −
                    </button>
                    <span>{numberOfRounds}</span>
                    <button
                      onClick={() => setNumberOfRounds(numberOfRounds + 1)}
                      type="submit"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="setting-row">
                  <label>➜ Free passes</label>
                  <div className="stepper">
                    <button
                      onClick={() => setFreePasses(Math.max(0, freePasses - 1))}
                      type="submit"
                    >
                      −
                    </button>
                    <span>{freePasses}</span>
                    <button
                      onClick={() => setFreePasses(freePasses + 1)}
                      type="submit"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="modal-ready-button"
                  onClick={() => setIsSettingsOpen(false)}
                  type="submit"
                >
                  Ready
                </button>
              </div>
            </div>
          )}
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
          <AnimatePresence mode="wait">
            <motion.div
              className="card-box"
              key={currentIndex}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardDom card={currentCard} />

              <AnimatePresence>
                {stamp && (
                  <motion.div
                    className={`stamp stamp-${stamp}`}
                    initial={{
                      x: "-50%",
                      y: "-50%",
                      scale: 2,
                      rotate: -20,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      rotate: -10,
                      opacity: 1,
                    }}
                    exit={{
                      scale: 1.2,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.25,
                      ease: "backOut",
                    }}
                  >
                    {stamp === "correct" && "CORRECT"}
                    {stamp === "skip" && "SKIP"}
                    {stamp === "taboo" && "TABOO"}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
          <div className="button-box">
            <button
              type="submit"
              className="icon-button skip-button"
              onClick={handleSkip}
            >
              <img src={skipIcon} alt="Skip" />
              <span className="badge">{skipsLeft}</span>
            </button>

            <button
              type="submit"
              className="icon-button taboo-button"
              onClick={handleTaboo}
            >
              <img src={tabooIcon} alt="Taboo" className="taboo-img" />
            </button>

            <button
              type="submit"
              className="icon-button pass-button"
              onClick={handleCorrect}
            >
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
