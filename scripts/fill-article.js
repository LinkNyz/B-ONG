(function () {

    let ongsDatabase = [];
    const container = document.getElementById("single-ong-container");

    function getSlug() {
        const p = new URLSearchParams(window.location.search);
        const v = p.get('id') || p.get('ong') || p.get('slug');
        return v ? v.trim().toLowerCase() : null;
    }

    function makeSlug(title) {
        return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
    }

    function normalizeIds(list) {
        return list.map(n => ({ ...n, id: n.id ? n.id.toLowerCase() : makeSlug(n.titulo) }));
    }

    async function loadData() {
        const r = await fetch('../../ongs.json');
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (Array.isArray(data) && data.length) { ongsDatabase = normalizeIds(data); return; }
        throw new Error();
    }

    function render(ong) {
        if (!ong) {
            container.innerHTML = `
                <div class="error-card">
                    <span class="material-symbols-outlined">search_off</span>
                    <h2>Organização não encontrada</h2>
                    <p>Verifique o identificador na URL.<br>
                    Use parâmetros como <code style="background:#f0f0f0;padding:2px 8px;border-radius:4px">?id=nome-da-ong</code></p>
                    <div style="margin-top:24px;">
                        <a href="#" onclick="window.history.back();return false;" style="color:var(--forest);font-weight:600;">← Voltar</a>
                    </div>
                </div>`;
            return;
        }

        const qualsHtml = (ong.qualificacoes || []).map(q =>
            `<span class="chip-qual"><span class="material-symbols-outlined">verified</span>${q}</span>`
        ).join('');

        const donationsHtml = (ong.doacoes_aceitas || []).map(d =>
            `<span class="chip-donation">${d}</span>`
        ).join('');

        const tagsHtml = (ong.tags || []).map(t =>
            `<span class="chip-tag">#${t}</span>`
        ).join('');

        const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(ong.endereco)}&output=embed&z=14`;

        container.innerHTML = `
        <div class="ong-card">
            <div class="banner">
                <img src="${ong.imagemUrl}" alt="${ong.titulo}" onerror="this.src='https://picsum.photos/id/13/1200/500'">
                <div class="banner-overlay"></div>
                <span class="banner-badge">ONG Verificada</span>
                <div class="banner-meta">
                    <h1 class="banner-title">${ong.titulo}</h1>
                    <a href="${ong.linkSite}" target="_blank" rel="noopener noreferrer" class="cta-btn">
                        Site oficial <span class="material-symbols-outlined">open_in_new</span>
                    </a>
                </div>
            </div>

            <div class="card-body">

                <div class="desc-block">
                    <p>${ong.descricao}</p>
                </div>

                <div class="info-sidebar">
                    <div class="info-tile">
                        <div class="tile-heading">
                            <span class="material-symbols-outlined">verified</span>
                            Qualificações
                        </div>
                        <div class="chips">${qualsHtml || '<span style="color:var(--text-muted);font-size:.82rem;">Não informado</span>'}</div>
                    </div>
                    <div class="info-tile">
                        <div class="tile-heading">
                            <span class="material-symbols-outlined">volunteer_activism</span>
                            Doações aceitas
                        </div>
                        <div class="chips">${donationsHtml || '<span style="color:var(--text-muted);font-size:.82rem;">Não informado</span>'}</div>
                    </div>
                    <div class="info-tile">
                        <div class="tile-heading">
                            <span class="material-symbols-outlined">local_offer</span>
                            Categorias
                        </div>
                        <div class="chips">${tagsHtml || '<span style="color:var(--text-muted);font-size:.82rem;">Não informado</span>'}</div>
                    </div>
                </div>

                <div class="loc-block">
                    <div class="section-label">
                        <span class="material-symbols-outlined">location_on</span>
                        Localização
                    </div>
                    <div class="location-row">
                        <span class="material-symbols-outlined">pin_drop</span>
                        ${ong.endereco}
                    </div>
                    <div class="map-frame">
                        <iframe src="${mapSrc}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <div class="bottom-cta">
                    <div class="bottom-cta-text">
                        <h3>Quer ajudar esta causa?</h3>
                        <p>Acesse o site oficial e descubra como contribuir diretamente.</p>
                    </div>
                    <a href="${ong.linkSite}" target="_blank" rel="noopener noreferrer" class="cta-btn-lg">
                        Acessar site oficial <span class="material-symbols-outlined">open_in_new</span>
                    </a>
                </div>

            </div>
        </div>`;
    }

    async function init() {
        await loadData();
        const slug = getSlug();

        if (!slug) {
            container.innerHTML = `
                <div class="error-card" style="border-left-color:var(--forest);">
                    <span class="material-symbols-outlined" style="color:var(--forest);">help_outline</span>
                    <h2>Nenhuma ONG especificada</h2>
                    <p>Use o parâmetro na URL: <code style="background:#f0f0f0;padding:2px 8px;border-radius:4px">?id=nome-da-ong</code></p>
                    <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
                        ${ongsDatabase.map(o =>
                `<a href="?id=${o.id}" style="background:var(--forest);color:#fff;padding:6px 16px;border-radius:40px;text-decoration:none;font-size:.85rem;">${o.titulo}</a>`
            ).join('')}
                    </div>
                </div>`;
            return;
        }

        const ong = ongsDatabase.find(n => n.id === slug) || null;
        render(ong);
    }

    init();
})();
