/**
 * buscador.js
 * Funcionalidades: autocomplete, filtros dinâmicos, cards de resultado.
 * Depende de: ongs.json (mesma pasta), DOM do buscador.html
 */
(function () {
    'use strict';

    // ── ESTADO ───────────────────────────────────────────────────────────────
    let ongsDatabase = [];
    let filtrosAtivos = { tags: new Set(), estados: new Set() };
    let termoBusca = '';
    let autocompleteIdx = -1;

    // ── SELETORES ────────────────────────────────────────────────────────────
    const input          = document.getElementById('busca-input');
    const autocompleteEl = document.getElementById('autocomplete-list');
    const filtroBtnEl    = document.getElementById('filtro-btn');
    const painelFiltros  = document.getElementById('painel-filtros');
    const filtrosTagsEl  = document.getElementById('filtros-tags');
    const filtrosEstEl   = document.getElementById('filtros-estados');
    const limparBtnEl    = document.getElementById('limpar-filtros');
    const buscaBtnEl     = document.getElementById('busca-btn');
    const cardsEl        = document.getElementById('cards-container');
    const resultsHeader  = document.getElementById('resultados-header');
    const contagemEl     = document.getElementById('contagem');
    const filtrosAtivosEl = document.getElementById('filtros-ativos');

    // ── UTILS ────────────────────────────────────────────────────────────────
    function normalizar(str) {
        return (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function extrairEstado(endereco) {
        // ex: "São Paulo, SP" → "SP"
        const m = (endereco || '').match(/,\s*([A-Z]{2})$/);
        return m ? m[1] : endereco;
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<mark>$1</mark>');
    }

    // ── CARGA DE DADOS ───────────────────────────────────────────────────────
    async function loadData() {
        try {
            const r = await fetch('./ongs.json');
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const data = await r.json();
            if (!Array.isArray(data) || !data.length) throw new Error('Dados vazios');
            ongsDatabase = data;
            onDataLoaded();
        } catch (e) {
            cardsEl.innerHTML = `
                <div class="estado-erro">
                    <span class="material-symbols-outlined">error</span>
                    <h3>Erro ao carregar dados</h3>
                    <p>Não foi possível buscar o banco de ONGs.<br>Verifique se o arquivo <code>ongs.json</code> está na mesma pasta.</p>
                </div>`;
            console.error('[buscador] Erro ao carregar ongs.json:', e);
        }
    }

    function onDataLoaded() {
        construirFiltros();
        renderCards(ongsDatabase); // mostra todas por padrão
    }

    // ── FILTROS DINÂMICOS ─────────────────────────────────────────────────────
    function construirFiltros() {
        const tagsSet    = new Set();
        const estadosSet = new Set();

        ongsDatabase.forEach(ong => {
            (ong.tags || []).forEach(t => tagsSet.add(t));
            const est = extrairEstado(ong.endereco);
            if (est) estadosSet.add(est);
        });

        filtrosTagsEl.innerHTML = '';
        tagsSet.forEach(tag => {
            filtrosTagsEl.appendChild(criarChipFiltro(tag, 'tags'));
        });

        filtrosEstEl.innerHTML = '';
        estadosSet.forEach(est => {
            filtrosEstEl.appendChild(criarChipFiltro(est, 'estados'));
        });
    }

    function criarChipFiltro(valor, tipo) {
        const btn = document.createElement('button');
        btn.className = 'chip-filtro';
        btn.textContent = valor;
        btn.dataset.valor = valor;
        btn.dataset.tipo  = tipo;
        btn.addEventListener('click', () => toggleFiltro(valor, tipo, btn));
        return btn;
    }

    function toggleFiltro(valor, tipo, el) {
        const set = filtrosAtivos[tipo];
        if (set.has(valor)) {
            set.delete(valor);
            el.classList.remove('ativo');
        } else {
            set.add(valor);
            el.classList.add('ativo');
        }
        atualizarChipsAtivos();
        executarBusca();
    }

    function atualizarChipsAtivos() {
        filtrosAtivosEl.innerHTML = '';
        let temFiltro = false;

        ['tags', 'estados'].forEach(tipo => {
            filtrosAtivos[tipo].forEach(valor => {
                temFiltro = true;
                const chip = document.createElement('button');
                chip.className = 'chip-ativo';
                chip.innerHTML = `${valor} <span class="material-symbols-outlined">close</span>`;
                chip.addEventListener('click', () => {
                    filtrosAtivos[tipo].delete(valor);
                    // Desmarca chip no painel
                    const painelChip = painelFiltros.querySelector(`[data-valor="${valor}"][data-tipo="${tipo}"]`);
                    if (painelChip) painelChip.classList.remove('ativo');
                    atualizarChipsAtivos();
                    executarBusca();
                });
                filtrosAtivosEl.appendChild(chip);
            });
        });

        filtrosAtivosEl.hidden = !temFiltro;
    }

    function limparFiltros() {
        filtrosAtivos.tags.clear();
        filtrosAtivos.estados.clear();
        document.querySelectorAll('.chip-filtro.ativo').forEach(c => c.classList.remove('ativo'));
        atualizarChipsAtivos();
        executarBusca();
    }

    // ── AUTOCOMPLETE ─────────────────────────────────────────────────────────
    function mostrarAutocomplete(query) {
        const q = normalizar(query);
        if (!q || q.length < 1) {
            fecharAutocomplete();
            return;
        }

        const resultados = ongsDatabase.filter(ong => {
            const campos = [
                ong.titulo,
                ong.endereco,
                ...(ong.tags || [])
            ].map(normalizar).join(' ');
            return campos.includes(q);
        }).slice(0, 6);

        if (!resultados.length) {
            fecharAutocomplete();
            return;
        }

        autocompleteEl.innerHTML = '';
        autocompleteIdx = -1;

        resultados.forEach((ong, i) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-idx', i);
            item.innerHTML = `
                <img class="autocomplete-thumb"
                     src="${ong.imagemUrl}"
                     alt="${ong.titulo}"
                     onerror="this.src='https://picsum.photos/id/13/80/80'">
                <div class="autocomplete-info">
                    <div class="autocomplete-nome">${highlightMatch(ong.titulo, query)}</div>
                    <div class="autocomplete-meta">
                        ${extrairEstado(ong.endereco)} · ${(ong.tags || []).slice(0, 2).join(', ')}
                    </div>
                </div>`;

            item.addEventListener('mousedown', e => {
                e.preventDefault();
                input.value = ong.titulo;
                termoBusca  = ong.titulo;
                fecharAutocomplete();
                executarBusca();
            });

            autocompleteEl.appendChild(item);
        });

        autocompleteEl.hidden = false;
    }

    function fecharAutocomplete() {
        autocompleteEl.hidden = true;
        autocompleteEl.innerHTML = '';
        autocompleteIdx = -1;
    }

    function navegarAutocomplete(dir) {
        const items = autocompleteEl.querySelectorAll('.autocomplete-item');
        if (!items.length) return;
        items[autocompleteIdx]?.classList.remove('selected');
        autocompleteIdx = (autocompleteIdx + dir + items.length) % items.length;
        items[autocompleteIdx].classList.add('selected');
        input.value = items[autocompleteIdx].querySelector('.autocomplete-nome').textContent;
    }

    // ── BUSCA PRINCIPAL ───────────────────────────────────────────────────────
    function executarBusca() {
        const q = normalizar(termoBusca);
        const temTags    = filtrosAtivos.tags.size > 0;
        const temEstados = filtrosAtivos.estados.size > 0;

        const resultados = ongsDatabase.filter(ong => {
            // Filtro de texto
            if (q) {
                const campos = [
                    ong.titulo,
                    ong.descricao,
                    ong.endereco,
                    ...(ong.tags || []),
                    ...(ong.qualificacoes || [])
                ].map(normalizar).join(' ');
                if (!campos.includes(q)) return false;
            }

            // Filtro de tags
            if (temTags) {
                const ongTags = (ong.tags || []).map(t => t.toLowerCase());
                const match = [...filtrosAtivos.tags].some(t => ongTags.includes(t.toLowerCase()));
                if (!match) return false;
            }

            // Filtro de estado
            if (temEstados) {
                const est = extrairEstado(ong.endereco);
                if (!filtrosAtivos.estados.has(est)) return false;
            }

            return true;
        });

        renderCards(resultados);
    }

    // ── RENDER DE CARDS ───────────────────────────────────────────────────────
    function renderCards(lista) {
        resultsHeader.hidden = false;
        contagemEl.textContent = lista.length === 1
            ? '1 resultado'
            : `${lista.length} resultados`;

        if (!lista.length) {
            cardsEl.innerHTML = `
                <div class="estado-vazio">
                    <span class="material-symbols-outlined">search_off</span>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente outros termos ou remova alguns filtros.</p>
                </div>`;
            return;
        }

        cardsEl.innerHTML = '';
        lista.forEach((ong, i) => {
            const card = criarCard(ong, i);
            cardsEl.appendChild(card);
        });
    }

    function criarCard(ong, idx) {
        const tagsHtml = (ong.tags || []).slice(0, 4).map(t =>
            `<span class="card-tag">#${t}</span>`
        ).join('');

        const estado = extrairEstado(ong.endereco);
        const href   = `ong.html?id=${ong.id}`;

        const a = document.createElement('a');
        a.className = 'ong-result-card';
        a.href      = href;
        a.style.animationDelay = `${idx * 0.06}s`;
        a.setAttribute('aria-label', `Ver detalhes de ${ong.titulo}`);

        a.innerHTML = `
            <div class="card-img-wrap">
                <img src="${ong.imagemUrl}"
                     alt="${ong.titulo}"
                     loading="lazy"
                     onerror="this.src='https://picsum.photos/id/13/600/400'">
                <div class="card-img-overlay"></div>
                <div class="card-local-badge">
                    <span class="material-symbols-outlined">location_on</span>
                    ${ong.endereco}
                </div>
            </div>
            <div class="card-info">
                <div class="card-nome">${ong.titulo}</div>
                <div class="card-tags">${tagsHtml}</div>
                <div class="card-ver-mais">
                    Ver detalhes
                    <span class="material-symbols-outlined">arrow_forward</span>
                </div>
            </div>`;

        return a;
    }

    // ── EVENT LISTENERS ───────────────────────────────────────────────────────

    // Input: autocomplete em tempo real
    input.addEventListener('input', () => {
        termoBusca = input.value;
        mostrarAutocomplete(termoBusca);
    });

    // Teclado: navegar autocomplete + buscar com Enter
    input.addEventListener('keydown', e => {
        if (!autocompleteEl.hidden) {
            if (e.key === 'ArrowDown') { e.preventDefault(); navegarAutocomplete(1); return; }
            if (e.key === 'ArrowUp')   { e.preventDefault(); navegarAutocomplete(-1); return; }
            if (e.key === 'Escape')    { fecharAutocomplete(); return; }
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            termoBusca = input.value;
            fecharAutocomplete();
            executarBusca();
        }
    });

    // Fecha autocomplete ao clicar fora
    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !autocompleteEl.contains(e.target)) {
            fecharAutocomplete();
        }
    });

    // Botão busca
    buscaBtnEl.addEventListener('click', () => {
        termoBusca = input.value;
        fecharAutocomplete();
        executarBusca();
    });

    // Botão filtro: abrir/fechar painel
    filtroBtnEl.addEventListener('click', () => {
        const aberto = !painelFiltros.hidden;
        painelFiltros.hidden = aberto;
        filtroBtnEl.classList.toggle('ativo', !aberto);
        filtroBtnEl.setAttribute('aria-expanded', String(!aberto));
    });

    // Limpar filtros
    limparBtnEl.addEventListener('click', limparFiltros);

    // ── INIT ──────────────────────────────────────────────────────────────────
    loadData();

})();