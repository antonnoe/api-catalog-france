/* ============================================================
   API Catalogus Frankrijk — statisch, zonder frameworks.

   De catalogus zelf komt uit apis.json en wordt hier gerenderd. Dat gebeurde
   eerder niet: index.html beloofde "wordt automatisch geladen uit apis.json"
   en had ook een #api-list, maar er stond geen enkele regel die dat bestand
   ophaalde. De vijf API's stonden dus wel in de repo en niet op de pagina.

   Alles wat uit apis.json komt, gaat via tekstknopen of via escapeHtml naar de
   DOM — nooit via innerHTML met ruwe inhoud. Het bestand is van onszelf, maar
   een catalogus die zijn eigen data als HTML uitvoert, is een injectiegat dat
   je later niet meer terugvindt.
   ============================================================ */

const CATALOGUS_URL = 'apis.json';

/* -------------------------------------------------- gereedschap */

function escapeHtml(waarde) {
    return String(waarde ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function el(tag, klasse, tekst) {
    const knoop = document.createElement(tag);
    if (klasse) knoop.className = klasse;
    if (tekst !== undefined && tekst !== null) knoop.textContent = String(tekst);
    return knoop;
}

/** Toont een datum als dd-mm-jjjj; laat onbekend expliciet onbekend. */
function datumNl(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

/**
 * Hele dagen tot een datum. Wordt gebruikt om een aflopend abonnement te
 * markeren, met dezelfde drempel van 30 dagen die platform-monitor aanhoudt,
 * zodat de catalogus en het alarm hetzelfde zeggen.
 */
function dagenTot(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((d.getTime() - Date.now()) / 86400000);
}

function lijstOf(waarde) {
    if (Array.isArray(waarde)) return waarde;
    if (waarde === null || waarde === undefined || waarde === '') return [];
    return [waarde];
}

/* -------------------------------------------------- portalen */

function toonPortalen(portalen) {
    const doel = document.getElementById('portaal-lijst');
    if (!doel) return;
    doel.replaceChildren();

    for (const p of portalen || []) {
        const kaart = el('div', 'portaal-kaart');
        kaart.appendChild(el('h3', null, p.naam));

        const meta = el('p', 'portaal-meta');
        meta.appendChild(el('span', null, `Applicatie: ${p.applicatie || '—'}`));
        if (p.authenticatie) {
            meta.appendChild(document.createTextNode(' · '));
            meta.appendChild(
                el('span', null, `${p.authenticatie.type} in header ${p.authenticatie.header}`)
            );
        }
        kaart.appendChild(meta);

        if (p.basepathVorm) {
            const bp = el('p', 'portaal-basepath');
            bp.appendChild(el('code', null, p.basepathVorm));
            kaart.appendChild(bp);
        }

        if (p.technischeNamen) kaart.appendChild(blokMetNamen(p.technischeNamen));
        kaart.appendChild(blokMetLijst('Sleutelregels', lijstOf(p.sleutelregels)));
        kaart.appendChild(blokMetLijst('Drie klokken', lijstOf(p.drieKlokken)));
        kaart.appendChild(blokMetLijst('Valkuilen', lijstOf(p.valkuilen), 'valkuilen'));

        if (p.liveVervaldata) {
            const live = el('p', 'portaal-live');
            live.appendChild(document.createTextNode('Actuele vervaldata: '));
            const a = el('a', null, p.liveVervaldata);
            a.href = p.liveVervaldata;
            a.rel = 'noopener';
            live.appendChild(a);
            kaart.appendChild(live);
        }

        if (p.gecontroleerdOp) {
            kaart.appendChild(el('p', 'gecontroleerd', `Gecontroleerd op ${datumNl(p.gecontroleerdOp)}`));
        }

        doel.appendChild(kaart);
    }
}

/**
 * De vertaaltabel catalogusnaam → pad. Staat in een uitklapper omdat het een
 * naslagtabel is en geen leesvoer, maar hij hoort wél bij het portaal en niet
 * bij één API: je zoekt hem op wanneer je een basepath nodig hebt en nog niet
 * weet welke API je gaat gebruiken.
 */
function blokMetNamen(namen) {
    const details = el('details', 'uitklap');
    const sleutels = Object.keys(namen).filter((k) => !k.startsWith('_'));
    details.appendChild(el('summary', null, `Technische namen in de URL (${sleutels.length})`));

    if (namen._bron) details.appendChild(el('p', 'codebron', namen._bron));
    if (namen._let_op) details.appendChild(el('p', 'let-op', namen._let_op));

    const tabel = el('table', 'codetabel namentabel');
    const tbody = el('tbody');
    for (const naam of sleutels) {
        const tr = el('tr');
        tr.appendChild(el('td', 'code', naam));
        tr.appendChild(el('td', 'code', namen[naam]));
        tbody.appendChild(tr);
    }
    tabel.appendChild(tbody);
    details.appendChild(tabel);
    return details;
}

/** <details> met een puntenlijst. Dichtgeklapt, zodat de pagina leesbaar blijft. */
function blokMetLijst(titel, items, extraKlasse) {
    const details = el('details', extraKlasse ? `uitklap ${extraKlasse}` : 'uitklap');
    const summary = el('summary', null, `${titel} (${items.length})`);
    details.appendChild(summary);

    if (items.length === 0) {
        details.appendChild(el('p', 'leeg', 'Niets vastgelegd.'));
        return details;
    }

    const ul = el('ul');
    for (const item of items) ul.appendChild(el('li', null, item));
    details.appendChild(ul);
    return details;
}

/* -------------------------------------------------- tabel */

let ALLE_APIS = [];
let PORTALEN_OP_ID = new Map();

function statusVlag(status) {
    const span = el('span', `status status-${escapeHtml(status || 'onbekend')}`, status || 'onbekend');
    return span;
}

function gebruiktDoorTekst(gebruiktDoor) {
    const lijst = lijstOf(gebruiktDoor);
    if (lijst.length === 0) return null;
    return lijst.map((g) => `${g.repo}${g.route ? ` ${g.route}` : ''}`);
}

function rijVoorApi(api) {
    const tr = el('tr');
    tr.dataset.categorie = api.categorie || '';
    tr.dataset.status = api.status || '';

    // Kolom 1: naam plus aanbieder.
    const naamCel = el('td', 'cel-naam');
    naamCel.appendChild(el('strong', null, api.naam));
    naamCel.appendChild(el('div', 'aanbieder', api.aanbieder || ''));
    tr.appendChild(naamCel);

    // Status plus de nuance eronder. "werkt" op zichzelf kan misleiden: de
    // SIRENE-route bestaat aantoonbaar (401, geen 404) maar levert zonder
    // aangevraagde sleutel nog niets bruikbaars op. Dat verschil hoort in de
    // tabel te staan en niet alleen in een uitklapper.
    const statusCel = el('td', 'cel-status');
    statusCel.appendChild(statusVlag(api.status));
    if (api.statusToelichting) {
        statusCel.appendChild(el('div', 'status-toelichting', api.statusToelichting));
    }
    tr.appendChild(statusCel);

    // Authenticatie: alleen de vorm, nooit een sleutel.
    tr.appendChild(el('td', 'cel-auth', api.authenticatie || 'geen'));
    tr.appendChild(el('td', null, api.limiet || '—'));

    // Abonnementseinde, met markering wanneer het binnen 30 dagen afloopt.
    const eindeCel = el('td', 'cel-einde');
    const dagen = dagenTot(api.abonnementseinde);
    eindeCel.textContent = datumNl(api.abonnementseinde);
    if (dagen !== null && dagen <= 30) {
        eindeCel.classList.add(dagen < 0 ? 'verlopen' : 'bijna-op');
        eindeCel.appendChild(
            el('span', 'einde-notitie', dagen < 0 ? ' verlopen' : ` nog ${dagen} dagen`)
        );
    }
    tr.appendChild(eindeCel);

    // Gebruikt door: repo plus route, zodat zichtbaar is wat er stukgaat.
    const gebruikCel = el('td', 'cel-gebruik');
    const gebruikers = gebruiktDoorTekst(api.gebruiktDoor);
    if (!gebruikers) {
        gebruikCel.appendChild(el('span', 'ongebruikt', 'nog nergens'));
    } else {
        for (const g of gebruikers) gebruikCel.appendChild(el('div', null, g));
    }
    tr.appendChild(gebruikCel);

    tr.appendChild(el('td', 'cel-datum', datumNl(api.gecontroleerdOp)));

    return tr;
}

function detailRijVoorApi(api) {
    const tr = el('tr', 'detailrij');
    tr.dataset.categorie = api.categorie || '';
    tr.dataset.status = api.status || '';

    const td = el('td');
    td.colSpan = 7;

    if (api.beschrijving) td.appendChild(el('p', 'beschrijving', api.beschrijving));

    if (api.basepath) {
        const bp = el('p', 'basepath');
        bp.appendChild(document.createTextNode('Basepath: '));
        bp.appendChild(el('code', null, api.basepath));
        td.appendChild(bp);
    } else {
        td.appendChild(el('p', 'basepath leeg', 'Basepath: niet vastgesteld.'));
    }

    const endpoints = lijstOf(api.endpoints).map(
        (e) => `${e.pad} — ${e.levert}`
    );
    td.appendChild(blokMetLijst('Endpoints', endpoints));

    // Valkuilen: het hele punt van deze catalogus, dus als eerste na de basis.
    td.appendChild(blokMetLijst('Valkuilen', lijstOf(api.valkuilen), 'valkuilen'));

    if (api.sleutelregels) {
        td.appendChild(blokMetLijst('Sleutelregels', lijstOf(api.sleutelregels)));
    }

    if (api.codetabellen) td.appendChild(blokMetCodetabellen(api.codetabellen));

    const bronnen = lijstOf(api.bronnen);
    if (bronnen.length) {
        const details = el('details', 'uitklap');
        details.appendChild(el('summary', null, `Bronnen (${bronnen.length})`));
        const ul = el('ul');
        for (const url of bronnen) {
            const li = el('li');
            const a = el('a', null, url);
            a.href = url;
            a.rel = 'noopener';
            li.appendChild(a);
            ul.appendChild(li);
        }
        details.appendChild(ul);
        td.appendChild(details);
    }

    if (api.portaal) {
        const p = PORTALEN_OP_ID.get(api.portaal);
        td.appendChild(
            el('p', 'portaal-verwijzing', `Sleutelregels via portaal: ${p ? p.naam : api.portaal}`)
        );
    }

    tr.appendChild(td);
    return tr;
}

function blokMetCodetabellen(tabellen) {
    const details = el('details', 'uitklap');
    const namen = Object.keys(tabellen).filter((k) => k !== '_bron');
    details.appendChild(el('summary', null, `Codetabellen (${namen.length})`));

    // De bronvermelding staat bovenaan en niet onderaan: een codetabel zonder
    // bron is een aanname, en dat onderscheid moet je zien vóór je de waarden
    // overneemt.
    if (tabellen._bron) details.appendChild(el('p', 'codebron', tabellen._bron));

    for (const naam of namen) {
        details.appendChild(el('h4', null, naam));
        const tabel = el('table', 'codetabel');
        const tbody = el('tbody');
        for (const [code, betekenis] of Object.entries(tabellen[naam])) {
            const tr = el('tr');
            tr.appendChild(el('td', 'code', code));
            tr.appendChild(el('td', null, betekenis));
            tbody.appendChild(tr);
        }
        tabel.appendChild(tbody);
        details.appendChild(tabel);
    }

    return details;
}

function tekenTabel(apis) {
    const body = document.getElementById('api-tabel-body');
    if (!body) return;
    body.replaceChildren();
    for (const api of apis) {
        body.appendChild(rijVoorApi(api));
        body.appendChild(detailRijVoorApi(api));
    }
}

/* -------------------------------------------------- filters */

function vulCategorieFilter(apis) {
    const select = document.getElementById('category-filter');
    if (!select) return;
    const categorieen = [...new Set(apis.map((a) => a.categorie).filter(Boolean))].sort();
    for (const c of categorieen) {
        const optie = el('option', null, c);
        optie.value = c;
        select.appendChild(optie);
    }
}

function pasFilterToe() {
    const categorie = document.getElementById('category-filter')?.value || 'all';
    const status = document.getElementById('status-filter')?.value || 'all';
    // Alleen de directe kinderen van tbody: een codetabel binnen een detailrij
    // bevat ook <tr>'s, en die hebben geen categorie of status. Zonder de > zou
    // een actief filter elke codetabel wegfilteren, ook die van rijen die juist
    // wél getoond worden.
    const rijen = document.querySelectorAll('#api-tabel-body > tr');

    let zichtbaar = 0;
    for (const rij of rijen) {
        const past =
            (categorie === 'all' || rij.dataset.categorie === categorie) &&
            (status === 'all' || rij.dataset.status === status);
        rij.hidden = !past;
        if (past && !rij.classList.contains('detailrij')) zichtbaar += 1;
    }

    const leeg = document.getElementById('tabel-leeg');
    if (leeg) leeg.hidden = zichtbaar > 0;
}

/* -------------------------------------------------- opstarten */

async function laadCatalogus() {
    const body = document.getElementById('api-tabel-body');
    try {
        const res = await fetch(CATALOGUS_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        PORTALEN_OP_ID = new Map((data.portalen || []).map((p) => [p.id, p]));
        ALLE_APIS = data.apis || [];

        toonPortalen(data.portalen);
        vulCategorieFilter(ALLE_APIS);
        tekenTabel(ALLE_APIS);
        pasFilterToe();
    } catch (e) {
        // Zeggen dát het misging en waarom. Een lege tabel zonder melding leest
        // als "er zijn geen API's", wat iets heel anders is dan "het bestand kon
        // niet geladen worden".
        console.error('apis.json laden mislukt:', e);
        if (body) {
            const tr = el('tr');
            const td = el('td', 'laadfout', `apis.json kon niet geladen worden (${e.message}).`);
            td.colSpan = 7;
            tr.appendChild(td);
            body.replaceChildren(tr);
        }
    }
}

document.getElementById('category-filter')?.addEventListener('change', pasFilterToe);
document.getElementById('status-filter')?.addEventListener('change', pasFilterToe);

laadCatalogus();

/* ============================================================
   Live proeven. Twee keyloze API's die je zonder voorbereiding
   kunt uitproberen; alles met een sleutel hoort hier niet.
   ============================================================ */

document.getElementById('ban-btn')?.addEventListener('click', async () => {
    const query = document.getElementById('ban-input').value.trim();
    const uit = document.getElementById('ban-results');

    if (!query) {
        uit.textContent = 'Voer een adres of plaatsnaam in.';
        return;
    }
    uit.textContent = 'Zoeken…';

    try {
        const res = await fetch(
            `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.features || data.features.length === 0) {
            // Een lege FeatureCollection is een geldig antwoord, geen storing.
            uit.textContent = 'Geen resultaten gevonden (de dienst antwoordde wel).';
            return;
        }

        uit.replaceChildren();
        for (const f of data.features) {
            const p = el('p');
            p.appendChild(el('strong', null, f.properties.label));
            p.appendChild(document.createElement('br'));
            p.appendChild(el('span', 'coord', f.geometry.coordinates.join(', ')));
            uit.appendChild(p);
        }
    } catch (e) {
        uit.textContent = `Fout bij opvragen: ${e.message}`;
        console.error(e);
    }
});

document.getElementById('geo-btn')?.addEventListener('click', async () => {
    const invoer = document.getElementById('geo-input').value.trim();
    const uit = document.getElementById('geo-results');

    if (!invoer) {
        uit.textContent = 'Voer een gemeentenaam in.';
        return;
    }
    uit.textContent = 'Zoeken…';

    try {
        const gemeenteRes = await fetch(
            `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(invoer)}&limit=1`
        );
        if (!gemeenteRes.ok) throw new Error(`gemeente-opzoeking: HTTP ${gemeenteRes.status}`);
        const gemeenten = await gemeenteRes.json();
        if (!gemeenten.length) {
            uit.textContent = `Geen gemeente gevonden voor: ${invoer}`;
            return;
        }
        const gemeente = gemeenten[0];

        const risicoRes = await fetch(
            `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${encodeURIComponent(gemeente.code)}`
        );
        if (!risicoRes.ok) throw new Error(`Géorisques: HTTP ${risicoRes.status}`);
        const risicoData = await risicoRes.json();
        const risicos = risicoData.data || risicoData.risques || [];

        uit.replaceChildren();
        uit.appendChild(el('h4', null, `${gemeente.nom} (INSEE ${gemeente.code})`));

        if (risicos.length === 0) {
            uit.appendChild(
                el('p', null, 'Geen geregistreerde risico’s. Dat is naslag achteraf, geen uitspraak over de situatie van vandaag.')
            );
            return;
        }

        const ul = el('ul');
        for (const r of risicos) {
            ul.appendChild(el('li', null, r.libelle_risque_long || r.risque || r.categorie || 'onbenoemd risico'));
        }
        uit.appendChild(ul);
    } catch (e) {
        uit.textContent = `Fout bij opvragen: ${e.message}`;
        console.error(e);
    }
});
