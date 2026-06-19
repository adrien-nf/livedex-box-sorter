// ── static config ─────────────────────────────────────────────────────────────

const VERSION_GROUP_LABELS = {
  'red-blue':                        'Red / Blue',
  'yellow':                          'Yellow',
  'gold-silver':                     'Gold / Silver',
  'crystal':                         'Crystal',
  'ruby-sapphire':                   'Ruby / Sapphire',
  'emerald':                         'Emerald',
  'firered-leafgreen':               'FireRed / LeafGreen',
  'diamond-pearl':                   'Diamond / Pearl',
  'platinum':                        'Platinum',
  'heartgold-soulsilver':            'HeartGold / SoulSilver',
  'black-white':                     'Black / White',
  'black-2-white-2':                 'Black 2 / White 2',
  'x-y':                             'X / Y',
  'omega-ruby-alpha-sapphire':       'OmegaRuby / AlphaSapphire',
  'sun-moon':                        'Sun / Moon',
  'ultra-sun-ultra-moon':            'Ultra Sun / Ultra Moon',
  'lets-go-pikachu-eevee':           "Let's Go Pikachu / Eevee",
  'sword-shield':                    'Sword / Shield',
  'brilliant-diamond-shining-pearl': 'Brilliant Diamond / Shining Pearl',
  'legends-arceus':                  'Legends: Arceus',
  'scarlet-violet':                  'Scarlet / Violet',
};

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

let currentGameGroup = 'national';
let currentDexName   = null;
let currentNatCap    = 1025;
let currentBox       = 1;

// ── helpers ───────────────────────────────────────────────────────────────────

