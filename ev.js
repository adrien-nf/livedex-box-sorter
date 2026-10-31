// ── config ────────────────────────────────────────────────────────────────────

const STATS = [
  { key: 'hp',        label: 'HP',      powerItem: 'Power Weight' },
  { key: 'attack',    label: 'Attack',  powerItem: 'Power Bracer' },
  { key: 'defense',   label: 'Defense', powerItem: 'Power Belt' },
  { key: 'spAttack',  label: 'Sp. Atk', powerItem: 'Power Lens' },
  { key: 'spDefense', label: 'Sp. Def', powerItem: 'Power Band' },
  { key: 'speed',     label: 'Speed',   powerItem: 'Power Anklet' },
];

const STAT_CAP  = 252;
const TOTAL_CAP = 510;
const STORAGE_KEY = 'evTrainerState_v1';

function evTier(value) {
  if (value > STAT_CAP) return 'tier-over';
  if (value === STAT_CAP) return 'tier-max';
  if (value >= 231) return 'tier-red';
  if (value >= 210) return 'tier-orange';
  return '';
}

// ── state ─────────────────────────────────────────────────────────────────────

let pokemons     = [];
let history       = [];
let activeCardId  = null;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw) {
      pokemons      = raw.pokemons ?? [];
      // Older saves stored the API slug ("bulbasaur") — upgrade base species to bilingual names
      pokemons.forEach(p => { if (p.dexNum <= 1025) p.name = bilingualName(p.dexNum) ?? p.name; });
      history       = raw.history ?? [];
      activeCardId  = raw.activeCardId ?? (pokemons[0]?.id ?? null);
    }
  } catch {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ pokemons, history, activeCardId }));
}

// ── EV math ───────────────────────────────────────────────────────────────────
// gain = (baseYield + powerItemBonus) * pokerusMultiplier * machoBraceMultiplier
// Power item and Macho Brace occupy the same held-item slot, so they're mutually exclusive.

function computeGain(poke, baseYield) {
  const statKey     = poke.activeStat;
  const powerBonus  = (poke.item === 'power' && poke.powerStat === statKey) ? 4 : 0;
  let gain = baseYield + powerBonus;
  if (poke.pokerus)        gain *= 2;
  if (poke.item === 'macho') gain *= 2;
  return gain;
}

function applyEvGain(poke, baseYield) {
  const statKey   = poke.activeStat;
  const requested = computeGain(poke, baseYield);

  const total    = Object.values(poke.evs).reduce((a, b) => a + b, 0);
  const statRoom = STAT_CAP - poke.evs[statKey];
  const totalRoom = TOTAL_CAP - total;
  const actualGain = Math.max(0, Math.min(requested, statRoom, totalRoom));

  poke.evs[statKey] += actualGain;

  history.unshift({
    time:         Date.now(),
    pokemonId:    poke.id,
    pokemonName:  poke.name,
    stat:         statKey,
    baseYield,
    gain:         actualGain,
    requested,
    newValue:     poke.evs[statKey],
  });
  if (history.length > 300) history.length = 300;

  saveState();
  render();
}

function undoLast() {
  const last = history.shift();
  if (!last) return;
  const poke = pokemons.find(p => p.id === last.pokemonId);
  if (poke) poke.evs[last.stat] = Math.max(0, poke.evs[last.stat] - last.gain);
  saveState();
  render();
}

// ── mutations ─────────────────────────────────────────────────────────────────

