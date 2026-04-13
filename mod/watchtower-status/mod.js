// author: GitHub Copilot
// date: 2026-04-13
// name: watchtower-status
// description: Display Watchtower update status in CasaOS dashboard.
(function () {
  const observedAnchor = '.ps-container';
  const jsonPath = '/mod/watchtower-status/status.json';
  const refreshInterval = 10000;
  let autoRefresh = null;

  function moduleFunction() {
    if (document.querySelector('[widget-id="watchtower-status"]')) return;
    const container = document.querySelector(observedAnchor);
    if (!container) return;

    const widget = document.createElement('div');
    widget.setAttribute('widget-id', 'watchtower-status');
    widget.className = 'widget watchtower-status-widget';
    widget.innerHTML = `
<div class="blur-background"></div>
<div class="widget-content">
  <div class="widget-header is-flex is-align-items-center" style="justify-content: space-between; gap: 10px;">
    <div class="widget-title-section is-flex-grow-1">
      <div class="watchtower-title">Aggiornamenti Container</div>
      <div class="watchtower-subtitle">Stato Watchtower e log ultimi aggiornamenti</div>
    </div>
    <button type="button" class="watchtower-refresh" title="Aggiorna">&#10227;</button>
  </div>
  <div class="watchtower-body">
    <div class="watchtower-status-row">
      <div class="watchtower-badge watchtower-status-unknown">Caricamento...</div>
      <div class="watchtower-updated-at">Ultimo controllo: —</div>
    </div>
    <div class="watchtower-summary">Carica lo stato da <code>/mod/watchtower-status/status.json</code>.</div>
    <div class="watchtower-counters">
      <div class="watchtower-counter"><span>Aggiornati</span><strong>—</strong></div>
      <div class="watchtower-counter"><span>In attesa</span><strong>—</strong></div>
      <div class="watchtower-counter"><span>Falliti</span><strong>—</strong></div>
    </div>
    <div class="watchtower-list" id="watchtower-items"></div>
    <div class="watchtower-log-panel">
      <div class="watchtower-log-title">Ultimi log</div>
      <pre class="watchtower-log-content">Caricamento...</pre>
    </div>
  </div>
</div>`;

    container.insertBefore(widget, container.firstChild);
    const refreshButton = widget.querySelector('.watchtower-refresh');
    const badge = widget.querySelector('.watchtower-badge');
    const updatedAt = widget.querySelector('.watchtower-updated-at');
    const summary = widget.querySelector('.watchtower-summary');
    const counters = widget.querySelector('.watchtower-counters');
    const items = widget.querySelector('#watchtower-items');
    const logContent = widget.querySelector('.watchtower-log-content');

    async function loadStatus() {
      refreshButton.disabled = true;
      try {
        const response = await fetch(jsonPath + '?t=' + Date.now());
        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
        const data = await response.json();
        renderStatus(data);
      } catch (err) {
        badge.textContent = 'Errore';
        badge.className = 'watchtower-badge watchtower-status-error';
        updatedAt.textContent = 'Ultimo controllo: errore';
        summary.textContent = 'Impossibile caricare lo stato di Watchtower.';
        items.innerHTML = '';
        logContent.textContent = err.message;
      } finally {
        refreshButton.disabled = false;
      }
    }

    function renderStatus(data) {
      const status = data.status || 'unknown';
      badge.textContent = data.title || statusTitling(status);
      badge.className = `watchtower-badge watchtower-status-${status}`;
      updatedAt.textContent = `Ultimo controllo: ${data.timestamp || '—'}`;
      summary.textContent = data.message || 'Stato aggiornamenti contenitori.';
      items.innerHTML = renderItems(data);
      logContent.textContent = formatLogPreview(data.recent_log);
    }

    function formatLogPreview(rawLog) {
      const logText = String(rawLog || '').trim();
      if (!logText) return 'Nessun log disponibile.';
      const lines = logText.split(/\r?\n/);
      const maxLines = 30;
      if (lines.length <= maxLines) return logText;
      const tail = lines.slice(-maxLines);
      return `...mostra ultime ${maxLines} righe...\n${tail.join('\n')}`;
    }

    function renderItems(data) {
      const groups = [
        { key: 'updated', label: 'Aggiornati', color: 'green' },
        { key: 'pending', label: 'In attesa', color: 'yellow' },
        { key: 'failed', label: 'Falliti', color: 'red' }
      ];
      return groups.map(group => {
        const array = Array.isArray(data[group.key]) ? data[group.key] : [];
        if (!array.length) return '';
        return `<div class="watchtower-item-group watchtower-item-${group.color}"><div class="watchtower-item-group-title">${group.label} (${array.length})</div><div class="watchtower-item-list">${array.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div></div>`;
      }).join('');
    }

    function statusTitling(status) {
      if (status === 'ok') return 'Tutto aggiornato';
      if (status === 'warning') return 'Aggiornamenti disponibili';
      if (status === 'error') return 'Errore update';
      return 'Stato sconosciuto';
    }

    refreshButton.addEventListener('click', loadStatus);
    loadStatus();

    if (autoRefresh) clearInterval(autoRefresh);
    autoRefresh = setInterval(loadStatus, refreshInterval);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function start() {
    if (document.querySelector(observedAnchor)) {
      moduleFunction();
      return;
    }
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector(observedAnchor)) {
        obs.disconnect();
        debounced();
      }
    });
    const debounced = debounce(moduleFunction, 1);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  start();
})();
