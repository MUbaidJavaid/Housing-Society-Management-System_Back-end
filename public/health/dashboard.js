(function () {
  const REFRESH_MS = 5000;

  const el = (id) => document.getElementById(id);

  const fmtMs = (n) => {
    if (n == null || Number.isNaN(n)) return '—';
    if (n < 1) return '<1 ms';
    if (n >= 1000) return (n / 1000).toFixed(2) + ' s';
    return Math.round(n) + ' ms';
  };

  const fmtNum = (n, digits) => {
    if (n == null || Number.isNaN(n)) return '—';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits ?? 0 });
  };

  const fmtUptime = (sec) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return d + 'd ' + h + 'h';
    if (h) return h + 'h ' + m + 'm';
    return m + 'm ' + (s % 60) + 's';
  };

  const tone = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'healthy' || value === 'ok' || value === 'connected' || value === 'operational') return 'ok';
    if (value === 'degraded' || value === 'warning') return 'warn';
    return 'bad';
  };

  const barClass = (percent) => {
    if (percent >= 90) return 'bar bad';
    if (percent >= 75) return 'bar warn';
    return 'bar';
  };

  function kpi(label, value, sub) {
    return (
      '<article class="kpi"><div class="label">' +
      label +
      '</div><div class="value">' +
      value +
      '</div><div class="sub">' +
      (sub || '') +
      '</div></article>'
    );
  }

  function metric(label, value) {
    return '<div class="metric"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  function progress(percent, left, right) {
    const width = Math.max(0, Math.min(100, percent || 0));
    return (
      '<div class="' +
      barClass(width) +
      '"><span style="width:' +
      width.toFixed(1) +
      '%"></span></div>' +
      '<div class="metric"><span>' +
      left +
      '</span><b>' +
      right +
      '</b></div>'
    );
  }

  function badge(status) {
    return '<span class="badge ' + tone(status) + '">' + (status || 'unknown') + '</span>';
  }

  function drawSparkline(values) {
    const canvas = el('latencyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, w, h);

    if (!values || values.length < 2) {
      ctx.fillStyle = '#8ea0bb';
      ctx.font = '14px Segoe UI, sans-serif';
      ctx.fillText('Waiting for API traffic…', 24, h / 2);
      return;
    }

    const max = Math.max.apply(null, values.concat([1]));
    ctx.beginPath();
    values.forEach(function (v, i) {
      const x = (i / (values.length - 1)) * (w - 24) + 12;
      const y = h - 16 - (v / max) * (h - 36);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3ee0b1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(62,224,177,0.22)');
    gradient.addColorStop(1, 'rgba(62,224,177,0)');
    ctx.lineTo(w - 12, h - 16);
    ctx.lineTo(12, h - 16);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function render(data) {
    const status = data.status || 'unknown';
    const pill = el('statusPill');
    pill.className = 'status-pill ' + (tone(status) === 'ok' ? '' : tone(status));
    el('statusLabel').textContent = (data.message || status).replace(/^./, function (c) { return c.toUpperCase(); });
    el('updatedAt').textContent = new Date(data.timestamp).toLocaleTimeString();

    const latency = (data.api && data.api.latency) || {};
    const mem = data.memory || {};
    const processMem = mem.process || {};
    const sysMem = mem.system || {};
    const cpu = data.cpu || {};
    const mongo = data.mongo || {};
    const server = data.server || {};
    const disk = data.disk;

    el('kpis').innerHTML = [
      kpi('Status', String(status).replace(/_/g, ' '), data.environment),
      kpi('Uptime', fmtUptime(server.processUptimeSec), 'process'),
      kpi('Heap', processMem.heapUsedLabel || '—', (processMem.heapPercent || 0).toFixed(1) + '% of heap'),
      kpi('Host RAM', sysMem.usedLabel || '—', (sysMem.usedPercent || 0).toFixed(1) + '% used'),
      kpi('API p95', fmtMs(latency.p95), fmtNum(data.api && data.api.totalRequests) + ' calls'),
      kpi('Req / min', fmtNum(data.api && data.api.requestsPerMinute, 1), 'error rate ' + fmtNum(data.api && data.api.errorRate, 2) + '%'),
    ].join('');

    drawSparkline((data.api && data.api.sparkline) || []);
    el('latencyStats').innerHTML = [
      ['Avg', fmtMs(latency.average)],
      ['p50', fmtMs(latency.p50)],
      ['p95', fmtMs(latency.p95)],
      ['p99', fmtMs(latency.p99)],
      ['Max', fmtMs(latency.max)],
    ]
      .map(function (item) {
        return '<div class="stat"><span>' + item[0] + '</span><b>' + item[1] + '</b></div>';
      })
      .join('');

    const statusCounts = (data.api && data.api.status) || {};
    el('trafficBody').innerHTML =
      metric('Total calls', fmtNum(data.api && data.api.totalRequests)) +
      metric('2xx', fmtNum(statusCounts['2xx'])) +
      metric('4xx / 5xx', fmtNum(statusCounts['4xx']) + ' / ' + fmtNum(statusCounts['5xx'])) +
      metric('Open handles', fmtNum(data.handles)) +
      metric('In-flight', fmtNum(data.activeRequests));

    el('processMemory').innerHTML =
      progress(processMem.heapPercent, processMem.heapUsedLabel + ' heap used', processMem.heapTotalLabel + ' total') +
      metric('RSS', processMem.rssLabel || '—') +
      metric('External', processMem.externalLabel || '—') +
      metric('RSS vs host', (processMem.rssPercentOfSystem || 0).toFixed(2) + '%');

    el('hostMemory').innerHTML =
      progress(sysMem.usedPercent, sysMem.usedLabel + ' used', sysMem.totalLabel + ' total') +
      metric('Free', sysMem.freeLabel || '—') +
      metric('Event loop', data.eventLoopDelay == null ? '—' : fmtMs(data.eventLoopDelay));

    el('cpuBody').innerHTML =
      progress(cpu.loadPercent, '1m load ' + fmtNum((cpu.loadAvg || [])[0], 2), cpu.cores + ' cores') +
      metric('5m / 15m', fmtNum((cpu.loadAvg || [])[1], 2) + ' / ' + fmtNum((cpu.loadAvg || [])[2], 2)) +
      metric('Process CPU user', fmtMs(cpu.processCpu && cpu.processCpu.userMs)) +
      metric('Model', (cpu.model || '—').split('@')[0].trim());

    if (disk) {
      el('diskBody').innerHTML =
        progress(disk.usedPercent, disk.usedLabel + ' used', disk.totalLabel + ' total') +
        metric('Free', disk.freeLabel) +
        metric('Mount', disk.path);
    } else {
      el('diskBody').innerHTML = '<p class="muted">Disk metrics unavailable on this host.</p>';
    }

    el('mongoBody').innerHTML =
      metric('State', String(mongo.state || 'unknown')) +
      metric('Ping', mongo.pingMs != null ? fmtMs(mongo.pingMs) : '—') +
      metric('Database', mongo.name || '—') +
      metric('Data size', mongo.dataSizeLabel || '—') +
      metric('Storage / indexes', (mongo.storageSizeLabel || '—') + ' / ' + (mongo.indexSizeLabel || '—')) +
      metric('Redis', (data.redis && data.redis.mode) || '—');

    el('runtimeBody').innerHTML =
      metric('Host', server.hostname || '—') +
      metric('PID', server.pid || '—') +
      metric('Node', server.node || '—') +
      metric('Platform', server.platform || '—') +
      metric('System uptime', fmtUptime(server.systemUptimeSec)) +
      metric('Overview cost', fmtMs(data.responseTime));

    el('checksBody').innerHTML = (data.checks || [])
      .map(function (check) {
        return (
          '<tr><td>' +
          (check.component || check.name) +
          '</td><td>' +
          badge(check.status) +
          '</td><td>' +
          (check.severity || '—') +
          '</td><td>' +
          fmtMs(check.duration) +
          '</td><td>' +
          (check.message || '') +
          '</td></tr>'
        );
      })
      .join('');

    el('recentBody').innerHTML = ((data.api && data.api.recent) || [])
      .slice(0, 12)
      .map(function (row) {
        return (
          '<tr><td class="path">' +
          row.method +
          ' ' +
          row.path +
          '</td><td>' +
          row.status +
          '</td><td>' +
          fmtMs(row.duration) +
          '</td></tr>'
        );
      })
      .join('') || '<tr><td colspan="3">No requests sampled yet.</td></tr>';

    el('footerMeta').textContent =
      (data.service || 'HSMS') + ' v' + (data.version || '1.0.0') + ' · pid ' + (server.pid || '—');
  }

  async function tick() {
    try {
      const res = await fetch('/health/overview', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      render(await res.json());
    } catch (error) {
      el('statusLabel').textContent = 'Unreachable';
      el('statusPill').className = 'status-pill bad';
      el('updatedAt').textContent = error.message;
    }
  }

  tick();
  setInterval(tick, REFRESH_MS);
})();
