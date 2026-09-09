// ── static config ─────────────────────────────────────────────────────────────

// Maps version-group slug to its individual game versions (in display order)
const GROUP_VERSIONS = {
  'red-blue':                        ['red', 'blue'],
  'yellow':                          ['yellow'],
  'gold-silver':                     ['gold', 'silver'],
  'crystal':                         ['crystal'],
  'ruby-sapphire':                   ['ruby', 'sapphire'],
  'emerald':                         ['emerald'],
  'firered-leafgreen':               ['firered', 'leafgreen'],
  'diamond-pearl':                   ['diamond', 'pearl'],
  'platinum':                        ['platinum'],
  'heartgold-soulsilver':            ['heartgold', 'soulsilver'],
  'black-white':                     ['black', 'white'],
  'black-2-white-2':                 ['black-2', 'white-2'],
  'x-y':                             ['x', 'y'],
  'omega-ruby-alpha-sapphire':       ['omega-ruby', 'alpha-sapphire'],
  'sun-moon':                        ['sun', 'moon'],
  'ultra-sun-ultra-moon':            ['ultra-sun', 'ultra-moon'],
  'lets-go-pikachu-eevee':           ['lets-go-pikachu', 'lets-go-eevee'],
  'sword-shield':                    ['sword', 'shield'],
  'brilliant-diamond-shining-pearl': ['brilliant-diamond', 'shining-pearl'],
  'legends-arceus':                  ['legends-arceus'],
  'scarlet-violet':                  ['scarlet', 'violet'],
};

const VERSION_LABELS = {
  red:                 'Red',
  blue:                'Blue',
  yellow:              'Yellow',
  gold:                'Gold',
  silver:              'Silver',
  crystal:             'Crystal',
  ruby:                'Ruby',
  sapphire:            'Sapphire',
  emerald:             'Emerald',
  firered:             'FireRed',
  leafgreen:           'LeafGreen',
  diamond:             'Diamond',
  pearl:               'Pearl',
  platinum:            'Platinum',
  heartgold:           'HeartGold',
  soulsilver:          'SoulSilver',
  black:               'Black',
  white:               'White',
  'black-2':           'Black 2',
  'white-2':           'White 2',
  x:                   'X',
  y:                   'Y',
  'omega-ruby':        'OmegaRuby',
  'alpha-sapphire':    'AlphaSapphire',
  sun:                 'Sun',
  moon:                'Moon',
  'ultra-sun':         'UltraSun',
  'ultra-moon':        'UltraMoon',
  'lets-go-pikachu':   "Let's Go Pikachu",
  'lets-go-eevee':     "Let's Go Eevee",
  sword:               'Sword',
  shield:              'Shield',
  'brilliant-diamond': 'Brilliant Diamond',
  'shining-pearl':     'Shining Pearl',
  'legends-arceus':    'Legends: Arceus',
  scarlet:             'Scarlet',
  violet:              'Violet',
};

// Reverse lookup: individual version slug -> its version-group slug (for game-data fetches)
const VERSION_TO_GROUP = Object.fromEntries(
  Object.entries(GROUP_VERSIONS).flatMap(([group, versions]) => versions.map(v => [v, group]))
);

// Maps version-group slug to API generation slug (used for grouping + natCap lookup)
const GROUP_GENERATION = {
  'red-blue':                        'generation-i',
  'yellow':                          'generation-i',
  'gold-silver':                     'generation-ii',
  'crystal':                         'generation-ii',
  'ruby-sapphire':                   'generation-iii',
  'emerald':                         'generation-iii',
  'firered-leafgreen':               'generation-iii',
  'diamond-pearl':                   'generation-iv',
  'platinum':                        'generation-iv',
  'heartgold-soulsilver':            'generation-iv',
  'black-white':                     'generation-v',
  'black-2-white-2':                 'generation-v',
  'x-y':                             'generation-vi',
  'omega-ruby-alpha-sapphire':       'generation-vi',
  'sun-moon':                        'generation-vii',
  'ultra-sun-ultra-moon':            'generation-vii',
  'lets-go-pikachu-eevee':           'generation-vii',
  'sword-shield':                    'generation-viii',
  'brilliant-diamond-shining-pearl': 'generation-viii',
  'legends-arceus':                  'generation-viii',
  'scarlet-violet':                  'generation-ix',
};

