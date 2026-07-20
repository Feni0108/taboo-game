export function shuffleCards(cards) {
  const shuffled = [...cards];
  for (let i = cards.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i inclusive
    let j = Math.floor(Math.random() * (i + 1));

    // Swap cards[i] with the element
    // at random index
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return shuffled;
}
