// author: GitHub Copilot
// date: 2026-04-13
// name: docker-compose-quick-controls
// description: Mostra i container Docker Compose e copia comandi restart/stop.
(function () {
  const observedAnchor = '.ps-container';
  const jsonPath = '/mod/docker-compose-quick-controls/containers.json';
  const refreshInterval = 10000;
  let autoRefresh = null;

  function moduleFunction() {
    if (document.querySelector('[widget-id="docker-compose-quick-controls"]')) return;
    const container = document.querySelector(observedAnchor);
    if (!container) return;

    const widget = document.createElement('div');
    widget.setAttribute('widget-id', 'docker-compose-quick-controls');
    widget.className = 'widget docker-compose-widget';
    widget.innerHTML = `
<div class="blur-background"></div>
<div class="widget-content">
  <div class="widget-header is-flex is-align-items-center" style="justify-content: space-between; gap: 10px;">
    <div class="widget-title-section is-flex-grow-1">
      <div class="docker-compose-title">Docker Compose Quick Controls</div>
      <div class="docker-compose-subtitle">Status rapido container + copia comandi restart/stop</div>
    </div>
    <button type="button" class="dcq-refresh" title="Aggiorna">&#10227;</button>
  </div>
  <div class="docker-compose-body">
    <div class="dcq-summary">Carica lo stato da <code>/mod/docker-compose-quick-controls/containers.json</code>.</div>
    <div class="dcq-container-list"></div>
    <div class="dcq-note">I pulsanti copiano il comando negli appunti. Esegui il comando in shell sulla VM host o nel progetto Compose.</div>
  </div>
</div>`;

    container.insertBefore(widget, container.firstChild);
    const listEl = widget.querySelector('.dcq-container-list');
    const refreshButton = widget.querySelector('.dcq-refresh');

    refreshButton.addEventListener('click', loadContainers);
    loadContainers();

    if (autoRefresh) clearInterval(autoRefresh);
    autoRefresh = setInterval(loadContainers, refreshInterval);

    async function loadContainers() {
      listEl.innerHTML = '<div class="dcq-loading">Caricamento...</div>';
      try {
        const response = await fetch(jsonPath + '?t=' + Date.now());
        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
        const data = await response.json();
        renderContainers(data);
      } catch (error) {
        listEl.innerHTML = `<div class="dcq-error">Errore caricamento: ${escapeHtml(error.message)}</div>`;
      }
    }

    function renderContainers(data) {
      const containers = Array.isArray(data.containers) ? data.containers : [];
      if (!containers.length) {
        listEl.innerHTML = '<div class="dcq-empty">Nessun container Docker trovato. Verifica il file <code>containers.json</code>.</div>';
        return;
      }

      listEl.innerHTML = containers.map((item, index) => {
        const statusClass = getStatusClass(item.state || item.status);
        const cpuText = typeof item.cpu === 'number' ? item.cpu.toFixed(1) + '%' : '—';
        const memText = typeof item.memory === 'number' ? formatBytes(item.memory * 1024 * 1024) : '—';
        const limitText = typeof item.memory_limit === 'number' ? formatBytes(item.memory_limit * 1024 * 1024) : '—';
        const service = item.service || item.compose_service || item.name || '—';
        return `
<div class="dcq-row">
  <div class="dcq-row-main">
    <div class="dcq-row-title">${escapeHtml(service)}</div>
    <div class="dcq-row-meta">${escapeHtml(item.image || 'immagine sconosciuta')}</div>
  </div>
  <div class="dcq-row-status ${statusClass}">${escapeHtml(item.state || item.status || '—')}</div>
  <div class="dcq-row-metrics">
    <span>CPU: <strong>${escapeHtml(cpuText)}</strong></span>
    <span>RAM: <strong>${escapeHtml(memText)}</strong> / ${escapeHtml(limitText)}</span>
  </div>
  <div class="dcq-row-actions">
    <button type="button" class="dcq-copy-command" data-command="${escapeHtml(item.restart_command || `docker compose restart ${service}`)}">Copia Restart</button>
    <button type="button" class="dcq-copy-command" data-command="${escapeHtml(item.stop_command || `docker compose stop ${service}`)}">Copia Stop</button>
  </div>
  <div class="dcq-row-footer">
    <div>Container: <code>${escapeHtml(item.name || item.id || '—')}</code></div>
    <div>Progetto: <strong>${escapeHtml(item.project || item.compose_project || '—')}</strong></div>
  </div>
</div>`;
      }).join('');

      widget.querySelectorAll('.dcq-copy-command').forEach(button => {
        button.addEventListener('click', async () => {
          const command = button.getAttribute('data-command') || '';
          try {
            await navigator.clipboard.writeText(command);
            button.textContent = 'Copiato!';
            setTimeout(() => {
              button.textContent = button.dataset.command && button.dataset.command.includes('restart') ? 'Copia Restart' : 'Copia Stop';
            }, 1200);
          } catch (err) {
            button.textContent = 'Errore copia';
          }
        });
      });
    }

    function getStatusClass(state) {
      const normalized = String(state || '').toLowerCase();
      if (normalized.includes('up') || normalized.includes('running')) return 'dcq-status-running';
      if (normalized.includes('exited') || normalized.includes('paused') || normalized.includes('dead') || normalized.includes('stopped')) return 'dcq-status-stopped';
      return 'dcq-status-unknown';
    }

    function formatBytes(bytes) {
      if (bytes == null || Number.isNaN(bytes)) return '—';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let value = Number(bytes);
      let unitIndex = 0;
      while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
      }
      return `${value.toFixed(1)} ${units[unitIndex]}`;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
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