const GEN_LABELS = {
  'generation-i':    'Generation I',
  'generation-ii':   'Generation II',
  'generation-iii':  'Generation III',
  'generation-iv':   'Generation IV',
  'generation-v':    'Generation V',
  'generation-vi':   'Generation VI',
  'generation-vii':  'Generation VII',
  'generation-viii': 'Generation VIII',
  'generation-ix':   'Generation IX',
};

// Total Pokémon in the national dex as of each generation
const NATIONAL_CAP = {
  'generation-i':    151,
  'generation-ii':   251,
  'generation-iii':  386,
  'generation-iv':   493,
  'generation-v':    649,
  'generation-vi':   721,
  'generation-vii':  809,
  'generation-viii': 905,
  'generation-ix':   1025,
};

// Pokémon per box — Gen I/II used 20-slot boxes; everything else uses 30
const BOX_CAPACITY = {
  'red-blue':    20,
  'yellow':      20,
  'gold-silver': 20,
  'crystal':     20,
};

const DEX_LABELS = {
  'kanto':             'Kanto — RBY',
  'original-johto':    'Johto — GSC',
  'updated-johto':     'Johto — HGSS',
  'hoenn':             'Hoenn — RSE',
  'updated-hoenn':     'Hoenn — ORAS',
  'original-sinnoh':   'Sinnoh — DP',
  'extended-sinnoh':   'Sinnoh — Platinum',
  'original-unova':    'Unova — BW',
  'updated-unova':     'Unova — B2W2',
  'kalos-central':     'Kalos — XY',
  'letsgo-kanto':      "Kanto — Let's Go",
  'original-alola':    'Alola — SM',
  'updated-alola':     'Alola — USUM',
  'galar':             'Galar — SwSh',
  'isle-of-armor':     'Isle of Armor — SwSh',
  'crown-tundra':      'Crown Tundra — SwSh',
  'hisui':             'Hisui — PLA',
  'paldea':            'Paldea — SV',
  'kitakami':          'Kitakami — SV',
  'blueberry':         'Blueberry Academy — SV',
};

// ── runtime state ─────────────────────────────────────────────────────────────

const dexCache    = {};
const dexNatToReg = {};
const dexSizes    = { national: 1025 };

let currentGameGroup    = 'national'; // version-group slug — drives dex/box-capacity data
let currentVersion      = 'national'; // individual version slug — drives save-data keys
let currentDexName      = null;
let currentNatCap       = 1025;
let currentBoxCapacity  = 30;
let currentBox          = 1;

// ── helpers ───────────────────────────────────────────────────────────────────

function gridCols(cap) { return cap <= 20 ? 5 : 6; }

