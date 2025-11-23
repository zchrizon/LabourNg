const LABOUR_TYPES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Welder",
  "Bricklayer",
  "Tiler",
  "AC Technician",
  "Mechanic",
  "Driver",
  "Cleaner",
  "Gardener",
  "Tailor",
  "Barber",
  "Hairdresser",
  "Cook",
  "Nanny",
  "Security",
  "Aluminium Fabricator",
  "POP Installer",
  "Solar Installer",
  "Water Treatment",
  "Roofing",
  "Furniture Maker",
  "Event Decorator",
  "Catering",
  "Laundry",
  "Other"
];

const DATA_URL = "https://gist.githubusercontent.com/devhammed/0bb9eeac9ff22c895100d072f489dc98/raw/nigeria-state-and-lgas.json";

const tabs = document.querySelectorAll('.tab-btn');
const sections = {
  find: document.getElementById('tab-find'),
  provide: document.getElementById('tab-provide')
};

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(sections).forEach(s => s.classList.remove('active'));
    const target = btn.dataset.tab;
    sections[target].classList.add('active');
  });
});

const searchLabour = document.getElementById('search-labour');
const searchState = document.getElementById('search-state');
const searchLga = document.getElementById('search-lga');
const searchForm = document.getElementById('search-form');
const resultsEl = document.getElementById('results');

const provLabour = document.getElementById('prov-labour');
const provState = document.getElementById('prov-state');
const provLga = document.getElementById('prov-lga');
const provForm = document.getElementById('provider-form');
const provMessage = document.getElementById('provider-message');

function populateLabour(select) {
  select.innerHTML = '<option value="">Select labour</option>' + LABOUR_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
}

function populateStates(select, states) {
  select.innerHTML = '<option value="">Select state</option>' + states.map(s => `<option value="${s.state}">${s.state}</option>`).join('');
}

function populateLgas(select, lgas, includeEmpty = true) {
  const base = includeEmpty ? '<option value="">All LGAs</option>' : '';
  select.innerHTML = base + lgas.map(l => `<option value="${l}">${l}</option>`).join('');
}

async function fetchNigeriaData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load Nigeria states/LGAs dataset');
  const json = await res.json();
  return json;
}

function getProviders() {
  const raw = localStorage.getItem('labour_providers_v1');
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveProvider(p) {
  const list = getProviders();
  list.push(p);
  localStorage.setItem('labour_providers_v1', JSON.stringify(list));
}

function renderResults(items) {
  if (!items.length) {
    resultsEl.innerHTML = '<div class="card"><p>No providers found for your selection.</p></div>';
    return;
  }
  resultsEl.innerHTML = items.map(p => `
    <div class="result-card">
      <h3>${p.name}</h3>
      <div class="result-meta">${p.labour} • ${p.state}${p.lga ? `, ${p.lga}` : ''}</div>
      ${p.desc ? `<div class="chip">${p.desc}</div>` : ''}
      <div class="result-actions">
        <a class="btn" href="tel:${p.phone}">Call</a>
        ${p.email ? `<a class="btn" href="mailto:${p.email}">Email</a>` : ''}
      </div>
    </div>
  `).join('');
}

function filterProviders({ labour, state, lga }) {
  const list = getProviders();
  return list.filter(p => {
    if (labour && p.labour !== labour) return false;
    if (state && p.state !== state) return false;
    if (lga && p.lga !== lga) return false;
    return true;
  });
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

async function init() {
  populateLabour(searchLabour);
  populateLabour(provLabour);

  const data = await fetchNigeriaData();
  populateStates(searchState, data);
  populateStates(provState, data);

  searchState.addEventListener('change', () => {
    const s = data.find(x => x.state === searchState.value);
    if (!s) { searchLga.innerHTML = ''; return; }
    populateLgas(searchLga, s.lgas, true);
  });

  provState.addEventListener('change', () => {
    const s = data.find(x => x.state === provState.value);
    if (!s) { provLga.innerHTML = ''; return; }
    populateLgas(provLga, s.lgas, false);
  });

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const items = filterProviders({
      labour: searchLabour.value,
      state: searchState.value,
      lga: searchLga.value
    });
    renderResults(items);
  });

  provForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('prov-name').value.trim();
    const phone = document.getElementById('prov-phone').value.trim();
    const email = document.getElementById('prov-email').value.trim();
    const labour = provLabour.value;
    const state = provState.value;
    const lga = provLga.value;
    const desc = document.getElementById('prov-desc').value.trim();

    if (!name || !phone || !labour || !state || !lga) {
      provMessage.textContent = 'Please fill all required fields.';
      provMessage.style.color = '#b91c1c';
      return;
    }
    if (!validatePhone(phone)) {
      provMessage.textContent = 'Enter a valid phone number.';
      provMessage.style.color = '#b91c1c';
      return;
    }

    const provider = {
      id: Date.now().toString(36),
      name, phone, email, labour, state, lga, desc,
      createdAt: new Date().toISOString()
    };
    saveProvider(provider);
    provForm.reset();
    provMessage.textContent = 'Account created. You are now discoverable.';
    provMessage.style.color = '#065f46';
  });
}

init().catch(() => {
  const blocker = document.createElement('div');
  blocker.className = 'card';
  blocker.innerHTML = '<p>Failed to load location data. Check your internet connection and reload.</p>';
  document.querySelector('.container').prepend(blocker);
});
