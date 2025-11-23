// script.js
// Dynamische catalogus + categorie-filter + BAN adreszoeker

let API_DATA = [];

// ------------------------------------------------
// Laad apis.json en start de interface
// ------------------------------------------------
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

// ------------------------------------------------
// Filter-dropdown automatisch vullen
// ------------------------------------------------
function populateCategoryFilter(apis) {
    const select = document.getElementById("category-filter");
    const categories = [...new Set(apis.map(api => api.category))];

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    // Wanneer gebruiker filter verandert
    select.addEventListener("change", () => {
        const value = select.value;

        if (value === "all") {
            renderAPIList(API_DATA);
        } else {
            const filtered = API_DATA.filter(a => a.category === value);
            renderAPIList(filtered);
        }
    });
}

// ------------------------------------------------
// API-kaarten genereren
// ------------------------------------------------
function renderAPIList(apis) {
    const container = document.getElementById("api-list");
    container.innerHTML = ""; // wis huidige inhoud

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

// ------------------------------------------------
// BAN API - adreszoeker
// ------------------------------------------------
document.getElementById("ban-btn").addEventListener("click", runBANSearch);

async function runBANSearch() {
    const input = document.getElementById("ban-input").value.trim();
    const resultsContainer = document.getElementById("ban-results");

    if (!input) {
        resultsContainer.innerHTML = "<p style='color:red;'>Vul een adres of zoekterm in.</p>";
        return;
    }

    resultsContainer.innerHTML = "<p>Bezig met zoeken…</p>";

    try {
        const url = "https://api-adresse.data.gouv.fr/search/?q=" + encodeURIComponent(input);
        const response = await fetch(url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            resultsContainer.innerHTML = "<p>Geen resultaten gevonden.</p>";
            return;
        }

        // Toon resultaten
        let html = `<p><strong>Bron:</strong> BAN – Base Adresse Nationale</p>`;
        html += `<ul>`;

        data.features.forEach(item => {
            const props = item.properties;
            html += `
                <li>
                    <strong>${props.label}</strong><br>
                    Score: ${props.score}<br>
                    Longitude: ${item.geometry.coordinates[0]}, 
                    Latitude: ${item.geometry.coordinates[1]}
                </li>
            `;
        });

        html += `</ul>`;
        resultsContainer.innerHTML = html;

    } catch (err) {
        console.error(err);
        resultsContainer.innerHTML = "<p style='color:red;'>Fout bij opvragen van de BAN API.</p>";
    }
}

// ------------------------------------------------
// Start de catalogus
// ------------------------------------------------
loadAPIs();