function formatDexName(name) {
  if (!name) return 'National';
  return DEX_LABELS[name] ?? name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function getMode()      { return document.querySelector('input[name="mode"]:checked').value; }
function getBoxLayout() { return document.querySelector('input[name="layout"]:checked')?.value ?? 'regional'; }

function getMaxBox(dexMap) {
  if (getBoxLayout() === 'national' && dexMap) return Math.ceil(currentNatCap / currentBoxCapacity);
  return Math.ceil((dexSizes[currentDexName ?? 'national'] ?? 1025) / currentBoxCapacity);
}

// ── data loading ──────────────────────────────────────────────────────────────

async function loadDex(name) {
  if (!name || name === 'national') return null;
  if (dexCache[name]) return dexCache[name];

  const res = await fetch(`https://pokeapi.co/api/v2/pokedex/${name}`);
  if (!res.ok) throw new Error('Dex not found');
  const data = await res.json();

  const map = [null]; // 1-indexed: map[regionalPos] = nationalId
  const rev = {};     // nationalId -> regionalPos

  for (const entry of data.pokemon_entries) {
    const national = parseInt(entry.pokemon_species.url.split('/').filter(Boolean).pop());
    map[entry.entry_number] = national;
    rev[national] = entry.entry_number;
  }

  dexSizes[name]    = data.pokemon_entries.length;
  dexNatToReg[name] = rev;
  dexCache[name]    = map;
  return map;
}

async function resolveGame(versionSlug) {
  currentVersion = versionSlug;

  if (versionSlug === 'national') {
    currentGameGroup   = 'national';
    currentDexName     = null;
    currentNatCap      = 1025;
    currentBoxCapacity = 30;
    document.getElementById('boxCapSubtitle').textContent = 'Boxes hold 30 Pokémon each';
    return null;
  }

  const groupName = VERSION_TO_GROUP[versionSlug] ?? versionSlug;

  const res = await fetch(`https://pokeapi.co/api/v2/version-group/${groupName}`);
  if (!res.ok) throw new Error('Version group not found');
  const data = await res.json();

  const dexName = data.pokedexes[0]?.name ?? null;
  const genName = data.generation.name;

  currentGameGroup   = groupName;
  currentDexName     = dexName;
  currentNatCap      = NATIONAL_CAP[genName] ?? 1025;
  currentBoxCapacity = BOX_CAPACITY[groupName] ?? 30;
  document.getElementById('boxCapSubtitle').textContent = `Boxes hold ${currentBoxCapacity} Pokémon each`;

  return dexName ? await loadDex(dexName) : null;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

// Caught sets are keyed by individual game version and store national numbers
function getCaught() {
  return new Set(JSON.parse(localStorage.getItem(`caught_${currentVersion}`) ?? '[]'));
}
function saveCaught(set) {
  localStorage.setItem(`caught_${currentVersion}`, JSON.stringify([...set]));
}
function toggleCaughtEntry(nationalNum) {
  const s = getCaught();
  s.has(nationalNum) ? s.delete(nationalNum) : s.add(nationalNum);
  saveCaught(s);
  return s.has(nationalNum);
}
function getBoxName(box) {
  return (JSON.parse(localStorage.getItem(`boxnames_${currentVersion}`) ?? '{}'))[box] ?? '';
}
function saveBoxName(box, name) {
  const obj = JSON.parse(localStorage.getItem(`boxnames_${currentVersion}`) ?? '{}');
  name ? (obj[box] = name) : delete obj[box];
  localStorage.setItem(`boxnames_${currentVersion}`, JSON.stringify(obj));
}

// Remembers the last-used game/mode/layout/search so a reload picks up where we left off
function saveLastState() {
  localStorage.setItem('lastState', JSON.stringify({
    group:  document.getElementById('dexSelect').value,
    mode:   getMode(),
    layout: getBoxLayout(),
    input:  document.getElementById('searchInput').value,
  }));
}
function loadLastState() {
  try { return JSON.parse(localStorage.getItem('lastState')); } catch { return null; }
}

// ── legacy data migration ────────────────────────────────────────────────────
// Save data from before games were tracked individually lived under a single
// paired-group key (e.g. "caught_red-blue"). Detect those and let the user
// assign each one to one of its split versions.

function findLegacyGroups() {
  const found = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const match = /^(?:caught|boxnames)_(.+)$/.exec(localStorage.key(i));
    if (match && (GROUP_VERSIONS[match[1]] ?? []).length > 1) found.add(match[1]);
  }
  return [...found];
}

// targetVersions: one or more version slugs to copy this group's legacy data into
function migrateLegacyGroup(groupSlug, targetVersions) {
  const caughtKey = `caught_${groupSlug}`;
  const legacyCaught = localStorage.getItem(caughtKey);
  if (legacyCaught !== null) {
    const legacyIds = JSON.parse(legacyCaught);
    for (const targetVersion of targetVersions) {
      const merged = new Set(JSON.parse(localStorage.getItem(`caught_${targetVersion}`) ?? '[]'));
      for (const n of legacyIds) merged.add(n);
      localStorage.setItem(`caught_${targetVersion}`, JSON.stringify([...merged]));
    }
    localStorage.removeItem(caughtKey);
  }

  const boxKey = `boxnames_${groupSlug}`;
  const legacyBoxNames = localStorage.getItem(boxKey);
  if (legacyBoxNames !== null) {
    const legacyObj = JSON.parse(legacyBoxNames);
    for (const targetVersion of targetVersions) {
      const targetObj = JSON.parse(localStorage.getItem(`boxnames_${targetVersion}`) ?? '{}');
      const merged = { ...legacyObj, ...targetObj }; // target's own names win on conflict
      localStorage.setItem(`boxnames_${targetVersion}`, JSON.stringify(merged));
    }
    localStorage.removeItem(boxKey);
  }
}

function checkLegacyMigration() {
  const groupSlugs = findLegacyGroups();
  if (groupSlugs.length === 0) return;

  const list = document.getElementById('migrationList');
  list.innerHTML = '';

  for (const groupSlug of groupSlugs) {
    const versions = GROUP_VERSIONS[groupSlug];

    const row = document.createElement('div');
    row.className = 'migration-row';
    row.dataset.groupSlug = groupSlug;

    const label = document.createElement('span');
    label.className   = 'migration-label';
    label.textContent = versions.map(v => VERSION_LABELS[v] ?? v).join(' / ');
    row.appendChild(label);

    const options = document.createElement('div');
    options.className = 'migration-options';
    versions.forEach(v => {
      const id = `migrate_${groupSlug}_${v}`;

      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.id      = id;
      checkbox.value   = v;
      checkbox.checked = false;

      const lbl = document.createElement('label');
      lbl.htmlFor     = id;
      lbl.textContent = VERSION_LABELS[v] ?? v;

      options.append(checkbox, lbl);
    });
    row.appendChild(options);

    list.appendChild(row);
  }

  document.getElementById('migrationOverlay').classList.add('visible');
}

document.getElementById('migrationConfirm').addEventListener('click', () => {
  document.querySelectorAll('#migrationList .migration-row').forEach(row => {
    const targets = [...row.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    if (targets.length === 0) return; // nothing picked — leave it, ask again next reload
    migrateLegacyGroup(row.dataset.groupSlug, targets);
  });
  document.getElementById('migrationOverlay').classList.remove('visible');
});

document.getElementById('migrationDismiss').addEventListener('click', () => {
  document.getElementById('migrationOverlay').classList.remove('visible');
});

function regionalCaughtCount(dexName) {
  const caught = getCaught();
  if (!dexName) return caught.size;
  const inDex = new Set(Object.keys(dexNatToReg[dexName] ?? {}).map(Number));
  return [...caught].filter(n => inDex.has(n)).length;
}

function caughtStats(dexName) {
  if (getBoxLayout() === 'national' && dexName) {
    const caught = getCaught();
    return { count: [...caught].filter(n => n <= currentNatCap).length, total: currentNatCap };
  }
  return { count: regionalCaughtCount(dexName), total: dexSizes[dexName ?? 'national'] ?? 1025 };
}

// ── grid ──────────────────────────────────────────────────────────────────────

function buildGrid(dexMap, box, activeNatId, dexName, onCellClick) {
  const useNational = getBoxLayout() === 'national' && dexMap;
  const caught      = getCaught();
  const natToReg    = dexNatToReg[dexName] ?? null;

  const grid = document.createElement('div');
  grid.className = 'box-grid';
  grid.style.gridTemplateColumns = `repeat(${gridCols(currentBoxCapacity)}, 1fr)`;

  for (let i = 0; i < currentBoxCapacity; i++) {
    let dexPos, pokeId, inRegionalDex = true;

    if (useNational) {
      const natId = (box - 1) * currentBoxCapacity + i + 1;
      if (natId > currentNatCap) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'box-cell';
        grid.appendChild(emptyCell);
        continue;
      }
      pokeId        = natId;
      dexPos        = natToReg?.[natId] ?? null;
      inRegionalDex = dexPos !== null;
    } else {
      dexPos = (box - 1) * currentBoxCapacity + i + 1;
      pokeId = dexMap ? (dexMap[dexPos] ?? null) : dexPos;
    }

    const isActive = pokeId !== null && pokeId === activeNatId;
    const isCaught = pokeId !== null && caught.has(pokeId);

    const cell = document.createElement('div');
    cell.className = 'box-cell'
      + (isActive       ? ' active'      : '')
      + (isCaught       ? ' caught'      : '')
      + (!inRegionalDex ? ' unavailable' : '');

    if (pokeId) {
      const img = document.createElement('img');
      img.src     = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`;
      img.alt     = `#${pokeId}`;
      img.title   = `#${String(pokeId).padStart(4, '0')}`;
      img.onerror = () => { img.style.opacity = '0'; };
      cell.addEventListener('click', () => onCellClick(dexPos, pokeId));

      const btn = document.createElement('button');
      btn.className   = 'caught-btn';
      btn.title       = isCaught ? 'Unmark' : 'Mark as caught';
      btn.textContent = '✓';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const nowCaught = toggleCaughtEntry(pokeId);
        cell.classList.toggle('caught', nowCaught);
        btn.title = nowCaught ? 'Unmark' : 'Mark as caught';
        refreshCompletion(dexName);
      });

      cell.appendChild(img);
      cell.appendChild(btn);
    } else if (!useNational) {
      const span = document.createElement('span');
      span.className   = 'cell-num';
      span.textContent = dexPos;
      cell.appendChild(span);
    }

    grid.appendChild(cell);
  }
  return grid;
}

