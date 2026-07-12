import fs from "fs"; //file system, lets you read/write files
import path from "path"; // these are for locating the file
import { fileURLToPath } from "url";
import readline from "readline"; // this is like scanner in java, wait for typed answer in the terminal
import cards from "../src/cards.js";

// this function makes sure that every word is saved in a speicific form
function capitalize(str) {
  const trimmed = str.trim(); //removes accidental leading/trailing spaces (e.g. if you accidentally hit spacebar before typing)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cardsFilePath = path.join(__dirname, "../src/cards.js");

//this creates the actual interface that reads what you type, and prints to the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

//
function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// The async keyword means "this function contains await calls inside it, and will pause at each one until that operation finishes."
async function addCards() {
  const rawWord = await ask("Fő szó: ");
  const word = capitalize(rawWord);

  // Duplikátum ellenőrzés
  // .some() is an array method — think of it like a loop that checks: "does at least one item in this array satisfy this condition?" It returns true or false.
  const exists = cards.some(
    (c) => c.word.toLowerCase().trim() === word.toLowerCase().trim(),
  );
  if (exists) {
    console.log(`❌ "${word}" már létezik a listában! Nem lett hozzáadva.`);
    rl.close();
    return;
  }

  const taboo = [];
  for (let i = 1; i <= 5; i++) {
    const t = await ask(`Tiltott szó ${i}: `);
    taboo.push(t);
  }

  const newCard = { word, taboo };
  cards.push(newCard);

  // JSON.stringify(cards, null, 2) — converts your JavaScript array into a text string formatted as JSON, with 2-space indentation so it's readable (not one giant line)
  const fileContent = `const cards = ${JSON.stringify(cards, null, 2)};\n\nexport default cards;\n`;
  fs.writeFileSync(cardsFilePath, fileContent);

  console.log(
    `✅ "${word}" hozzáadva! Összesen ${cards.length} szó van a listában.`,
  );
  rl.close();
}

addCards();
