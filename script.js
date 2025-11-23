/* ============================================================
   API-HUB FRANKRIJK
   Centrale fetch-module voor alle API’s
   – BAN (adres)
   – Géo API (communes)
   – Géorisques (risico’s)
   ============================================================ */

/* -----------------------------
   1) Gemeente → INSEE lookup
------------------------------*/
async function fetchCommuneInfo(communeName) {
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(communeName)}&limit=5`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;

        return data[0]; // beste match
    } catch (err) {
        console.error("Fout bij commune-lookup:", err);
        return null;
    }
}

/* -----------------------------
   2) Géorisques risico’s
   op basis van INSEE-code
------------------------------*/
async function fetchRisques(inseeCode) {
    const url = `https://georisques.gouv.fr/api/v2/communes/${inseeCode}/risques`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        return data.risques || [];
    } catch (err) {
        console.error("Fout bij risico-opvragen:", err);
        return [];
    }
}

/* -----------------------------------------
   3) Gecombineerde workflow
   (input → gemeente → INSEE → risico’s)
------------------------------------------*/
async function handleRisquesLookup() {
    const input = document.getElementById("geo-input").value.trim();
    const output = document.getElementById("geo-output");

    if (!input) {
        output.innerHTML = "<p>Voer een gemeentenaam in.</p>";
        return;
    }

    output.innerHTML = "<p>Zoeken…</p>";

    // 1) Gemeente zoeken → INSEE
    const commune = await fetchCommuneInfo(input);
    if (!commune) {
        output.innerHTML = `<p>Geen gemeente gevonden voor <strong>${input}</strong>.</p>`;
        return;
    }

    const insee = commune.code;
    const name = commune.nom;

    // 2) Risico’s ophalen
    const risques = await fetchRisques(insee);

    // 3) Output opbouwen
    let html = `
        <h3>${name} (INSEE ${insee})</h3>
        <p><strong>Bron:</strong> Géorisques – API v2</p>
    `;

    if (risques.length === 0) {
        html += `<p>Geen geregistreerde risico’s voor deze gemeente.</p>`;
    } else {
        html += `<ul>`;
        for (const r of risques) {
            html += `
                <li>
                    <strong>${r.categorie || "Onbekend"}</strong><br>
                    Risico: ${r.risque || "n.v.t."}<br>
                    Code: ${r.code || "–"}
                </li>
            `;
        }
        html += `</ul>`;
    }

    output.innerHTML = html;
}

/* ------------------------------
   4) Event Listener
-------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("geo-btn");
    if (btn) btn.addEventListener("click", handleRisquesLookup);
});