function refreshCompletion(dexName) {
  const el = document.getElementById('completion-display');
  if (!el) return;
  const { count, total } = caughtStats(dexName);
  el.innerHTML = `<strong>${count}</strong> / ${total} caught`;
}

function buildNavRow(box, dexName, dexMap) {
  const maxBox = getMaxBox(dexMap);

  const row = document.createElement('div');
  row.className = 'nav-row';

  const prev = document.createElement('button');
  prev.className   = 'nav-btn';
  prev.textContent = '←';
  prev.disabled    = box <= 1;
  prev.addEventListener('click', () => showBox(box - 1, dexName, dexMap));

  const label = document.createElement('span');
  label.className   = 'nav-label';
  label.textContent = `Box ${box}`;

  const next = document.createElement('button');
  next.className   = 'nav-btn';
  next.textContent = '→';
  next.disabled    = box >= maxBox;
  next.addEventListener('click', () => showBox(box + 1, dexName, dexMap));

  row.appendChild(prev);
  row.appendChild(label);
  row.appendChild(next);
  return row;
}

// ── renderers ─────────────────────────────────────────────────────────────────

function showPokemonCard(dexPos, nationalNum, data, dexName, dexMap) {
  const useNat  = getBoxLayout() === 'national' && dexMap;
  const pos4box = useNat ? nationalNum : (dexPos ?? nationalNum);
  const box     = Math.ceil(pos4box / currentBoxCapacity);
  const slot    = ((pos4box - 1) % currentBoxCapacity) + 1;
  currentBox    = box;

  const caught          = getCaught();
  const isCaught        = caught.has(nationalNum);
  const { count: caughtCount, total } = caughtStats(dexName);

  const card = document.getElementById('card');
  card.innerHTML = '';

  const sprite = document.createElement('img');
  sprite.className = 'poke-sprite';
  sprite.src = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  sprite.alt = data.name;
  card.appendChild(sprite);

  const nameRow = document.createElement('div');
  nameRow.className = 'name-row';
  const nameEl = document.createElement('span');
  nameEl.className   = 'poke-name';
  nameEl.textContent = data.name;
  nameRow.appendChild(nameEl);
  if (isCaught) {
    nameRow.appendChild(Object.assign(document.createElement('span'), { className: 'caught-badge', textContent: '✓' }));
  }
  card.appendChild(nameRow);

  const numsEl = document.createElement('div');
  numsEl.className = 'poke-numbers';
  numsEl.innerHTML = (dexMap && dexPos)
    ? `<span><div>${formatDexName(dexName)}</div><strong>#${String(dexPos).padStart(3, '0')}</strong></span>
       <span><div>National</div><strong>#${String(nationalNum).padStart(4, '0')}</strong></span>`
    : `<span><div>National</div><strong>#${String(nationalNum).padStart(4, '0')}</strong></span>`;
  card.appendChild(numsEl);

  const typesEl = document.createElement('div');
  typesEl.className = 'types';
  typesEl.innerHTML = data.types.map(t => `<span class="type-badge ${t.type.name}">${t.type.name}</span>`).join('');
  card.appendChild(typesEl);

  const caughtBtn = document.createElement('button');
  caughtBtn.className   = 'caught-toggle' + (isCaught ? ' is-caught' : '');
  caughtBtn.textContent = isCaught ? '✓ Caught' : '+ Mark as caught';
  caughtBtn.addEventListener('click', () => {
    toggleCaughtEntry(nationalNum);
    showPokemonCard(dexPos, nationalNum, data, dexName, dexMap);
  });
  card.appendChild(caughtBtn);

  const compEl = document.createElement('div');
  compEl.className = 'completion-text';
  compEl.id        = 'completion-display';
  compEl.innerHTML = `<strong>${caughtCount}</strong> / ${total} caught`;
  card.appendChild(compEl);

  card.appendChild(Object.assign(document.createElement('div'), { className: 'divider' }));

  const boxInfo = document.createElement('div');
  boxInfo.className = 'box-info';
  boxInfo.innerHTML = `<div class="box-label">Box</div>
    <div class="box-number">${box}</div>
    <div class="box-slot">Slot ${slot} of ${currentBoxCapacity}</div>`;
  card.appendChild(boxInfo);

  card.appendChild(buildNavRow(box, dexName, dexMap));
  card.appendChild(buildGrid(dexMap, box, nationalNum, dexName, (dp, nat) => navigateToPokemon(dp, nat, dexName, dexMap)));
  card.classList.add('visible');
  saveLastState();
}

