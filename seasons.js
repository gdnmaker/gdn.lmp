(function () {
    'use strict';
    if (window.SeasonBadgePlugin && window.SeasonBadgePlugin.__initialized) return;
    window.SeasonBadgePlugin = window.SeasonBadgePlugin || {};
    window.SeasonBadgePlugin.__initialized = true;

    var CONFIG = {
        tmdbApiKey: '4ef0d7355d9ffb5151e987764708ce96',
        cacheTime: 24 * 60 * 60 * 1000,
        enabled: true,
        language: 'uk'
    };

    var style = document.createElement('style');
    style.textContent = `
    .card--season-complete,
    .card--season-progress {
        position: absolute;
        left: -0.8em;
        z-index: 12;
        border-radius: 0.3em;
        opacity: 0;
        transition: opacity 0.22s ease-in-out;
        white-space: nowrap;
        backdrop-filter: blur(2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .card--season-complete { background: rgba(52,152,219,0.8); }
    .card--season-progress { background: rgba(244,67,54,0.8); }
    .card--season-complete div,
    .card--season-progress div {
        color: #fff;
        font-size: 0.8em;
        padding: 0.4em 0.6em;
        display: flex;
        align-items: center;
    }
    .card--season-complete.show,
    .card--season-progress.show { opacity: 1; }

    .content-label {
        position: absolute;
        top: 1.4em;
        left: -0.8em;
        color: #fff;
        padding: 0.4em;
        border-radius: 0.3em;
        font-size: 0.8em;
        z-index: 10;
    }
    .serial-label { background: #3498db; }
    .movie-label { background: #2ecc71; }
    `;
    document.head.appendChild(style);

    function fetchSeriesData(id) {
        return fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${CONFIG.tmdbApiKey}&language=${CONFIG.language}`)
            .then(r => r.json());
    }

    function getSeasonProgress(data) {
        if (!data.last_episode_to_air) return null;
        let last = data.last_episode_to_air;
        let season = data.seasons.find(s => s.season_number === last.season_number);
        if (!season) return null;
        return {
            season: last.season_number,
            aired: last.episode_number,
            total: season.episode_count,
            done: last.episode_number >= season.episode_count
        };
    }

    function createBadge(text, done) {
        let el = document.createElement('div');
        el.className = done ? 'card--season-complete' : 'card--season-progress';
        el.innerHTML = `<div>${text}</div>`;
        return el;
    }

    function addSeasonBadge(card) {
        if (!card.card_data || card.dataset.season) return;
        if (!card.card_data.seasons) return;

        let view = card.querySelector('.card__view');
        if (!view) return;

        card.dataset.season = '1';

        fetchSeriesData(card.card_data.id).then(data => {
            let p = getSeasonProgress(data);
            if (!p) return;

            let text = p.done
                ? `${p.season} сезон завершено`
                : `Сезон ${p.season} Серія ${p.aired} з ${p.total}`;

            let badge = createBadge(text, p.done);
            view.appendChild(badge);
            setTimeout(() => badge.classList.add('show'), 50);
        });
    }

    function addLabels(card) {
        if (card.querySelector('.content-label')) return;
        let view = card.querySelector('.card__view');
        if (!view) return;

        let lbl = document.createElement('div');
        lbl.className = 'content-label';

        if (card.card_data?.seasons) {
            lbl.classList.add('serial-label');
            lbl.textContent = 'Серіал';
        } else {
            lbl.classList.add('movie-label');
            lbl.textContent = 'Фільм';
        }
        view.appendChild(lbl);
    }

    new MutationObserver(m => {
        m.forEach(x => {
            x.addedNodes.forEach(n => {
                if (n.classList?.contains('card')) {
                    addSeasonBadge(n);
                    addLabels(n);
                }
            });
        });
    }).observe(document.body, { childList: true, subtree: true });

})();
