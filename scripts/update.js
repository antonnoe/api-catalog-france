import { fetchOpendata } from "./fetch-opendata.js";
import { fetchGeorisques } from "./fetch-georisques.js";
import { normalize } from "./normalize.js";

async function run() {
    let catalog = [];

    catalog = catalog.concat(await fetchOpendata());
    catalog = catalog.concat(await fetchGeorisques());

    const normalized = normalize(catalog);

    console.log(JSON.stringify(normalized, null, 2));
}

run();
