import { useState } from "react";
import cards from "./cards.js";
import { shuffleCards } from "./gameLogic.js";

function Game() {
  // A megkevert pakli - csak egyszer keverjük meg, amikor a komponens elindul
  const [deck, setDeck] = useState(() => shuffleCards(cards));

  // Melyik indexnél tartunk a pakliban
  const [currentIndex, setCurrentIndex] = useState(0);

  // A jelenlegi kártya, amit mutatunk
  const currentCard = deck[currentIndex];

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

  return (
    <div className="main-box">
      <div className="card-box">
        <h1>{currentCard.word}</h1>
        <ul>
          {currentCard.taboo.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="button-box">
        <button onClick={handleNext}>Következő</button>
      </div>
    </div>
  );
}

export default Game;
