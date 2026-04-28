const lista = document.getElementById("pokemon-list");
const dashboard = document.getElementById("dashboard");
const search = document.getElementById("search");
const botao = document.getElementById("search-btn");
const modal = document.getElementById("modal");
const details = document.getElementById("pokemon-details");
const evolutions = document.getElementById("evolutions");
const closeBtn = document.getElementById("close");

// Filtros
const typeButtons = document.querySelectorAll(".type-btn:not(.clear-btn)");
const btnLimpar = document.getElementById("btn-limpar-filtro");
const tituloLista = document.getElementById("titulo-lista");

/* ================= VIBRAÇÃO ================= */
function vibrar(tipo) {
    if ("vibrate" in navigator) {
        if (tipo === "clique") navigator.vibrate(40);
        if (tipo === "sucesso") navigator.vibrate([100, 50, 100]);
        if (tipo === "erro") navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

/* ================= IMAGEM SEGURA (CORREÇÃO PRINCIPAL) ================= */
function getPokemonImage(data) {
    return (
        data?.sprites?.other?.["official-artwork"]?.front_default ||
        data?.sprites?.other?.home?.front_default ||
        data?.sprites?.front_default ||
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
    );
}

/* ================= INIT ================= */
async function init() {
    for (let i = 0; i < 6; i++) {
        const randomId = Math.floor(Math.random() * 800) + 1;
        carregarDashboard(randomId);
    }

    for (let i = 1; i <= 20; i++) {
        carregarPokemon(i);
    }
}
init();

/* ================= DASHBOARD ================= */
async function carregarDashboard(id) {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();

        const img = getPokemonImage(data);

        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <img src="${img}" alt="${data.name}" loading="lazy">
            <h3>${data.name}</h3>
        `;

        card.onclick = () => {
            vibrar("clique");
            mostrarDetalhes(data);
        };

        dashboard.appendChild(card);
    } catch (error) {}
}

/* ================= LISTA ================= */
async function carregarPokemon(id) {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        criarCard(data, lista);
    } catch (error) {}
}

function criarCard(pokemon, container) {
    const img = getPokemonImage(pokemon);

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
        <img src="${img}" alt="${pokemon.name}" loading="lazy">
        <h3>${pokemon.name}</h3>
    `;

    card.onclick = () => {
        vibrar("clique");
        mostrarDetalhes(pokemon);
    };

    container.appendChild(card);
}

/* ================= FILTROS ================= */
typeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        vibrar("clique");

        const tipo = btn.getAttribute("data-type");
        const emoji = btn.innerText.split(" ")[0];
        const nomeTipo = btn.innerText.split(" ")[1];

        buscarPorTipo(tipo, emoji, nomeTipo);
    });
});

btnLimpar.addEventListener("click", () => {
    vibrar("clique");
    tituloLista.innerText = "Todos os Pokémon";
    lista.innerHTML = "";

    for (let i = 1; i <= 20; i++) {
        carregarPokemon(i);
    }
});

/* ================= BUSCAR POR TIPO ================= */
async function buscarPorTipo(tipoId, emoji, nomeTipo) {
    lista.innerHTML = `<p style="color:white;text-align:center;grid-column:1/-1;">Buscando ${nomeTipo}...</p>`;
    tituloLista.innerText = `${emoji} Tipo: ${nomeTipo}`;

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${tipoId}`);
        const data = await res.json();

        lista.innerHTML = "";

        const pokemons = data.pokemon.slice(0, 20);
        const resultados = await Promise.all(
            pokemons.map(p => fetch(p.pokemon.url).then(r => r.json()))
        );

        resultados.forEach(p => criarCard(p, lista));

        vibrar("sucesso");
    } catch (error) {
        vibrar("erro");
        lista.innerHTML = `<p style="color:white;text-align:center;">Erro ao carregar.</p>`;
    }
}

/* ================= MODAL ================= */
async function mostrarDetalhes(pokemon) {
    const img = getPokemonImage(pokemon);

    const tipos = pokemon.types
        .map(t => `<span class="tipo">${t.type.name}</span>`)
        .join("");

    let descricao = "Descrição indisponível.";
    let habitat = "Desconhecido";

    try {
        const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`
        );

        if (speciesRes.ok) {
            const species = await speciesRes.json();

            const textoEn = species.flavor_text_entries.find(
                t => t.language.name === "en"
            );

            if (textoEn) {
                descricao = textoEn.flavor_text
                    .replace(/\f/g, " ")
                    .replace(/\n/g, " ");
            }

            habitat = species.habitat?.name || "Desconhecido";

            carregarEvolucoes(species.evolution_chain.url);
        }
    } catch (e) {
        evolutions.innerHTML = "<p>Sem dados de evolução</p>";
    }

    details.innerHTML = `
        <h2>${pokemon.name}</h2>
        <img src="${img}" alt="${pokemon.name}">
        <div class="tipo-container">${tipos}</div>

        <p class="descricao">${descricao}</p>

        <div class="modal-info-box">
            <p><strong>Altura:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
            <p><strong>Peso:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p>
            <p class="full-width"><strong>Habitat:</strong> ${habitat}</p>
        </div>
    `;

    modal.classList.remove("hidden");

    // 🔥 trava scroll do fundo no celular
    document.body.style.overflow = "hidden";
}

/* ================= EVOLUÇÕES ================= */
async function carregarEvolucoes(url) {
    evolutions.innerHTML = `<p style="font-size:12px;">Carregando...</p>`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        evolutions.innerHTML = "";

        let chain = data.chain;

        while (chain) {
            const nome = chain.species.name;

            const pokeRes = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${nome}`
            );
            const pokeData = await pokeRes.json();

            const img = getPokemonImage(pokeData);

            const card = document.createElement("div");
            card.classList.add("evo-card");

            card.innerHTML = `
                <img src="${img}" alt="${nome}">
                <p>${nome}</p>
            `;

            card.onclick = () => {
                vibrar("clique");
                mostrarDetalhes(pokeData);
            };

            evolutions.appendChild(card);

            chain = chain.evolves_to[0];
        }
    } catch (e) {
        evolutions.innerHTML = "<p>Erro ao carregar evolução</p>";
    }
}

/* ================= BUSCA ================= */
async function buscar() {
    const nome = search.value.toLowerCase().trim();
    if (!nome) return;

    botao.innerHTML = "⏳";

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
        if (!res.ok) throw new Error();

        const data = await res.json();

        tituloLista.innerText = "Resultado da Busca";
        lista.innerHTML = "";
        criarCard(data, lista);

        vibrar("sucesso");
    } catch {
        vibrar("erro");
        alert("Pokémon não encontrado!");
    } finally {
        botao.innerHTML = "🔎";
    }
}

botao.onclick = buscar;

search.addEventListener("keypress", e => {
    if (e.key === "Enter") buscar();
});

/* ================= FECHAR MODAL (CORRIGIDO MOBILE) ================= */
function fecharModal() {
    modal.classList.add("hidden");
    evolutions.innerHTML = "";

    // 🔥 libera scroll de volta
    document.body.style.overflow = "auto";
}

closeBtn.addEventListener("click", fecharModal);

// clicar fora fecha
modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
});

// ESC no desktop
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
});