function showBox(box, dexName, dexMap, { updateInput = true } = {}) {
  if (box < 1) return;
  currentBox = box;
  if (updateInput) {
    document.getElementById('modeBox').checked   = true;
    document.getElementById('searchInput').value = box;
  }

  const { count: caughtCount, total } = caughtStats(dexName);
  const start     = (box - 1) * currentBoxCapacity + 1;
  const end       = box * currentBoxCapacity;
  const savedName = getBoxName(box);

  const card = document.getElementById('card');
  card.innerHTML = '';

  const nameEl = document.createElement('div');
  nameEl.className       = 'box-name-edit';
  nameEl.contentEditable = 'true';
  nameEl.spellcheck      = false;
  nameEl.textContent     = savedName || `Box ${box}`;
  nameEl.addEventListener('blur', () => {
    const val = nameEl.textContent.trim();
    saveBoxName(box, val === `Box ${box}` ? '' : val);
  });
  nameEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });
  card.appendChild(nameEl);

  const rangeEl = document.createElement('div');
  rangeEl.className   = 'box-range';
  rangeEl.textContent = (getBoxLayout() === 'national' && dexMap)
    ? `National #${start} – #${end}`
    : `${formatDexName(dexName)} #${start} – #${end}`;
  card.appendChild(rangeEl);

  const compEl = document.createElement('div');
  compEl.className = 'completion-text';
  compEl.id        = 'completion-display';
  compEl.innerHTML = `<strong>${caughtCount}</strong> / ${total} caught`;
  card.appendChild(compEl);

  card.appendChild(Object.assign(document.createElement('div'), { className: 'divider' }));
  card.appendChild(buildNavRow(box, dexName, dexMap));
  card.appendChild(buildGrid(dexMap, box, null, dexName, (dp, nat) => navigateToPokemon(dp, nat, dexName, dexMap)));
  card.classList.add('visible');
  saveLastState();
}

