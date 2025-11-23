// script.js
// Catalogus + categorie-filter + BAN + Géorisques (met veilige velden)

let API_DATA = [];

/* ============================================================
   1. API-Catalogus laden
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
   2. Dropdown vullen
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
   5. Géorisques — naam → INSEE → risico's (met robuuste velden)
   ============================================================ */
document.getElementById("geo-btn").addEventListener("click", runGeoFromName);

async function runGeoFromName() {
    const name = document.getElementById("geo-input").value.trim();
    const out = document.getElementById("geo-results");

    if (!name) {
        out.innerHTML = "<p style='color:red;'>Voer een gemeentenaam in.</p>";
        return;
    }

    out.innerHTML = "<p>Gemeente opzoeken…</p>";

    try {
        // 1) Lookup gemeentenaam → INSEE
        const gUrl = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(name)}&fields=nom,code&limit=1`;
        const gResponse = await fetch(gUrl);
        const gData = await gResponse.json();

        if (!gData || gData.length === 0) {
            out.innerHTML = "<p style='color:red;'>Gemeente niet gevonden.</p>";
            return;
        }

        const insee = gData[0].code;
        const officialName = gData[0].nom;

        out.innerHTML = `<p>INSEE-code gevonden: <strong>${insee}</strong> (${officialName})<br>Risico’s ophalen…</p>`;

        // 2) Géorisques opvragen
        const url = `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${insee}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            out.innerHTML = `<p>Geen risico’s gevonden voor ${officialName}.</p>`;
            return;
        }

        let html = `
            <p><strong>Gemeente:</strong> ${officialName}</p>
            <p><strong>Bron:</strong> Géorisques (BRGM)</p>
            <ul>
        `;

        data.data.forEach(r => {
            html += `
                <li>
                    <strong>${r.nom_risque || "Risico"}</strong><br>
                    Categorie: ${r.categorie || "Onbekend"}<br>
                    Code: ${r.code_risque || "n.v.t."}
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
