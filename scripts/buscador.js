(function () {
    'use strict';

    let ongsDatabase = [];
    let filtrosAtivos = { tags: new Set(), estados: new Set() };
    let termoBusca = '';
    let autocompleteIdx = -1;
    let debounceTimer = null;

    const input           = document.getElementById('busca-input');
    const autocompleteEl  = document.getElementById('autocomplete-list');
    const filtroBtnEl     = document.getElementById('filtro-btn');
    const painelFiltros   = document.getElementById('painel-filtros');
    const filtrosTagsEl   = document.getElementById('filtros-tags');
    const filtrosEstEl    = document.getElementById('filtros-estados');
    const limparBtnEl     = document.getElementById('limpar-filtros');
    const buscaBtnEl      = document.getElementById('busca-btn');
    const cardsEl         = document.getElementById('cards-container');
    const resultsHeader   = document.getElementById('resultados-header');
    const contagemEl      = document.getElementById('contagem');
    const filtrosAtivosEl = document.getElementById('filtros-ativos');

    cardsEl.setAttribute('aria-live', 'polite');
    cardsEl.setAttribute('aria-atomic', 'false');

    function normalizar(str) {
        return (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function extrairEstado(endereco) {
        const m = (endereco || '').match(/[-,]\s*([A-Z]{2})\b/);
        return m ? m[1] : null;
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<mark>$1</mark>');
    }

    function calcularRelevancia(ong, q) {
        if (!q) return 0;
        let score = 0;
        const titulo = normalizar(ong.titulo);
        const tags   = (ong.tags || []).map(normalizar).join(' ');
        const desc   = normalizar(ong.descricao);

        if (titulo === q) score += 100;
        else if (titulo.startsWith(q)) score += 60;
        else if (titulo.includes(q)) score += 40;

        if (tags.includes(q)) score += 20;
        if (desc.includes(q)) score += 10;

        return score;
    }

    function mostrarSkeleton() {
        cardsEl.innerHTML = Array(6).fill(0).map(() => `
            <div class="ong-result-card skeleton-card" aria-hidden="true">
                <div class="skeleton skeleton-img"></div>
                <div class="card-info">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-line"></div>
                    <div class="skeleton skeleton-line skeleton-line--short"></div>
                </div>
            </div>`).join('');
    }

    async function loadData() {
        mostrarSkeleton();
        try {
            const response = await fetch('/ongs.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data) || !data.length) throw new Error('Dados vazios');
            ongsDatabase = data;
            onDataLoaded();
        } catch (e) {
            cardsEl.innerHTML = `
                <div class="estado-erro">
                    <span class="material-symbols-outlined">error</span>
                    <h3>Erro ao carregar dados</h3>
                    <p>Não foi possível buscar o banco de ONGs.<br>Verifique se o arquivo <code>ongs.json</code> está na raiz do site.</p>
                </div>`;
            console.error('[buscador] Erro ao carregar ongs.json:', e);
        }
    }

    function onDataLoaded() {
        construirFiltros();
        renderCards(ongsDatabase);
    }

    function construirFiltros() {
        const tagsSet    = new Set();
        const estadosSet = new Set();

        ongsDatabase.forEach(ong => {
            (ong.tags || []).forEach(t => tagsSet.add(t));
            const est = extrairEstado(ong.endereco);
            if (est) estadosSet.add(est);
        });

        filtrosTagsEl.innerHTML = '';
        [...tagsSet].sort().forEach(tag => {
            filtrosTagsEl.appendChild(criarChipFiltro(tag, 'tags'));
        });

        filtrosEstEl.innerHTML = '';
        [...estadosSet].sort().forEach(est => {
            filtrosEstEl.appendChild(criarChipFiltro(est, 'estados'));
        });
    }

    function criarChipFiltro(valor, tipo) {
        const btn = document.createElement('button');
        btn.className = 'chip-filtro';
        btn.textContent = valor;
        btn.dataset.valor = valor;
        btn.dataset.tipo  = tipo;
        btn.type = 'button';
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
                chip.type = 'button';
                chip.innerHTML = `${valor} <span class="material-symbols-outlined">close</span>`;
                chip.addEventListener('click', () => {
                    filtrosAtivos[tipo].delete(valor);
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

    function mostrarAutocomplete(query) {
        const q = normalizar(query);
        if (!q || q.length < 1) { fecharAutocomplete(); return; }

        const resultados = ongsDatabase.filter(ong => {
            const campos = [ong.titulo, ong.endereco, ...(ong.tags || [])].map(normalizar).join(' ');
            return campos.includes(q);
        }).slice(0, 6);

        if (!resultados.length) { fecharAutocomplete(); return; }

        autocompleteEl.innerHTML = '';
        autocompleteIdx = -1;

        resultados.forEach((ong, i) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-idx', i);

            const thumb = document.createElement('img');
            thumb.className = 'autocomplete-thumb';
            thumb.src = ong.imagemUrl;
            thumb.alt = '';
            thumb.onerror = function () { this.src = 'https://picsum.photos/id/13/80/80'; };

            const info = document.createElement('div');
            info.className = 'autocomplete-info';
            info.innerHTML = `
                <div class="autocomplete-nome">${highlightMatch(ong.titulo, query)}</div>
                <div class="autocomplete-meta">
                    ${extrairEstado(ong.endereco)} · ${(ong.tags || []).slice(0, 2).join(', ')}
                </div>`;

            item.appendChild(thumb);
            item.appendChild(info);

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
        if (autocompleteIdx >= 0) items[autocompleteIdx]?.classList.remove('selected');
        autocompleteIdx = (autocompleteIdx + dir + items.length) % items.length;
        items[autocompleteIdx].classList.add('selected');
        const nome = items[autocompleteIdx].querySelector('.autocomplete-nome');
        if (nome) input.value = nome.textContent;
    }

    function executarBusca() {
        const q = normalizar(termoBusca);
        const temTags    = filtrosAtivos.tags.size > 0;
        const temEstados = filtrosAtivos.estados.size > 0;

        let resultados = ongsDatabase.filter(ong => {
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

            if (temTags) {
                const ongTags = (ong.tags || []).map(t => t.toLowerCase());
                if (![...filtrosAtivos.tags].some(t => ongTags.includes(t.toLowerCase()))) return false;
            }

            if (temEstados) {
                if (!filtrosAtivos.estados.has(extrairEstado(ong.endereco))) return false;
            }

            return true;
        });

        if (q) {
            resultados = resultados
                .map(ong => ({ ong, score: calcularRelevancia(ong, q) }))
                .sort((a, b) => b.score - a.score)
                .map(({ ong }) => ong);
        }

        renderCards(resultados);
    }

    function executarBuscaDebounced() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(executarBusca, 250);
    }

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
            cardsEl.appendChild(criarCard(ong, i));
        });
    }

    function criarCard(ong, idx) {
        const tagsHtml = (ong.tags || []).slice(0, 3).map(t =>
            `<span class="card-tag">#${t}</span>`
        ).join('');

        const descricao = (ong.descricao || '').length > 110
            ? ong.descricao.slice(0, 107) + '…'
            : ong.descricao;

        const href = `pages/article.html?id=${ong.id}`;

        const a = document.createElement('a');
        a.className = 'ong-result-card';
        a.href = href;
        a.style.animationDelay = `${idx * 0.05}s`;
        a.setAttribute('aria-label', `Ver detalhes de ${ong.titulo}`);

        const img = document.createElement('img');
        img.src = ong.imagemUrl;
        img.alt = ong.titulo;
        img.loading = 'lazy';
        img.onerror = function () { this.src = 'https://picsum.photos/id/13/600/400'; };

        const imgWrap = document.createElement('div');
        imgWrap.className = 'card-img-wrap';
        imgWrap.appendChild(img);
        imgWrap.innerHTML += `
            <div class="card-img-overlay"></div>
            <div class="card-local-badge">
                <span class="material-symbols-outlined">location_on</span>
                ${ong.endereco}
            </div>`;

        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';
        cardInfo.innerHTML = `
            <div class="card-nome">${ong.titulo}</div>
            ${descricao ? `<p class="card-desc">${descricao}</p>` : ''}
            <div class="card-tags">${tagsHtml}</div>
            <div class="card-ver-mais">
                Ver detalhes
                <span class="material-symbols-outlined">arrow_forward</span>
            </div>`;

        a.appendChild(imgWrap);
        a.appendChild(cardInfo);

        return a;
    }

    input.addEventListener('input', () => {
        termoBusca = input.value;
        mostrarAutocomplete(termoBusca);
        executarBuscaDebounced();
    });

    input.addEventListener('keydown', e => {
        if (!autocompleteEl.hidden) {
            if (e.key === 'ArrowDown') { e.preventDefault(); navegarAutocomplete(1); return; }
            if (e.key === 'ArrowUp')   { e.preventDefault(); navegarAutocomplete(-1); return; }
            if (e.key === 'Escape')    { fecharAutocomplete(); return; }
            if (e.key === 'Enter') {
                e.preventDefault();
                const sel = autocompleteEl.querySelector('.autocomplete-item.selected');
                if (sel) {
                    const nome = sel.querySelector('.autocomplete-nome');
                    if (nome) { termoBusca = nome.textContent; input.value = nome.textContent; }
                }
                fecharAutocomplete();
                clearTimeout(debounceTimer);
                executarBusca();
                return;
            }
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            termoBusca = input.value;
            fecharAutocomplete();
            clearTimeout(debounceTimer);
            executarBusca();
        }
    });

    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !autocompleteEl.contains(e.target)) {
            fecharAutocomplete();
        }
    });

    buscaBtnEl.addEventListener('click', () => {
        termoBusca = input.value;
        fecharAutocomplete();
        clearTimeout(debounceTimer);
        executarBusca();
    });

    filtroBtnEl.addEventListener('click', () => {
        const aberto = !painelFiltros.hidden;
        painelFiltros.hidden = aberto;
        filtroBtnEl.classList.toggle('ativo', !aberto);
        filtroBtnEl.setAttribute('aria-expanded', String(!aberto));
    });

    limparBtnEl.addEventListener('click', limparFiltros);

    loadData();

})();