async function navigateToPokemon(dexPos, nationalNum, dexName, dexMap) {
  if (!nationalNum) return;
  try {
    const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${nationalNum}`);
    const data = await res.json();
    document.getElementById('modePoke').checked  = true;
    document.getElementById('searchInput').value = dexPos ?? nationalNum;
    showPokemonCard(dexPos, nationalNum, data, dexName, dexMap);
  } catch {}
}

// ── lookup ────────────────────────────────────────────────────────────────────

async function lookup() {
  const raw     = document.getElementById('searchInput').value.trim();
  const errorEl = document.getElementById('error');
  const mode    = getMode();
  const dexName = currentDexName;

  errorEl.textContent = '';
  if (!raw) { errorEl.textContent = 'Enter a name or number.'; return; }

  let dexMap;
  try { dexMap = dexName ? await loadDex(dexName) : null; }
  catch { errorEl.textContent = 'Failed to load dex data.'; return; }

  const isNumber = /^\d+$/.test(raw);

  if (mode === 'box') {
    const box = parseInt(raw);
    if (!box || box < 1) { errorEl.textContent = 'Enter a valid box number.'; return; }
    showBox(box, dexName, dexMap);
    return;
  }

  let nationalNum, dexPos;

  if (isNumber) {
    dexPos      = parseInt(raw);
    nationalNum = dexMap ? (dexMap[dexPos] ?? null) : dexPos;
    if (!nationalNum) { errorEl.textContent = `#${dexPos} is out of range for this dex.`; return; }
  } else {
    try {
      const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${raw.toLowerCase()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      nationalNum = data.id;
      if (dexMap) {
        dexPos = dexMap.indexOf(nationalNum);
        if (dexPos === -1) {
          if (getBoxLayout() === 'national') {
            dexPos = null; // not in regional dex — show at national position
          } else {
            errorEl.textContent = `${data.name} is not in the ${VERSION_LABELS[currentVersion] ?? currentVersion} dex.`;
            return;
          }
        }
      } else {
        dexPos = nationalNum;
      }
      showPokemonCard(dexPos, nationalNum, data, dexName, dexMap);
      return;
    } catch {
      errorEl.textContent = `Could not find a Pokémon named "${raw}".`;
      return;
    }
  }

  try {
    const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${nationalNum}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    showPokemonCard(dexPos, nationalNum, data, dexName, dexMap);
  } catch {
    errorEl.textContent = `Could not find Pokémon #${nationalNum}.`;
  }
}

// ── event listeners ───────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.contentEditable === 'true') return;
  const dexMap = currentDexName ? (dexCache[currentDexName] ?? null) : null;
  if (e.key === 'ArrowLeft'  && currentBox > 1)                  showBox(currentBox - 1, currentDexName, dexMap);
  if (e.key === 'ArrowRight' && currentBox < getMaxBox(dexMap))  showBox(currentBox + 1, currentDexName, dexMap);
});

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookup();
});