async function addPokemon() {
  const input   = document.getElementById('addInput');
  const errorEl = document.getElementById('addError');
  const raw     = input.value.trim();
  errorEl.textContent = '';
  if (!raw) { errorEl.textContent = 'Enter a name or number.'; return; }

  try {
    const query = /^\d+$/.test(raw) ? raw : (findPokemonByName(raw) ?? raw.toLowerCase().replace(/\s+/g, '-'));
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    const poke = {
      id:         `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      dexNum:     data.id,
      // Alternate forms (ids above 10000) keep the API name so the form stays visible
      name:       data.id <= 1025 ? (bilingualName(data.id) ?? data.name) : data.name,
      sprite:     data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
      item:       'none',   // 'none' | 'macho' | 'power'
      powerStat:  'hp',
      pokerus:    false,
      activeStat: 'hp',
      evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    };

    pokemons.push(poke);
    activeCardId = poke.id;
    input.value = '';
    saveState();
    render();
  } catch {
    errorEl.textContent = `Could not find a Pokémon named "${raw}".`;
  }
}

function removePokemon(id) {
  pokemons = pokemons.filter(p => p.id !== id);
  if (activeCardId === id) activeCardId = pokemons[0]?.id ?? null;
  saveState();
  render();
}

function setActiveCard(id) {
  activeCardId = id;
  saveState();
  render();
}

// ── rendering ─────────────────────────────────────────────────────────────────

function render() {
  renderYieldPanel();
  renderRoster();
  renderActiveCard();
  renderHistory();
}

function renderYieldPanel() {
  const panel = document.getElementById('yieldPanel');
  panel.innerHTML = '';
  const poke = pokemons.find(p => p.id === activeCardId);

  if (!poke) {
    const msg = document.createElement('div');
    msg.className = 'yield-target';
    msg.textContent = 'Add or select a Pokémon to start logging EVs.';
    panel.appendChild(msg);
    return;
  }

  const statDef = STATS.find(s => s.key === poke.activeStat);

  const target = document.createElement('div');
  target.className = 'yield-target';
  const nameStrong = document.createElement('strong');
  nameStrong.textContent = poke.name;
  const statStrong = document.createElement('strong');
  statStrong.textContent = statDef.label;
  target.append('Logging to ', nameStrong, ' — ', statStrong);
  panel.appendChild(target);

  const btnRow = document.createElement('div');
  btnRow.className = 'yield-buttons';
  [1, 2, 3].forEach(y => {
    const gain = computeGain(poke, y);
    const btn = document.createElement('button');
    btn.className = 'yield-btn';
    btn.title = `Press ${y}`;

    const base = document.createElement('span');
    base.className = 'base';
    base.textContent = `yield ${y}`;
    const gainEl = document.createElement('span');
    gainEl.className = 'gain';
    gainEl.textContent = `+${gain}`;
    const keyHint = document.createElement('span');
    keyHint.className = 'key-hint';
    keyHint.textContent = `key ${y}`;

    btn.append(base, gainEl, keyHint);
    btn.addEventListener('click', e => { e.stopPropagation(); applyEvGain(poke, y); });
    btnRow.appendChild(btn);
  });
  panel.appendChild(btnRow);
}

function renderRoster() {
  const roster = document.getElementById('pokemonRoster');
  roster.innerHTML = '';

  if (pokemons.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'No Pokémon yet — add one above to start tracking.';
    roster.appendChild(empty);
    return;
  }

  pokemons.forEach(poke => roster.appendChild(buildMiniCard(poke)));
}

function buildMiniCard(poke) {
  const total = Object.values(poke.evs).reduce((a, b) => a + b, 0);

  const card = document.createElement('div');
  card.className = 'ev-mini-card' + (poke.id === activeCardId ? ' mini-active' : '');
  card.addEventListener('click', () => setActiveCard(poke.id));

  const img = document.createElement('img');
  img.src = poke.sprite;
  img.alt = poke.name;

  const name = document.createElement('span');
  name.className = 'ev-mini-name';
  name.textContent = poke.name;

  const totalEl = document.createElement('span');
  totalEl.className = 'ev-mini-total';
  totalEl.textContent = `${total}/${TOTAL_CAP}`;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'ev-remove-btn ev-mini-remove';
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', e => { e.stopPropagation(); removePokemon(poke.id); });

  card.append(img, name, totalEl, removeBtn);
  return card;
}

function renderActiveCard() {
  const container = document.getElementById('activeCard');
  container.innerHTML = '';

  const poke = pokemons.find(p => p.id === activeCardId);
  if (!poke) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'Select a Pokémon on the left to see its details.';
    container.appendChild(empty);
    return;
  }

  container.appendChild(buildCard(poke));
}

function buildCard(poke) {
  const card = document.createElement('div');
  card.className = 'ev-card card-active';

  // header
  const header = document.createElement('div');
  header.className = 'ev-card-header';

  const img = document.createElement('img');
  img.src = poke.sprite;
  img.alt = poke.name;

  const nameEl = document.createElement('span');
  nameEl.className = 'ev-card-name';
  nameEl.textContent = poke.name;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'ev-remove-btn';
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', e => { e.stopPropagation(); removePokemon(poke.id); });

  header.append(img, nameEl, removeBtn);
  card.appendChild(header);

  // item toggle row
  const itemRow = document.createElement('div');
  itemRow.className = 'toggle-row';
  itemRow.addEventListener('click', e => e.stopPropagation());
  [['none', 'No Item'], ['macho', 'Macho Brace'], ['power', 'Power Item']].forEach(([val, label]) => {
    const id = `item_${poke.id}_${val}`;
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `item_${poke.id}`;
    radio.id = id;
    radio.checked = poke.item === val;
    radio.addEventListener('change', () => { poke.item = val; saveState(); render(); });

    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.textContent = label;

    itemRow.append(radio, lbl);
  });
  card.appendChild(itemRow);

  // power item stat picker
  if (poke.item === 'power') {
    const select = document.createElement('select');
    select.addEventListener('click', e => e.stopPropagation());
    STATS.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.key;
      opt.textContent = `${s.powerItem} (${s.label})`;
      opt.selected = poke.powerStat === s.key;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => { poke.powerStat = select.value; saveState(); render(); });
    card.appendChild(select);
  }

  // Pokérus
  const pokerusRow = document.createElement('label');
  pokerusRow.className = 'ev-pokerus-row';
  pokerusRow.addEventListener('click', e => e.stopPropagation());
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = poke.pokerus;
  cb.addEventListener('change', () => { poke.pokerus = cb.checked; saveState(); render(); });
  pokerusRow.append(cb, document.createTextNode(' Pokérus'));
  card.appendChild(pokerusRow);

  // stats
  const statsWrap = document.createElement('div');
  statsWrap.className = 'ev-stats';
  STATS.forEach(s => {
    const row = document.createElement('div');
    row.className = 'ev-stat-row' + (poke.activeStat === s.key ? ' stat-active' : '');
    row.addEventListener('click', e => {
      e.stopPropagation();
      poke.activeStat = s.key;
      if (poke.item === 'power') poke.powerStat = s.key;
      setActiveCard(poke.id);
    });

    const label = document.createElement('span');
    label.className = 'ev-stat-label';
    label.textContent = s.label;

    const tier = evTier(poke.evs[s.key]);

    const bar = document.createElement('div');
    bar.className = 'ev-stat-bar';
    const fill = document.createElement('div');
    fill.className = 'ev-stat-fill' + (tier ? ` ${tier}` : '');
    fill.style.width = `${Math.min(100, (poke.evs[s.key] / STAT_CAP) * 100)}%`;
    bar.appendChild(fill);

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'ev-stat-input' + (tier ? ` ${tier}` : '');
    input.min = 0;
    input.max = STAT_CAP;
    input.value = poke.evs[s.key];
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('change', () => {
      const v = Math.max(0, Math.min(STAT_CAP, parseInt(input.value) || 0));
      poke.evs[s.key] = v;
      saveState();
      render();
    });

    row.append(label, bar, input);
    statsWrap.appendChild(row);
  });
  card.appendChild(statsWrap);

  const total = Object.values(poke.evs).reduce((a, b) => a + b, 0);
  const totalEl = document.createElement('div');
  totalEl.className = 'ev-total' + (total >= TOTAL_CAP ? ' maxed' : '');
  const totalStrong = document.createElement('strong');
  totalStrong.textContent = total;
  totalEl.append(totalStrong, ` / ${TOTAL_CAP} total`);
  card.appendChild(totalEl);

  return card;
}

function renderHistory() {
  const log = document.getElementById('historyLog');
  const undoBtn = document.getElementById('undoBtn');
  undoBtn.disabled = history.length === 0;

  log.innerHTML = '';
  if (history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'No EVs logged yet.';
    log.appendChild(empty);
    return;
  }

  history.forEach(h => {
    const row = document.createElement('div');
    row.className = 'history-entry';

    const time = document.createElement('span');
    time.className = 'h-time';
    time.textContent = new Date(h.time).toLocaleTimeString([], { hour12: false });

    const statLabel = STATS.find(s => s.key === h.stat)?.label ?? h.stat;
    const capped = h.gain !== h.requested ? ' (capped)' : '';

    const desc = document.createElement('span');
    desc.textContent = `${h.pokemonName} +${h.gain} ${statLabel}${capped} → ${h.newValue}`;

    row.append(time, desc);
    log.appendChild(row);
  });
}

// ── clock ─────────────────────────────────────────────────────────────────────

function tickClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour12: false });
  document.getElementById('clockDate').textContent = now.toLocaleDateString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
tickClock();
setInterval(tickClock, 1000);

// ── event listeners ───────────────────────────────────────────────────────────

document.getElementById('addBtn').addEventListener('click', addPokemon);
document.getElementById('addInput').addEventListener('keydown', e => { if (e.key === 'Enter') addPokemon(); });
document.getElementById('undoBtn').addEventListener('click', undoLast);

document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || document.activeElement.isContentEditable) return;
  if (!['1', '2', '3'].includes(e.key)) return;

  const poke = pokemons.find(p => p.id === activeCardId);
  if (!poke) return;

  e.preventDefault();
  applyEvGain(poke, parseInt(e.key));
});

// ── init ──────────────────────────────────────────────────────────────────────

attachNameSuggestions(document.getElementById('addInput'));
loadState();
render();
