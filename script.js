// script.js
// Dynamische catalogus + categorie-filter

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

    // Wanneer de gebruiker van categorie wisselt → filteren
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
// Start de catalogus
// ------------------------------------------------
loadAPIs();
