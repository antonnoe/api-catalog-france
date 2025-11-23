const DATA = [
    {
        name: "API Adresse – BAN",
        description: "Officiële adres-API van de Franse overheid.",
        url: "https://api-adresse.data.gouv.fr/search/"
    },
    {
        name: "Géorisques – Risicozones",
        description: "Overstroming, seismische zones, grondverzakking.",
        url: "https://www.georisques.gouv.fr/api"
    }
];

function render() {
    const out = document.getElementById("results");
    out.innerHTML = "";

    DATA.forEach(api => {
        const div = document.createElement("div");
        div.className = "api-item";
        div.innerHTML = `
            <h3>${api.name}</h3>
            <p>${api.description}</p>
            <a href="${api.url}" target="_blank">Open documentatie</a>
        `;
        out.appendChild(div);
    });
}

render();
