// script.js
// Catalogus + categorie-filter + BAN adreszoeker + Géorisques v2 (gemeentenaam → INSEE → risico's)

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
        document.getElementById("api-list").innerHTML =
            "<p style='color:red;'>Fout: apis.json kon niet worden geladen.</p>";
    }
}

/* ============================================================
   2. Categorie-filter vullen
   ============================================================ */
function populateCategoryFilter(apis) {
    const select = document.getElementById("category-filter");
    const categories = [...new Set(apis.map(a => a.category))];

    categories.forEach(cat => {
        const o = document.createElement("option");
        o.value = cat;
        o.textContent = cat;
        select.appendChild(o);
    });

    select.addEventListener("change", () => {
        const v = select.value;
        if (v === "all") renderAPIList(API_DATA);
        else renderAPIList(API_DATA.filter(a => a.category === v));
    });
}

/* ============================================================
   3. Catalogus renderen
   ============================================================ */
function renderAPIList(apis) {
    const c = document.getElementById("api-list");
    c.innerHTML = "";

    apis.forEach(api => {
        const card = document.createElement("div");
        card.className = "api-card";

        card.innerHTML = `
            <h3>${api.name}</h3>
            <p>${api.description}</p>
            <p><strong>Categorie:</strong> ${api.category}</p>
            <a class="btn" href="${api.documentation_url}" target="_blank">Open documentatie</a>
        `;

        c.appendChild(card);
    });
}

/* ============================================================
   4. BAN Adreszoeker (blijft zoals hij werkt)
   ============================================================ */
document.getElementById("ban-btn").addEventListener("click", runBANSearch);

async function runBANSearch() {
    const q = document.getElementById("ban-input").value.trim();
    const out = document.getElementById("ban-results");

    if (!q) {
        out.innerHTML = "<p style='color:red;'>Voer een zoekterm in.</p>";
        return;
    }

    out.innerHTML = "Bezig met zoeken…";

    try {
        const url = "https://api-adresse.data.gouv.fr/search/?q=" + encodeURIComponent(q);
        const r = await fetch(url);
        const d = await r.json();

        if (!d.features?.length) {
            out.innerHTML = "<p>Geen resultaten.</p>";
            return;
        }

        let html = "<p><strong>Bron:</strong> BAN (Base Adresse Nationale)</p><ul>";

        d.features.forEach(f => {
            const p = f.properties;
            const c = f.geometry.coordinates;
            html += `
                <li>
                    <strong>${p.label}</strong><br>
                    Score: ${p.score}<br>
                    Long: ${c[0]} — Lat: ${c[1]}
                </li>
            `;
        });

        html += "</ul>";
        out.innerHTML = html;

    } catch (err) {
        out.innerHTML = "<p style='color:red;'>Fout bij BAN API.</p>";
    }
}

/* ============================================================
   5. Géorisques v2 — Gemeentenaam → INSEE → risico's
   ============================================================ */
document.getElementById("geo-btn").addEventListener("click", runGeoV2);

async function runGeoV2() {
    const name = document.getElementById("geo-input").value.trim();
    const out = document.getElementById("geo-results");

    if (!name) {
        out.innerHTML = "<p style='color:red;'>Voer een gemeentenaam in.</p>";
        return;
    }

    out.innerHTML = "Gemeente zoeken…";

    try {
        /* ----------------------------------------------
           1) Zoek INSEE-code via geo.api.gouv.fr
        ---------------------------------------------- */
        const lookupUrl =
            `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(name)}&fields=nom,code&limit=1`;

        const r1 = await fetch(lookupUrl);
        const communes = await r1.json();

        if (!communes.length) {
            out.innerHTML = "<p style='color:red;'>Gemeente niet gevonden.</p>";
            return;
        }

        const insee = communes[0].code;
        const official = communes[0].nom;

        out.innerHTML = `Gemeente gevonden: <strong>${official}</strong> (INSEE ${insee})<br>Risico’s ophalen…`;

        /* ----------------------------------------------
           2) V2 Risico-API aanroepen
           Endpoint: /api/v2/communes/{INSEE}/risques
        ---------------------------------------------- */
        const riskUrl = `https://georisques.gouv.fr/api/v2/communes/${insee}/risques`;
        const r2 = await fetch(riskUrl);
        const data = await r2.json();

        if (!data.risques?.length) {
            out.innerHTML = `<p>Geen risico’s gevonden voor ${official}.</p>`;
            return;
        }

        /* ----------------------------------------------
           3) Correcte velden v2:
              - nom_risque
              - code_risque
              - categorie_risque
              - id_risque
        ---------------------------------------------- */
        let html = `
            <p><strong>Gemeente:</strong> ${official}</p>
            <p><strong>Bron:</strong> Géorisques — API v2</p>
            <ul>
        `;

        data.risques.forEach(r => {
            html += `
                <li>
                    <strong>${r.nom_risque}</strong><br>
                    Categorie: ${r.categorie_risque}<br>
                    Code: ${r.code_risque}<br>
                    ID: ${r.id_risque}
                </li>
            `;
        });

        html += "</ul>";
        out.innerHTML = html;

    } catch (err) {
        out.innerHTML = "<p style='color:red;'>Fout bij Géorisques API.</p>";
    }
}

/* ============================================================
   Starten
   ============================================================ */
loadAPIs();