document.getElementById('dexSelect').addEventListener('change', async () => {
  const versionSlug = document.getElementById('dexSelect').value;

  document.getElementById('searchInput').value = '';
  document.getElementById('card').classList.remove('visible');
  document.getElementById('error').textContent = '';
  document.getElementById('layoutReg').checked = true;
  document.getElementById('layoutToggle').style.display = versionSlug === 'national' ? 'none' : '';

  try {
    await resolveGame(versionSlug);
  } catch {
    document.getElementById('error').textContent = 'Failed to load game data.';
  }
  saveLastState();
});

document.querySelectorAll('input[name="layout"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('error').textContent = '';
    if (currentDexName) {
      const dexMap = dexCache[currentDexName] ?? null;
      showBox(currentBox || 1, currentDexName, dexMap, { updateInput: false });
    } else {
      document.getElementById('searchInput').value = '';
      document.getElementById('card').classList.remove('visible');
    }
    saveLastState();
  });
});

document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('searchInput').placeholder = r.value === 'box' ? 'Box 1' : 'Name or #001';
    document.getElementById('searchInput').value = '';
    document.getElementById('card').classList.remove('visible');
    document.getElementById('error').textContent = '';
    saveLastState();
  });
});

// ── init: populate game selector ──────────────────────────────────────────────

fetch('https://pokeapi.co/api/v2/version-group?limit=50')
  .then(r => r.json())
  .then(data => {
    const select = document.getElementById('dexSelect');
    select.innerHTML = '';

    const natOpt = document.createElement('option');
    natOpt.value       = 'national';
    natOpt.textContent = 'National Pokédex';
    natOpt.selected    = true;
    select.appendChild(natOpt);

    // Build ordered gen → [group names] map (preserving generation order)
    const genOrder = [...new Set(Object.values(GROUP_GENERATION))];
    const byGen    = new Map(genOrder.map(g => [g, []]));

    for (const group of data.results) {
      const gen = GROUP_GENERATION[group.name];
      if (!gen) continue; // skip spin-offs / unknown groups
      byGen.get(gen).push(group.name);
    }

    for (const [gen, groups] of byGen) {
      if (groups.length === 0) continue;
      const optgroup = document.createElement('optgroup');
      optgroup.label = GEN_LABELS[gen];
      for (const groupName of groups) {
        for (const versionSlug of GROUP_VERSIONS[groupName] ?? [groupName]) {
          const opt = document.createElement('option');
          opt.value       = versionSlug;
          opt.textContent = VERSION_LABELS[versionSlug] ?? versionSlug;
          optgroup.appendChild(opt);
        }
      }
      select.appendChild(optgroup);
    }

    restoreLastState();
  })
  .catch(() => {});

async function restoreLastState() {
  const state = loadLastState();
  if (!state) return;

  const select = document.getElementById('dexSelect');
  if (state.group && [...select.options].some(o => o.value === state.group)) {
    select.value = state.group;
  }
  document.getElementById('layoutToggle').style.display = select.value === 'national' ? 'none' : '';
  document.getElementById(state.layout === 'national' ? 'layoutNat' : 'layoutReg').checked = true;
  document.getElementById(state.mode === 'box' ? 'modeBox' : 'modePoke').checked = true;
  document.getElementById('searchInput').placeholder = state.mode === 'box' ? 'Box 1' : 'Name or #001';

  try {
    await resolveGame(select.value);
  } catch {
    document.getElementById('error').textContent = 'Failed to load game data.';
    return;
  }

  if (state.input) {
    document.getElementById('searchInput').value = state.input;
    lookup();
  }
}

checkLegacyMigration();