function formatGroupName(name) {
  return VERSION_GROUP_LABELS[name] ?? name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function formatDexName(name) {
  if (!name) return 'National';
  return DEX_LABELS[name] ?? name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function getMode()      { return document.querySelector('input[name="mode"]:checked').value; }
function getBoxLayout() { return document.querySelector('input[name="layout"]:checked')?.value ?? 'regional'; }

function getMaxBox(dexMap) {
  if (getBoxLayout() === 'national' && dexMap) return Math.ceil(currentNatCap / 30);
  return Math.ceil((dexSizes[currentDexName ?? 'national'] ?? 1025) / 30);
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

async function resolveGame(groupName) {
  if (groupName === 'national') {
    currentGameGroup = 'national';
    currentDexName   = null;
    currentNatCap    = 1025;
    return null;
  }

  const res = await fetch(`https://pokeapi.co/api/v2/version-group/${groupName}`);
  if (!res.ok) throw new Error('Version group not found');
  const data = await res.json();

  const dexName = data.pokedexes[0]?.name ?? null;
  const genName = data.generation.name;

  currentGameGroup = groupName;
  currentDexName   = dexName;
  currentNatCap    = NATIONAL_CAP[genName] ?? 1025;

  return dexName ? await loadDex(dexName) : null;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

// Caught sets are keyed by game group and store national numbers
function getCaught() {
  return new Set(JSON.parse(localStorage.getItem(`caught_${currentGameGroup}`) ?? '[]'));
}
function saveCaught(set) {
  localStorage.setItem(`caught_${currentGameGroup}`, JSON.stringify([...set]));
}
function toggleCaughtEntry(nationalNum) {
  const s = getCaught();
  s.has(nationalNum) ? s.delete(nationalNum) : s.add(nationalNum);
  saveCaught(s);
  return s.has(nationalNum);
}
function getBoxName(box) {
  return (JSON.parse(localStorage.getItem(`boxnames_${currentGameGroup}`) ?? '{}'))[box] ?? '';
}
function saveBoxName(box, name) {
  const obj = JSON.parse(localStorage.getItem(`boxnames_${currentGameGroup}`) ?? '{}');
  name ? (obj[box] = name) : delete obj[box];
  localStorage.setItem(`boxnames_${currentGameGroup}`, JSON.stringify(obj));
}

function regionalCaughtCount(dexName) {
  const caught = getCaught();
  if (!dexName) return caught.size;
  const inDex = new Set(Object.keys(dexNatToReg[dexName] ?? {}).map(Number));
  return [...caught].filter(n => inDex.has(n)).length;
}

// ── grid ──────────────────────────────────────────────────────────────────────

function buildGrid(dexMap, box, activeNatId, dexName, onCellClick) {
  const useNational = getBoxLayout() === 'national' && dexMap;
  const caught      = getCaught();
  const natToReg    = dexNatToReg[dexName] ?? null;

  const grid = document.createElement('div');
  grid.className = 'box-grid';

  for (let i = 0; i < 30; i++) {
    let dexPos, pokeId, inRegionalDex = true;

    if (useNational) {
      const natId = (box - 1) * 30 + i + 1;
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
      dexPos = (box - 1) * 30 + i + 1;
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
  const count = regionalCaughtCount(dexName);
  const total = dexSizes[dexName ?? 'national'] ?? 1025;
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
  const box     = Math.ceil(pos4box / 30);
  const slot    = ((pos4box - 1) % 30) + 1;
  currentBox    = box;

  const caught   = getCaught();
  const isCaught = caught.has(nationalNum);
  const total    = dexSizes[dexName ?? 'national'] ?? 1025;

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
  compEl.innerHTML = `<strong>${regionalCaughtCount(dexName)}</strong> / ${total} caught`;
  card.appendChild(compEl);

  card.appendChild(Object.assign(document.createElement('div'), { className: 'divider' }));

  const boxInfo = document.createElement('div');
  boxInfo.className = 'box-info';
  boxInfo.innerHTML = `<div class="box-label">Box</div>
    <div class="box-number">${box}</div>
    <div class="box-slot">Slot ${slot} of 30</div>`;
  card.appendChild(boxInfo);

  card.appendChild(buildNavRow(box, dexName, dexMap));
  card.appendChild(buildGrid(dexMap, box, nationalNum, dexName, (dp, nat) => navigateToPokemon(dp, nat, dexName, dexMap)));
  card.classList.add('visible');
}

function showBox(box, dexName, dexMap) {
  if (box < 1) return;
  currentBox = box;
  document.getElementById('modeBox').checked   = true;
  document.getElementById('searchInput').value = box;

  const total     = dexSizes[dexName ?? 'national'] ?? 1025;
  const start     = (box - 1) * 30 + 1;
  const end       = box * 30;
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
  compEl.innerHTML = `<strong>${regionalCaughtCount(dexName)}</strong> / ${total} caught`;
  card.appendChild(compEl);

  card.appendChild(Object.assign(document.createElement('div'), { className: 'divider' }));
  card.appendChild(buildNavRow(box, dexName, dexMap));
  card.appendChild(buildGrid(dexMap, box, null, dexName, (dp, nat) => navigateToPokemon(dp, nat, dexName, dexMap)));
  card.classList.add('visible');
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
            errorEl.textContent = `${data.name} is not in the ${formatGroupName(currentGameGroup)} dex.`;
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
  const groupName = document.getElementById('dexSelect').value;

  document.getElementById('searchInput').value = '';
  document.getElementById('card').classList.remove('visible');
  document.getElementById('error').textContent = '';
  document.getElementById('layoutReg').checked = true;
  document.getElementById('layoutToggle').style.display = groupName === 'national' ? 'none' : '';

  try {
    await resolveGame(groupName);
  } catch {
    document.getElementById('error').textContent = 'Failed to load game data.';
  }
});

document.querySelectorAll('input[name="layout"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('error').textContent = '';
    if (currentDexName) {
      const dexMap = dexCache[currentDexName] ?? null;
      showBox(currentBox || 1, currentDexName, dexMap);
    } else {
      document.getElementById('searchInput').value = '';
      document.getElementById('card').classList.remove('visible');
    }
  });
});

document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('searchInput').placeholder = r.value === 'box' ? 'Box 1' : 'Name or #001';
    document.getElementById('searchInput').value = '';
    document.getElementById('card').classList.remove('visible');
    document.getElementById('error').textContent = '';
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
      for (const name of groups) {
        const opt = document.createElement('option');
        opt.value       = name;
        opt.textContent = formatGroupName(name);
        optgroup.appendChild(opt);
      }
      select.appendChild(optgroup);
    }
  })
  .catch(() => {});
