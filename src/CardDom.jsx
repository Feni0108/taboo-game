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

export default CardDom;
