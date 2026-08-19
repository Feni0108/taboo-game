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
  const [gamePhase, setGamePhase] = useState("start"); // "start" | "turnIntro" | "playing" | "turnResults" | "gameOver"
  const [correctCards, setCorrectCards] = useState([]);
  const [skippedCards, setSkippedCards] = useState([]);
  const [tabooCards, setTabooCards] = useState([]);
  const [stamp, setStamp] = useState(null);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [startError, setStartError] = useState("");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [introCountdown, setIntroCountdown] = useState(5);

  // ---- Timer ring calculations ----
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = timer / turnTime;
  const strokeDashoffset = circumference * (1 - progress);

  // ---- Winner / tie calculations ----
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topScore = sortedPlayers.length > 0 ? sortedPlayers[0].score : 0;
  const winners = sortedPlayers.filter((player) => player.score === topScore);
  const isTie = winners.length > 1;

  // ---- Change buttons in the rounds ----
  const isLastPlayerOfRound = currentPlayerIndex + 1 >= players.length;
  const isLastRound = currentRound >= numberOfRounds;

  let continueButtonLabel = "Következő játékos";
  if (isLastPlayerOfRound && isLastRound) {
    continueButtonLabel = "Eredmény";
  } else if (isLastPlayerOfRound) {
    continueButtonLabel = "Következő kör";
  }

  function handleStart() {
    if (players.length < 2) {
      setStartError(
        "Legalább két játékosra lesz szükség a játék megkezdéséhez!",
      );
      return;
    }
    setStartError("");

    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setDeck(shuffleCards(cards)); // shuffled ONCE for the whole game
    setCurrentIndex(0);
    setGamePhase("turnIntro");
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= deck.length) {
      // Genuinely ran out of unique cards across the whole game
      // Only reshuffle the ORIGINAL full list as a last resort
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
          setGamePhase("turnResults"); // was "roundOver"
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

  useEffect(() => {
    if (gamePhase !== "turnIntro") return;

    setIntroCountdown(5);

    const interval = setInterval(() => {
      setIntroCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          clearInterval(interval);
          // begin the actual turn
          setTimer(turnTime);
          setCorrectCards([]);
          setSkippedCards([]);
          setTabooCards([]);
          setSkipsLeft(freePasses);
          setGamePhase("playing");
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase]);

  function handleAddPlayer() {
    const trimmedName = newPlayerName.trim();

    if (trimmedName === "") return;

    const nameExists = players.some(
      (player) => player.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameExists) {
      setStartError("Ezzel a névvel már létezik játékos!");
      return;
    }

    setStartError("");
    setPlayers([...players, { name: trimmedName, score: 0 }]);
    setNewPlayerName("");
  }

  function handleRemovePlayer(indexToRemove) {
    setPlayers(players.filter((_, i) => i !== indexToRemove));
  }

  function handleContinueTurn() {
    const turnScore = correctCards.length - tabooCards.length;

    // Add this turn's score onto the current player's running total
    setPlayers((prevPlayers) =>
      prevPlayers.map((player, i) =>
        i === currentPlayerIndex
          ? { ...player, score: player.score + turnScore }
          : player,
      ),
    );

    const nextPlayerIndex = currentPlayerIndex + 1;

    if (nextPlayerIndex < players.length) {
      // Still players left in this round
      setCurrentPlayerIndex(nextPlayerIndex);
      setGamePhase("turnIntro");
    } else {
      // Everyone has played this round
      const nextRound = currentRound + 1;
      if (nextRound <= numberOfRounds) {
        setCurrentRound(nextRound);
        setCurrentPlayerIndex(0);
        setGamePhase("turnIntro");
      } else {
        // All rounds complete
        setGamePhase("gameOver");
      }
    }
  }

  function handleNewGame() {
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setCorrectCards([]);
    setSkippedCards([]);
    setTabooCards([]);
    setGamePhase("start");
  }

  return (
    <div>
      {gamePhase === "start" && (
        <div className="start-page">
          {startError && <p className="start-error">{startError}</p>}
          <div className="players-box">
            <h3>Játékosok</h3>
            <ul className="players-list">
              {players.map((player, i) => (
                <li key={i} className="player-item">
                  <span>{player.name}</span>
                  <button type="button" onClick={() => handleRemovePlayer(i)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="add-player-row">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Játékos neve"
              />
              <button type="button" onClick={handleAddPlayer}>
                Új játékos
              </button>
            </div>
          </div>
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
                <h2>Játék személyre szabása:</h2>

                <div className="setting-row">
                  <label>⏱ Időkorlát</label>
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
                  <label>🔄 Körök száma</label>
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
                  <label>➜ Ingyenes passzok száma</label>
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
                  Kész
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {gamePhase === "turnIntro" && (
        <div className="turn-intro-page">
          <h2>{currentRound}. Kör</h2>
          <h1>{players[currentPlayerIndex].name} következik</h1>
          <p>Készülj! A játék kezdődik {introCountdown}...</p>
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

      {gamePhase === "turnResults" && (
        <div className="results-box">
          <div className="written-result">
            <h1>
              {players[currentPlayerIndex].name} pontjai:{" "}
              {correctCards.length - tabooCards.length}
            </h1>
            <h3>Helyes: {correctCards.length}</h3>
            <h3>Taboo: {tabooCards.length}</h3>
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
            <button className="play-again-button" onClick={handleContinueTurn}>
              {continueButtonLabel}
            </button>
          </div>
        </div>
      )}

      {gamePhase === "gameOver" && (
        <div className="game-over-page">
          <h1>Játék vége!</h1>

          {isTie ? (
            <h2>🤝 Döntetlen: {winners.map((w) => w.name).join(" & ")}!</h2>
          ) : (
            <h2>🏆 Győztes: {winners[0].name}</h2>
          )}

          <ul className="standings-list">
            {sortedPlayers.map((player, i) => (
              <li key={i} className="standing-item">
                <span>{player.name}</span>
                <span>{player.score} pont</span>
              </li>
            ))}
          </ul>
          <button className="start-button" onClick={handleNewGame}>
            Új játék
          </button>
        </div>
      )}
    </div>
  );
}

export default Game;
