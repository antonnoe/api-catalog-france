// script.js
// Laadt apis.json en rendert dynamisch de catalogus

async function loadAPIs() {
    try {
        const response = await fetch("/apis.json");
        const data = await response.json();
        renderAPIList(data.apis);
    } catch (err) {
        console.error("Fout bij laden apis.json:", err);
        document.getElementById("api-list").innerHTML =
            "<p style='color:red;'>Fout: apis.json kon niet worden geladen.</p>";
    }
}

function renderAPIList(apis) {
    const container = document.getElementById("api-list");
    container.innerHTML = ""; // leegmaken

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

// Start
loadAPIs();
