/* ===== Réglages ===== */
const COLS = 6;               // colonnes de la grille invisible
const ROWS = 5;               // lignes de la grille invisible
const GOAL = 20;              // numéro du dernier switch (victoire)
const MAX_DECOYS = 2;         // nombre max de leurres affichés en même temps
const DECOY_CHANCE = 0.7;     // probabilité qu'une étape contienne des leurres
const DECOY_DELAY = [500, 2500]; // délai d'apparition d'un leurre (ms)

/* ===== Éléments & état ===== */
const grid = document.getElementById("grid");
const message = document.getElementById("message");
grid.style.setProperty("--cols", COLS);
grid.style.setProperty("--rows", ROWS);

// Vrais switchs : { number, wrapper, checkbox, cell, ghost }
// ghost = déjà enclenché mais réaffiché "décoché" (piège : ne pas y toucher)
let switches = [];
let decoys = [];       // leurres : { wrapper, checkbox, cell }
let decoyTimers = [];  // timers d'apparition des leurres

/* ===== Grille ===== */
function randomFreeCell() {
    const used = new Set([...switches, ...decoys].map(s => s.cell));
    const free = [];
    for (let i = 0; i < COLS * ROWS; i++) {
        if (!used.has(i)) free.push(i);
    }
    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
}

// Aucun nom n'est affiché : tous les switchs se ressemblent
function buildSwitch(cell) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("switch-wrapper");
    wrapper.style.gridColumn = (cell % COLS) + 1;
    wrapper.style.gridRow = Math.floor(cell / COLS) + 1;

    const label = document.createElement("label");
    label.classList.add("switch");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const slider = document.createElement("span");
    slider.classList.add("slider");

    label.appendChild(checkbox);
    label.appendChild(slider);
    wrapper.appendChild(label);
    grid.appendChild(wrapper);

    return { wrapper, checkbox };
}

/* ===== Vrais switchs ===== */
function createSwitch(number) {
    const cell = randomFreeCell();
    if (cell === null) return;

    const { wrapper, checkbox } = buildSwitch(cell);
    const entry = { number, wrapper, checkbox, cell, ghost: false };
    switches.push(entry);

    checkbox.addEventListener("change", function () {

        // Switch réaffiché "décoché" mais déjà enclenché : erreur !
        if (entry.ghost) {
            wrapper.classList.add("wrong");
            setTimeout(() => {
                wrapper.classList.remove("wrong");
                checkbox.checked = false;
                stepBack();
            }, 450);
            return;
        }

        clearDecoys();

        if (this.checked) {
            // Masquer le switch précédent
            const previous = switches.find(s => s.number === number - 1);
            if (previous) previous.wrapper.style.display = "none";

            // Réafficher le switch n-4 : il revient DÉCOCHÉ alors qu'il est déjà fait
            if (number >= 5) {
                const old = switches.find(s => s.number === number - 4);
                if (old) {
                    old.ghost = true;
                    old.checkbox.checked = false;
                    old.wrapper.style.display = "flex";
                }
            }

            if (number >= GOAL) {
                showMessage("metre bouton de fin");
                return;
            }

            createSwitch(number + 1);
            spawnDecoys(number + 1);

        } else {
            // On supprime tout ce qui venait après
            switches
                .filter(s => s.number > number)
                .forEach(s => s.wrapper.remove());
            switches = switches.filter(s => s.number <= number);

            wrapper.style.display = "flex";
            hideMessage();
            spawnDecoys(number);
        }
    });
}

/* ===== Leurres (feintes) ===== */
// Un leurre est un faux switch identique aux autres, qui apparaît après
// un petit délai. Si on l'enclenche, on recule d'une étape.
function spawnDecoys(target) {
    clearDecoys();
    if (target <= 1 || Math.random() > DECOY_CHANCE) return;

    const count = 1 + Math.floor(Math.random() * MAX_DECOYS);
    for (let i = 0; i < count; i++) {
        const delay = DECOY_DELAY[0] + Math.random() * (DECOY_DELAY[1] - DECOY_DELAY[0]);
        decoyTimers.push(setTimeout(addDecoy, delay));
    }
}

function addDecoy() {
    if (decoys.length >= MAX_DECOYS) return;
    const cell = randomFreeCell();
    if (cell === null) return;

    const { wrapper, checkbox } = buildSwitch(cell);
    decoys.push({ wrapper, checkbox, cell });

    checkbox.addEventListener("change", function () {
        wrapper.classList.add("wrong");
        setTimeout(stepBack, 450);
    });
}

function clearDecoys() {
    decoyTimers.forEach(clearTimeout);
    decoyTimers = [];
    decoys.forEach(d => d.wrapper.remove());
    decoys = [];
}

// Pénalité : le dernier switch réellement enclenché est désactivé
function stepBack() {
    clearDecoys();
    const done = switches.filter(s => s.ghost || s.checkbox.checked);
    const last = done[done.length - 1];
    if (last && !last.ghost) {
        last.checkbox.checked = false;
        last.checkbox.dispatchEvent(new Event("change"));
    }
}

/* ===== Message ===== */
function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
}
function hideMessage() {
    message.hidden = true;
}

/* ===== Démarrage : le switch de base est le Switch 1 ===== */
createSwitch(1);