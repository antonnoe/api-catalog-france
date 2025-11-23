// script.js
// Catalogus + categorie-filter + BAN + Géorisques

let API_DATA = [];

/* ============================================================
   1. API-Catalogus laden uit apis.json
   ============================================================ */
async function loadAPIs() {
    try {
        const response = await fetch("/apis.json");
        const data = await response.json();

        API_DATA = data.apis;
        populateCategoryFilter(API_DATA);
        renderAPIList(API_DATA);

    } catch (err) {
        console.error("Fout bij laden apis.json:", err);
        document.getElementById("api-list").innerHTML =
            "<p style='color:red;'>Fout: apis.json kon niet worden geladen.</p>";
    }
}

/* ============================================================
   2. Dropdown-vulling
   ============================================================ */
function populateCategoryFilter(apis) {
    const select = document.getElementById("category-filter");
    const categories = [...new Set(apis.map(api => api.category))];

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        const value = select.value;
        if (value === "all") renderAPIList(API_DATA);
        else renderAPIList(API_DATA.filter(a => a.category === value));
    });
}

/* ============================================================
   3. API-kaarten renderen
   ============================================================ */
function renderAPIList(apis) {
    const container = document.getElementById("api-list");
    container.innerHTML = "";

    apis.forEach(api => {
        const card = document.createElement("div");
        card.className = "api-card";

        card.innerHTML = `
            <h3>${api.name}</h3>
            <p>${api.description}</p>
            <p><strong>Categorie:</strong> ${api.category}</p>
            <a class="btn" href="${api.documentation_url}" target="_blank">Open documentatie</a>
        `;

        container.appendChild(card);
    });
}

/* ============================================================
   4. BAN Adreszoeker
   ============================================================ */
document.getElementById("ban-btn").addEventListener("click", runBANSearch);

async function runBANSearch() {
    const q = document.getElementById("ban-input").value.trim();
    const out = document.getElementById("ban-results");

    if (!q) {
        out.innerHTML = "<p style='color:red;'>Voer een zoekterm in.</p>";
        return;
    }

    out.innerHTML = "<p>Bezig met zoeken…</p>";

    try {
        const url = "https://api-adresse.data.gouv.fr/search/?q=" + encodeURIComponent(q);
        const response = await fetch(url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            out.innerHTML = "<p>Geen resultaten.</p>";
            return;
        }

        let html = `<p><strong>Bron:</strong> Base Adresse Nationale</p><ul>`;

        data.features.forEach(item => {
            const p = item.properties;
            const coords = item.geometry.coordinates;

            html += `
                <li>
                    <strong>${p.label}</strong><br>
                    Score: ${p.score}<br>
                    Long: ${coords[0]} — Lat: ${coords[1]}
                </li>
            `;
        });

        html += `</ul>`;
        out.innerHTML = html;

    } catch (err) {
        console.error(err);
        out.innerHTML = "<p style='color:red;'>Fout bij BAN API.</p>";
    }
}

/* ============================================================
   5. Géorisques — risico's per gemeente (INSEE-code)
   ============================================================ */
document.getElementById("geo-btn").addEventListener("click", runGeoSearch);

async function runGeoSearch() {
    const code = document.getElementById("geo-input").value.trim();
    const out = document.getElementById("geo-results");

    if (!code.match(/^[0-9]{5}$/)) {
        out.innerHTML = "<p style='color:red;'>Voer een geldige INSEE-code in (5 cijfers).</p>";
        return;
    }

    out.innerHTML = "<p>Risico’s ophalen…</p>";

    try {
        const url = `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${code}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            out.innerHTML = "<p>Geen risico’s gevonden.</p>";
            return;
        }

        let html = `<p><strong>Bron:</strong> Géorisques (BRGM)</p><ul>`;

        data.data.forEach(r => {
            html += `
                <li>
                    <strong>${r.nom_court}</strong><br>
                    ${r.risque}
                </li>
            `;
        });

        html += `</ul>`;
        out.innerHTML = html;

    } catch (err) {
        console.error(err);
        out.innerHTML = "<p style='color:red;'>Fout bij het ophalen van risico’s.</p>";
    }
}

/* ============================================================
   Start
   ============================================================ */
loadAPIs();
