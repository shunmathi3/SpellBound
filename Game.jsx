import { useEffect, useState } from "react";
import castleImg from "./Assets/castle.png";
import forestImg from "./Assets/forest.png";
import homeImg from "./Assets/home.png";
import mountainImg from "./Assets/mountain.png";
import characterImg from "./Assets/rogues.png";
import villageImg from "./Assets/village.png";
import waterImg from "./Assets/water.png";
import "./Game.css";
import recognition from "./SpeechRecognition";

const gridImage = {
  forest: forestImg,
  water: waterImg,
  home: homeImg,
  village: villageImg,
  castle: castleImg,
  mountain: mountainImg,
};

const grid = [
  ["forest", "water", "home"],
  ["village", "castle", "mountain"],
];

const CHAR_W = 32;
const CHAR_H = 32;
const CHAR_PER_ROW = 8;

const invalidIndexes = [5, 6, 7, 13, 14, 15, 23, 30, 31, 38, 39];

const char_name = [
  "Aeloria", "Thorne", "Nyx", "Zephra", "Kael", "Isolde", "Drazhar", "Elowen",
  "Vael", "Seraphine", "Malrik", "Lyra", "Riven", "Morwyn", "Caelum", "Zarek",
  "Thalor", "Eira", "Fenric", "Sylvara", "Orin", "Nimue", "Korrin", "Virel",
  "Liora", "Garrik", "Ysara", "Bram", "Celest", "Elandor", "Vasha", "Quillon",
  "Miriel", "Draven", "Selene", "Torin", "Azura", "Kareth", "Myra", "Orrick"
];

const valid_char = Array.from({ length: 40 }, (_, index) => {
  const row = Math.floor(index / CHAR_PER_ROW);
  const col = index % CHAR_PER_ROW;
  return {
    name: char_name[index] || `Mystic ${index + 1}`,
    position: { row, col },
    index,
  };
})
  .filter((c) => !invalidIndexes.includes(c.index))
  .filter((c) => c.name !== "Nimue");

const characters = valid_char.slice(0, 28);

