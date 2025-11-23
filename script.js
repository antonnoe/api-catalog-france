/* ============================================================
   BASIS API-HUB SCRIPT — MATCHT EXACT JOUW HTML IDs
   ============================================================ */

/* --------------------------
   1) BAN Adreszoeker
---------------------------*/
document.getElementById("ban-btn").addEventListener("click", async () => {
    const query = document.getElementById("ban-input").value.trim();
    const out = document.getElementById("ban-results");

    if (!query) {
        out.innerHTML = "<p>Voer een adres of plaatsnaam in.</p>";
        return;
    }

    out.innerHTML = "<p>Zoeken…</p>";

    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.features || data.features.length === 0) {
            out.innerHTML = "<p>Geen resultaten gevonden.</p>";
            return;
        }

        out.innerHTML = data.features
            .map(f => `<p><strong>${f.properties.label}</strong><br>Lat/Lon: ${f.geometry.coordinates}</p>`)
            .join("");

    } catch (e) {
        out.innerHTML = "<p>Fout bij opvragen.</p>";
        console.error(e);
    }
});

/* -----------------------------------------
   2) Commune lookup → Géorisques risico’s
------------------------------------------*/
async function fetchCommuneInfo(name) {
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(name)}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.length) return null;
    return data[0]; // beste match
}

async function fetchRisques(insee) {
    const url = `https://georisques.gouv.fr/api/v2/communes/${insee}/risques`;
    const res = await fetch(url);
    const data = await res.json();
    return data.risques || [];
}

document.getElementById("geo-btn").addEventListener("click", async () => {
    const input = document.getElementById("geo-input").value.trim();
    const out = document.getElementById("geo-results");

    if (!input) {
        out.innerHTML = "<p>Voer een gemeentenaam in.</p>";
        return;
    }

    out.innerHTML = "<p>Zoeken…</p>";

    const commune = await fetchCommuneInfo(input);
    if (!commune) {
        out.innerHTML = `<p>Geen gemeente gevonden voor: ${input}</p>`;
        return;
    }

    const risques = await fetchRisques(commune.code);

    let html = `<h3>${commune.nom} (INSEE ${commune.code})</h3>`;

    if (risques.length === 0) {
        html += "<p>Geen risico’s beschikbaar.</p>";
    } else {
        html += "<ul>";
        risques.forEach(r => {
            html += `
                <li>
                    <strong>${r.categorie || "Onbekend"}</strong><br>
                    ${r.risque || "Geen titel"}<br>
                    Code: ${r.code || "–"}
                </li>`;
        });
        html += "</ul>";
    }

    out.innerHTML = html;
});
