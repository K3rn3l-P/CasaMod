// author: generated sample GPU status MOD
// date: 2026-04-12
(function () {
    const observedAnchor = '.ps-container';
    let autoRefresh = null;
    let statusTitleText = null;
    let statusSubtitleText = null;
    let statusPowerText = null;

    function moduleFunction() {
        if (document.querySelector('[widget-id="gpu-status"]')) return;
        const container = document.querySelector(observedAnchor);
        if (!container) return;

        const newElement = document.createElement('div');
        newElement.setAttribute('widget-id', 'gpu-status');
        newElement.className = 'widget gpu-status-widget is-relative';
        newElement.innerHTML = `
<div class="blur-background"></div>
<div class="widget-content">
  <div class="widget-header is-flex is-align-items-center" style="justify-content: space-between; gap: 10px;">
    <div class="widget-title-section is-flex-grow-1">
      <span style="vertical-align:middle; margin-right:8px; display:inline-flex; align-items:center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#99c3ff">
          <path d="M17,7A2,2 0 0,1 19,9V15A2,2 0 0,1 17,17H7A2,2 0 0,1 5,15V9A2,2 0 0,1 7,7H17M16,9C15.45,9 15,9.45 15,10V14C15,14.55 15.45,15 16,15C16.55,15 17,14.55 17,14V10C17,9.45 16.55,9 16,9M8,9C7.45,9 7,9.45 7,10V14C7,14.55 7.45,15 8,15C8.55,15 9,14.55 9,14V10C9,9.45 8.55,9 8,9Z" />
        </svg>
      </span>
      <div class="gpu-status-title-content">
        <div class="gpu-status-title-text">GPU NVIDIA</div>
        <div class="gpu-status-subtitle">Driver Version: — · CUDA Version: —</div>
        <div class="gpu-status-power">Watt: — / —</div>
      </div>
    </div>
    <button type="button" class="gpu-status-refresh" title="Aggiorna">
      &#10227;
    </button>
  </div>
  <div class="gpu-status-body">
    <div class="gpu-status-gauges"></div>
    <div class="gpu-process-section">
      <button type="button" class="gpu-process-toggle" aria-expanded="false">
        <span class="arrow">&#9654;</span> Processi GPU
      </button>
      <div class="gpu-process-list" style="display:none;">
        <div class="gpu-process-loading">Caricamento...</div>
      </div>
    </div>
    <pre id="gpu-data" class="gpu-status-pre">Caricamento...</pre>
  </div>
</div>`;

        container.insertBefore(newElement, container.firstChild);
        const gaugeContainer = newElement.querySelector('.gpu-status-gauges');
        const rawOutput = newElement.querySelector('#gpu-data');
        statusTitleText = newElement.querySelector('.gpu-status-title-text');
        statusSubtitleText = newElement.querySelector('.gpu-status-subtitle');
        statusPowerText = newElement.querySelector('.gpu-status-power');
        const processToggle = newElement.querySelector('.gpu-process-toggle');
        const processList = newElement.querySelector('.gpu-process-list');
        const refreshButton = newElement.querySelector('.gpu-status-refresh');

        async function runRefresh() {
            refreshButton.disabled = true;
            refreshButton.classList.add('is-loading');
            try {
                await updateGPU(gaugeContainer, rawOutput);
                if (processToggle.getAttribute('aria-expanded') === 'true') {
                    await loadGpuProcesses(processList);
                }
            } finally {
                refreshButton.disabled = false;
                refreshButton.classList.remove('is-loading');
            }
        }

        refreshButton.onclick = runRefresh;

        processToggle.onclick = async () => {
            const expanded = processToggle.getAttribute('aria-expanded') === 'true';
            if (expanded) {
                processToggle.setAttribute('aria-expanded', 'false');
                processToggle.querySelector('.arrow').style.transform = '';
                processList.style.display = 'none';
            } else {
                processToggle.setAttribute('aria-expanded', 'true');
                processToggle.querySelector('.arrow').style.transform = 'rotate(90deg)';
                processList.style.display = '';
                processList.innerHTML = '<div class="gpu-process-loading">Caricamento...</div>';
                await loadGpuProcesses(processList);
            }
        };

        updateGPU(gaugeContainer, rawOutput);

        if (autoRefresh) clearInterval(autoRefresh);
        autoRefresh = setInterval(async () => {
            updateGPU(gaugeContainer, rawOutput);
            if (processToggle.getAttribute('aria-expanded') === 'true') {
                await loadGpuProcesses(processList);
            }
        }, 10000);
    }

    function updateHeader(data) {
        if (statusTitleText && data.gpuName) {
            statusTitleText.textContent = data.gpuName;
        }
        if (statusSubtitleText) {
            const details = [];
            if (data.driverVersion) details.push(`Driver: ${data.driverVersion}`);
            if (data.cudaVersion) details.push(`CUDA: ${data.cudaVersion}`);
            statusSubtitleText.textContent = details.length ? details.join(' · ') : 'Driver/CUDA non disponibili';
        }
        if (statusPowerText) {
            if (data.powerUsage != null && data.powerCap != null) {
                statusPowerText.textContent = `${data.powerUsage}W / ${data.powerCap}W`;
                statusPowerText.style.display = '';
            } else {
                statusPowerText.textContent = '';
                statusPowerText.style.display = 'none';
            }
        }
    }

    async function updateGPU(gaugeContainer, rawOutput) {
        const isInitialLoad = gaugeContainer.children.length === 0;
        if (isInitialLoad) {
            rawOutput.textContent = 'Caricamento...';
            rawOutput.style.display = 'block';
        }

        try {
            const response = await fetch('/mod/gpu-status/nvidia-smi.txt?cache=' + Date.now());
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const text = await response.text();
            const parsed = parseNvidiaOutput(text);
            if (parsed) {
                updateHeader(parsed);
                renderGauges(gaugeContainer, parsed);
                if (rawOutput.style.display !== 'none') {
                    rawOutput.style.display = 'none';
                }
            } else {
                rawOutput.textContent = text.trim() || 'Nessun output da nvidia-smi';
                rawOutput.style.display = 'block';
            }
        } catch (err) {
            rawOutput.textContent = 'Errore: ' + err.message + '\nVerifica che il file nvidia-smi.txt sia servito correttamente.';
            rawOutput.style.display = 'block';
        }
    }

    function parseNvidiaOutput(text) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 1) return null;

        const csvResult = parseCommaSeparatedOutput(lines);
        if (csvResult) return csvResult;

        return parsePlainTextOutput(lines);
    }

    function parseCommaSeparatedOutput(lines) {
        if (lines.length < 2) return null;
        const header = lines[0].split(',').map(part => part.trim().toLowerCase());
        let values = lines[1].split(',').map(part => part.trim());
        if (values.length > header.length) {
            const extra = values.length - header.length;
            values = [values.slice(0, extra + 1).join(', '), ...values.slice(extra + 1)];
        }
        if (values.length !== header.length) return null;

        const row = {};
        header.forEach((key, idx) => {
            row[key] = values[idx] || '';
        });

        const getField = keys => {
            for (const key of keys) {
                if (row[key]) return row[key];
            }
            return '';
        };

        const temperature = Number(getField(['temperature', 'temperature.gpu']));
        const utilization = Number(getField(['utilization', 'utilization.gpu']));
        const memoryUsed = Number(getField(['memory_used', 'memory.used']));
        const memoryTotal = Number(getField(['memory_total', 'memory.total']));
        if ([temperature, utilization, memoryUsed, memoryTotal].some(isNaN)) return null;

        const powerUsage = Number(getField(['power_usage', 'power.draw']));
        const powerCap = Number(getField(['power_cap', 'power.limit']));

        return {
            gpuName: getField(['gpu_name', 'name']) || undefined,
            driverVersion: getField(['driver_version']) || undefined,
            cudaVersion: getField(['cuda_version']) || undefined,
            temperature,
            utilization,
            memoryUsed,
            memoryTotal,
            memoryPercent: memoryTotal ? Math.round(memoryUsed / memoryTotal * 100) : 0,
            powerUsage: Number.isNaN(powerUsage) ? undefined : powerUsage,
            powerCap: Number.isNaN(powerCap) ? undefined : powerCap
        };
    }

    function parsePlainTextOutput(lines) {
        const headerLine = lines.find(line => /Driver Version:.*CUDA Version:/i.test(line));
        const driverMatch = headerLine && headerLine.match(/Driver Version:\s*([^\s]+)/i);
        const cudaMatch = headerLine && headerLine.match(/CUDA Version:\s*([^\s]+)/i);

        const gpuInfoIndex = lines.findIndex(line => /^\|\s*\d+\s+.+\s+(On|Off)\s+\|/.test(line));
        if (gpuInfoIndex < 0 || gpuInfoIndex + 1 >= lines.length) return null;

        const gpuNameMatch = lines[gpuInfoIndex].match(/^\|\s*\d+\s+(.+?)\s+(On|Off)\s+\|/);
        const statsLine = lines[gpuInfoIndex + 1];
        const powerMatch = statsLine.match(/(\d+)\s*W\s*\/\s*(\d+)\s*W/);
        const tempMatch = statsLine.match(/(\d+)C/);
        const utilMatch = statsLine.match(/(\d+)%/);
        const memMatch = statsLine.match(/(\d+)\s*MiB\s*\/\s*(\d+)\s*MiB/);

        if (!tempMatch || !utilMatch || !memMatch) return null;

        const temperature = Number(tempMatch[1]);
        const utilization = Number(utilMatch[1]);
        const memoryUsed = Number(memMatch[1]);
        const memoryTotal = Number(memMatch[2]);
        if ([temperature, utilization, memoryUsed, memoryTotal].some(isNaN)) return null;

        return {
            gpuName: gpuNameMatch ? gpuNameMatch[1].trim() : undefined,
            driverVersion: driverMatch ? driverMatch[1] : undefined,
            cudaVersion: cudaMatch ? cudaMatch[1] : undefined,
            temperature,
            utilization,
            memoryUsed,
            memoryTotal,
            memoryPercent: memoryTotal ? Math.round(memoryUsed / memoryTotal * 100) : 0,
            powerUsage: powerMatch ? Number(powerMatch[1]) : undefined,
            powerCap: powerMatch ? Number(powerMatch[2]) : undefined
        };
    }

    function renderGauges(container, data) {
        const existingGauge = container.querySelector('.gpu-status-gauge[data-gauge="GPU"]');
        if (existingGauge) {
            updateGaugeValues(container, data);
            return;
        }

        container.innerHTML = `
  ${createGauge('GPU', data.utilization, '%', '#6d9cff')}
  ${createGauge('Mem', data.memoryPercent, '%', '#4ade80', data)}
  ${createGauge('Temp', data.temperature, '°C', '#f97316')}
`;
    }

    function updateGaugeValues(container, data) {
        const gaugeData = [
            { label: 'GPU', value: data.utilization, unit: '%' },
            { label: 'Mem', value: data.memoryPercent, unit: '%', raw: data },
            { label: 'Temp', value: data.temperature, unit: '°C' }
        ];
        const r = 28;
        const circ = 2 * Math.PI * r;

        gaugeData.forEach(({ label, value, unit, raw }) => {
            const gaugeEl = container.querySelector(`.gpu-status-gauge[data-gauge="${label}"]`);
            if (!gaugeEl) return;

            const percent = Math.max(0, Math.min(100, value));
            const dash = circ * (percent / 100);
            const progress = gaugeEl.querySelector('.gpu-status-progress');
            if (progress) {
                progress.setAttribute('stroke-dasharray', `${dash} ${circ - dash}`);
            }

            const textEl = gaugeEl.querySelector('.gpu-status-value');
            if (textEl) {
                textEl.textContent = `${value}${unit}`;
            }

            let title = `${label}: ${value}${unit}`;
            if (label === 'Mem' && raw) {
                title += ` (${raw.memoryUsed}/${raw.memoryTotal} MB)`;
            }
            gaugeEl.setAttribute('title', title);
        });
    }

    async function loadGpuProcesses(processList) {
        try {
            const response = await fetch('/mod/gpu-status/gpu-processes.txt?cache=' + Date.now());
            if (!response.ok) {
                if (response.status === 404) {
                    processList.innerHTML = '<div class="gpu-process-loading">File gpu-processes.txt non trovato. Crea il file nella cartella della mod.</div>';
                    return;
                }
                throw new Error('HTTP ' + response.status);
            }
            const text = await response.text();
            const newHtml = renderProcessTable(text);
            if (processList.innerHTML !== newHtml) {
                processList.innerHTML = newHtml;
            }
        } catch (err) {
            processList.innerHTML = `<div class="gpu-process-loading">Impossibile caricare i processi: ${err.message}</div>`;
        }
    }

    function renderProcessTable(txt) {
        const lines = txt.trim().split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return '<i>Nessun processo GPU attivo.</i>';
        const splitPattern = /\t|,/;
        const headers = lines[0].split(splitPattern).map(h => h.trim());
        let html = '<table class="gpu-process-table"><thead><tr>';
        for (const h of headers) html += `<th>${h}</th>`;
        html += '</tr></thead><tbody>';
        for (let i = 1; i < lines.length; ++i) {
            const cols = lines[i].split(splitPattern).map(c => c.trim());
            html += '<tr>';
            for (const c of cols) html += `<td title="${c}">${c}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
    }

    function createGauge(label, value, unit, color, raw = null) {
        const percent = Math.max(0, Math.min(100, value));
        const r = 28;
        const circ = 2 * Math.PI * r;
        const dash = circ * (percent / 100);

        const iconSVGs = {
            'GPU':
                '<svg viewBox="0 0 24 24" width="18" height="18" style="margin-bottom:-2px;fill:#6d9cff"><path d="M17,7A2,2 0 0,1 19,9V15A2,2 0 0,1 17,17H7A2,2 0 0,1 5,15V9A2,2 0 0,1 7,7H17M16,9C15.45,9 15,9.45 15,10V14C15,14.55 15.45,15 16,15C16.55,15 17,14.55 17,14V10C17,9.45 16.55,9 16,9M8,9C7.45,9 7,9.45 7,10V14C7,14.55 7.45,15 8,15C8.55,15 9,14.55 9,14V10C9,9.45 8.55,9 8,9Z"/></svg>',
            'Mem':
                '<svg viewBox="0 0 24 24" width="18" height="18" style="margin-bottom:-2px;fill:#4ade80"><path d="M4 6h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4z"/></svg>',
            'Temp':
                '<svg viewBox="0 0 24 24" width="18" height="18" style="margin-bottom:-2px;fill:#f97316"><path d="M17 17.998a5 5 0 0 1-10 0v-7.169a7 7 0 1 1 10 0z"/></svg>',
        };

        let title = `${label}: ${value}${unit}`;
        if (label === 'Mem' && raw) {
            title += ` (${raw.memoryUsed}/${raw.memoryTotal} MB)`;
        }

        return `
<div class="gpu-status-gauge" data-gauge="${label}" title="${title}">
  <svg width="72" height="72" viewBox="0 0 72 72" class="gpu-status-svg">
    <defs>
      <linearGradient id="gauge_grad_${label}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="1" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08" />
      </linearGradient>
    </defs>
    <circle cx="36" cy="36" r="${r}" stroke="rgba(255,255,255,0.12)" stroke-width="11" fill="rgba(60,110,220,0.15)" />
    <circle
      cx="36" cy="36" r="${r}"
      class="gpu-status-progress"
      stroke="url(#gauge_grad_${label})"
      stroke-width="11"
      fill="none"
      stroke-dasharray="${dash} ${circ - dash}"
      stroke-linecap="round"
      style="filter: drop-shadow(0 1px 10px ${color}40);"
      transform="rotate(-90 36 36)" />
    <text class="gpu-status-value" x="36" y="43.5" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="700" style="font-family:inherit;">${value}${unit}</text>
  </svg>
  <div class="gpu-status-gauge-label">${iconSVGs[label] ?? ''}${label}</div>
</div>`;
    }

    const observer = new MutationObserver((mutations, observer) => {
        if (document.querySelector(observedAnchor)) {
            observer.disconnect();
            moduleFunction();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