function Game() {
  const [command, setCommand] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [diamondLocation, setDiamondLocation] = useState(() => {
    const y = Math.floor(Math.random() * grid.length);
    const x = Math.floor(Math.random() * grid[0].length);
    return { x, y };
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.__testingHooks = {
        getCurrentPosition: () => position,
        getCurrentCommand: () => command,
        getSelectedCharacter: () => selectedCharacter,
        simulateCommand: (cmd) => {
          setCommand(cmd);
          const parsed = parseIntent(cmd);
          handleCommand(parsed);
        }
      };
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        delete window.__testingHooks;
      }
    };
  }, [position, command, selectedCharacter]);

  function parseIntent(command) {
    command = command.toLowerCase();
    if (command.includes("go to")) {
      const location = command.split("go to")[1].trim();
      return { action: "move", target: location };
    } else if (command.includes("choose character")) {
      const charName = command.split("choose character")[1].trim();
      const char = characters.find(
        (c) => c.name.toLowerCase() === charName.toLowerCase()
      );
      return { action: "chooseCharacter", target: char };
    } else {
      return { action: "unknown", target: null };
    }
  }

  const getHint = (x, y) => {
    const tileName = grid[y][x];
    const diamondTile = grid[diamondLocation.y][diamondLocation.x];
    const dynamicHints = {
      forest: {
        water: "You hear dripping... but it's not from here.",
        home: "Nothing but roots and silence.",
        village: "The trees whisper: 'Try where people live.'",
        castle: "Birds fly toward the stone towers.",
        mountain: "The treetops bow toward something high.",
      },
      water: {
        forest: "A fish says: 'Wood and stone are not alike... try the land.'",
        home: "Nothing but bubbles.",
        village: "A villager lost something shiny while swimming.",
        castle: "Reflections show a distant tower.",
        mountain: "Mountains don’t hold water… or do they?",
      },
      home: {
        forest: "You hear movement above…",
        water: "Dripping water echoes downward.",
        village: "Old carvings point east.",
        castle: "A collapsed tunnel aims toward stone halls.",
        mountain: "A tunnel climbs up toward something tall.",
      },
      village: {
        forest: "Children say the woods hide secrets.",
        water: "Fishermen speak of glowing fish.",
        home: "The well goes deep… too deep.",
        castle: "You hear tales of treasure in the throne room.",
        mountain: "Miners brag about strange finds up high.",
      },
      castle: {
        forest: "Guards say the woods are too quiet.",
        water: "A fountain bubbles with unusual energy.",
        home: "Servants lost something in the cellar.",
        village: "A messenger came from town speaking of treasure.",
        mountain: "The king mentioned a glowing light in the heights.",
      },
      mountain: {
        forest: "The trees bend toward the heights.",
        water: "Streams trickle from somewhere above.",
        home: "The caves echo with voices of the high places.",
        village: "You hear rumors from the cliffs.",
        castle: "You see the towers glint in the sun, but is that all?",
      },
    };

    return dynamicHints[tileName]?.[diamondTile] || "You sense nothing unusual...";
  };

  const handleCommand = (parsed) => {
    if (parsed.action === "move") {
      const { x, y } = findLocation(parsed.target);
      if (x !== -1) {
        setPosition({ x, y });

        if (x === diamondLocation.x && y === diamondLocation.y) {
          alert("✨ You found the Magic Diamond!");
        } else {
          const hint = getHint(x, y);
          alert(hint);
        }
      } else {
        alert("Unknown location.");
      }
    } else if (parsed.action === "chooseCharacter") {
      if (parsed.target) {
        setSelectedCharacter(parsed.target);
        alert(`🎭 You chose ${parsed.target.name}`);
      } else {
        alert("Character not found.");
      }
    }
  };

  const findLocation = (target) => {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === target.toLowerCase()) {
          return { x, y };
        }
      }
    }
    return { x: -1, y: -1 };
  };

  const startListening = () => {
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCommand(transcript);
      const parsed = parseIntent(transcript);
      handleCommand(parsed);
    };
  };

  const characterStyles = (row, col) => ({
    width: `${CHAR_W}px`,
    height: `${CHAR_H}px`,
    backgroundImage: `url(${characterImg})`,
    backgroundPosition: `-${col * CHAR_W}px -${row * CHAR_H}px`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "auto",
    imageRendering: "pixelated",
  });

  const previewCharacterStyles = (char) => ({
    width: `${CHAR_W * 2}px`,
    height: `${CHAR_H * 2}px`,
    backgroundImage: `url(${characterImg})`,
    backgroundPosition: `-${char.position.col * CHAR_W}px -${char.position.row * CHAR_H}px`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "auto",
    imageRendering: "pixelated",
  });

  if (!selectedCharacter) {
    return (
      <div className="game-container">
        <h1>🧙 Spell Bound: An Audible Quest</h1>
        <h2>Choose Your Character</h2>
        <div className="character-grid">
          {characters.map((char, index) => (
            <button
              key={index}
              onClick={() => setSelectedCharacter(char)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100px',
                height: '100px',
                margin: '5px',
                border: '2px solid #ccc',
                backgroundColor: '#f9f9f9',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: `${CHAR_W}px`,
                  height: `${CHAR_H}px`,
                  backgroundImage: `url(${characterImg})`,
                  backgroundPosition: `-${char.position.col * CHAR_W}px -${char.position.row * CHAR_H}px`,
                  backgroundSize: 'auto',
                  imageRendering: 'pixelated',
                  marginBottom: '4px',
                }}
              />
              <div
                style={{
                  fontSize: '10px',
                  textAlign: 'center',
                  color: '#333',
                  wordBreak: 'break-word',
                }}
              >
                {char.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>🧙 Spell Bound: An Audible Quest </h1>
      <button onClick={startListening}>🎤 Speak Command</button>
      <p>
        <strong>To move your character say "Go to" and the location you wish to move to.</strong> {command}
      </p>
      <p>
        <strong>Last Command:</strong> {command}
      </p>
      <p>
        <strong>Current Location:</strong> {grid[position.y][position.x]}
      </p>

      <div className="map">
        {grid.map((row, y) => (
          <div key={y} className="map-row">
            {row.map((tile, x) => (
              <div
                key={x}
                className="tile"
                style={{
                  width: "100px",
                  height: "100px",
                  background: `url(${gridImage[tile]}) no-repeat center center`,
                  backgroundSize: "cover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #333",
                  position: "relative",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    padding: "2px 4px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    position: "absolute",
                    top: "2px",
                    left: "2px",
                    textTransform: "capitalize",
                  }}
                >
                  {tile}
                </div>

                {position.x === x && position.y === y ? (
                  <div
                    style={characterStyles(
                      selectedCharacter.position.row,
                      selectedCharacter.position.col
                    )}
                    className="character"
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          const y = Math.floor(Math.random() * grid.length);
          const x = Math.floor(Math.random() * grid[0].length);
          setDiamondLocation({ x, y });
          alert("🔄 A new diamond has been hidden. Begin your search!");
        }}
      >
        🔁 Reset Diamond
      </button>
    </div>
  );
}

export default Game;
