// ── interface language ────────────────────────────────────────────────────────
// The main language drives the UI text and which Pokémon name is shown first.

const STRINGS = {
  en: {
    navPokedex:       'Pokédex',
    navEv:            'EV Trainer',

    // box finder
    finderTitle:      'Pokémon Box Finder',
    boxCapacity:      'Boxes hold {n} Pokémon each',
    modePokemon:      'Pokémon',
    modeBox:          'Box #',
    layoutRegional:   'Regional boxes',
    layoutNational:   'National boxes',
    searchPlaceholder:'Name (EN/FR) or #001',
    boxPlaceholder:   'Box 1',
    go:               'Go',
    nationalDex:      'National Pokédex',
    national:         'National',
    generation:       'Generation {n}',
    box:              'Box',
    boxN:             'Box {n}',
    slotOf:           'Slot {slot} of {cap}',
    caughtCount:      '<strong>{count}</strong> / {total} caught',
    caught:           '✓ Caught',
    markCaught:       '+ Mark as caught',
    markCaughtShort:  'Mark as caught',
    unmark:           'Unmark',
    errEnterName:     'Enter a name or number.',
    errDexLoad:       'Failed to load dex data.',
    errGameLoad:      'Failed to load game data.',
    errBoxNumber:     'Enter a valid box number.',
    errOutOfRange:    '#{n} is out of range for this dex.',
    errNotInDex:      '{name} is not in the {game} dex.',
    errNoName:        'Could not find a Pokémon named "{raw}".',
    errNoNumber:      'Could not find Pokémon #{n}.',
    migrationTitle:   'Old save data found',
    migrationText:    'Games are now tracked individually. Choose where each old save goes.',
    migrate:          'Migrate',
    later:            'Later',

    // EV trainer
    evTitle:          'EV Training Tracker',
    add:              'Add',
    history:          'History',
    undoLast:         'Undo last',
    evPickPrompt:     'Add or select a Pokémon to start logging EVs.',
    loggingTo:        'Logging to ',
    pressKey:         'Press {n}',
    yieldN:           'yield {n}',
    keyN:             'key {n}',
    rosterEmpty:      'No Pokémon yet — add one above to start tracking.',
    remove:           'Remove',
    selectPrompt:     'Select a Pokémon on the left to see its details.',
    noItem:           'No Item',
    machoBrace:       'Macho Brace',
    powerItem:        'Power Item',
    evTotal:          ' / {cap} total',
    historyEmpty:     'No EVs logged yet.',
    capped:           ' (capped)',
  },
  fr: {
    navPokedex:       'Pokédex',
    navEv:            'Entraînement EV',

    finderTitle:      'Trieur de boîtes Pokémon',
    boxCapacity:      'Chaque boîte contient {n} Pokémon',
    modePokemon:      'Pokémon',
    modeBox:          'Boîte n°',
    layoutRegional:   'Boîtes régionales',
    layoutNational:   'Boîtes nationales',
    searchPlaceholder:'Nom (FR/EN) ou n°001',
    boxPlaceholder:   'Boîte 1',
    go:               'OK',
    nationalDex:      'Pokédex National',
    national:         'National',
    generation:       'Génération {n}',
    box:              'Boîte',
    boxN:             'Boîte {n}',
    slotOf:           'Emplacement {slot} sur {cap}',
    caughtCount:      '<strong>{count}</strong> / {total} capturés',
    caught:           '✓ Capturé',
    markCaught:       '+ Marquer comme capturé',
    markCaughtShort:  'Marquer comme capturé',
    unmark:           'Retirer',
    errEnterName:     'Entre un nom ou un numéro.',
    errDexLoad:       'Impossible de charger le Pokédex.',
    errGameLoad:      'Impossible de charger les données du jeu.',
    errBoxNumber:     'Entre un numéro de boîte valide.',
    errOutOfRange:    'Le n°{n} est hors de ce Pokédex.',
    errNotInDex:      "{name} n'est pas dans le Pokédex de {game}.",
    errNoName:        'Aucun Pokémon nommé « {raw} ».',
    errNoNumber:      'Pokémon n°{n} introuvable.',
    migrationTitle:   'Anciennes sauvegardes trouvées',
    migrationText:    'Les jeux sont maintenant suivis séparément. Choisis où va chaque ancienne sauvegarde.',
    migrate:          'Migrer',
    later:            'Plus tard',

    evTitle:          "Suivi d'entraînement EV",
    add:              'Ajouter',
    history:          'Historique',
    undoLast:         'Annuler',
    evPickPrompt:     'Ajoute ou sélectionne un Pokémon pour enregistrer des EV.',
    loggingTo:        'EV pour ',
    pressKey:         'Touche {n}',
    yieldN:           'gain {n}',
    keyN:             'touche {n}',
    rosterEmpty:      'Aucun Pokémon — ajoutes-en un ci-dessus pour commencer.',
    remove:           'Retirer',
    selectPrompt:     'Sélectionne un Pokémon à gauche pour voir ses détails.',
    noItem:           'Aucun objet',
    machoBrace:       'Bracelet Macho',
    powerItem:        'Objet Pouvoir',
    evTotal:          ' / {cap} au total',
    historyEmpty:     'Aucun EV enregistré.',
    capped:           ' (plafonné)',
  },
};

function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved === 'en' || saved === 'fr') return saved;
  return (navigator.language ?? '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

let LANG = detectLang();

function t(key, vars = {}) {
  const str = STRINGS[LANG][key] ?? STRINGS.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Static markup opts in with data-i18n (text) / data-i18n-placeholder / data-i18n-title (document title)
function applyStaticTranslations() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  const titleKey = document.documentElement.dataset.i18nTitle;
  if (titleKey) document.title = t(titleKey);
}

// Pages re-render their dynamic content on the 'langchange' event
function setLang(lang) {
  if (lang === LANG) return;
  LANG = lang;
  localStorage.setItem('lang', lang);
  applyStaticTranslations();
  document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.dispatchEvent(new Event('langchange'));
}

function buildLangSwitch() {
  const wrap = document.createElement('div');
  wrap.className = 'lang-switch';
  for (const lang of ['fr', 'en']) {
    const btn = document.createElement('button');
    btn.dataset.lang  = lang;
    btn.textContent   = lang.toUpperCase();
    btn.title         = lang === 'fr' ? 'Français' : 'English';
    btn.className     = lang === LANG ? 'active' : '';
    btn.addEventListener('click', () => setLang(lang));
    wrap.appendChild(btn);
  }
  document.querySelector('.navbar').appendChild(wrap);
}

buildLangSwitch();
applyStaticTranslations();
