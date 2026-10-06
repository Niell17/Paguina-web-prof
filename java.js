/* ==========================================================================
   SMARTPRO - Digitalización y Eficiencia Productiva Láctea
   JavaScript Application Core
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DATA STATE & STORE
  // --------------------------------------------------------------------------
  const appState = {
    theme: 'dark',
    recepciones: [
      {
        id: 'LOT-2026-089',
        proveedor: 'Coovamoras / San Isidro',
        volumen: 3200,
        temp: 4.2,
        acidez: 16.0,
        grasa: 3.7,
        proteina: 3.3,
        antibioticos: 'NEGATIVO',
        dictamen: 'GRADO A',
        pagoProductor: 2450,
        fecha: 'Hoy 06:45 AM'
      },
      {
        id: 'LOT-2026-090',
        proveedor: 'Asociación Los Andes',
        volumen: 4500,
        temp: 4.8,
        acidez: 17.0,
        grasa: 3.5,
        proteina: 3.1,
        antibioticos: 'NEGATIVO',
        dictamen: 'GRADO A',
        pagoProductor: 2300,
        fecha: 'Hoy 07:30 AM'
      },
      {
        id: 'LOT-2026-091',
        proveedor: 'Finca La Esmeralda',
        volumen: 1800,
        temp: 5.5,
        acidez: 17.5,
        grasa: 3.4,
        proteina: 3.0,
        antibioticos: 'NEGATIVO',
        dictamen: 'GRADO B',
        pagoProductor: 2200,
        fecha: 'Hoy 08:15 AM'
      },
      {
        id: 'LOT-2026-088',
        proveedor: 'Intermediario N.N.',
        volumen: 1200,
        temp: 9.2,
        acidez: 21.0,
        grasa: 3.1,
        proteina: 2.8,
        antibioticos: 'POSITIVO',
        dictamen: 'RECHAZADO',
        pagoProductor: 0,
        fecha: 'Ayer 04:20 PM'
      }
    ],
    nextLotNumber: 92,
    chartInstances: {}
  };

  // --------------------------------------------------------------------------
  // 2. INITIALIZATION
  // --------------------------------------------------------------------------
  initClock();
  initTabNavigation();
  initThemeToggle();
  initQualityCalculator();
  initTableRenderer();
  initModalLogic();
  initTraceability();
  initTelemetrySimulator();
  initFinanceCalculator();
  initReportGenerator();
  initCharts();

  // --------------------------------------------------------------------------
  // 3. LIVE CLOCK
  // --------------------------------------------------------------------------
  function initClock() {
    const clockEl = document.getElementById('liveClock');
    function updateTime() {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('es-CO');
      }
    }
    setInterval(updateTime, 1000);
    updateTime();
  }

  // --------------------------------------------------------------------------
  // 4. TAB NAVIGATION
  // --------------------------------------------------------------------------
  function initTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        navButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const pane = document.getElementById(targetTab);
        if (pane) {
          pane.classList.add('active');
        }

        // Trigger chart resize if navigating to charts tab
        if (targetTab === 'tab-dashboard' || targetTab === 'tab-finanzas') {
          setTimeout(() => {
            Object.values(appState.chartInstances).forEach(chart => chart && chart.resize());
          }, 100);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. THEME TOGGLE
  // --------------------------------------------------------------------------
  function initThemeToggle() {
    const toggleBtn = document.getElementById('btnThemeToggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun text-amber"></i>';
        appState.theme = 'light';
        showToast('Tema Claro activado', 'info');
      } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        appState.theme = 'dark';
        showToast('Tema Oscuro activado', 'info');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. CONTROL DE CALIDAD CALCULATOR
  // --------------------------------------------------------------------------
  function initQualityCalculator() {
    const btnCalcular = document.getElementById('btnCalcularCalidad');
    if (!btnCalcular) return;

    btnCalcular.addEventListener('click', () => {
      const temp = parseFloat(document.getElementById('calcTemp').value) || 0;
      const acidez = parseFloat(document.getElementById('calcAcidez').value) || 0;
      const grasa = parseFloat(document.getElementById('calcGrasa').value) || 0;
      const proteina = parseFloat(document.getElementById('calcProteina').value) || 0;
      const antibioticos = document.getElementById('calcAntibioticos').value;
      const mbrt = parseFloat(document.getElementById('calcMBRT').value) || 0;

      const evalRes = evaluarCalidad(temp, acidez, grasa, proteina, antibioticos, mbrt);

      const resultBox = document.getElementById('qualityResultBox');
      const badgeHeader = document.getElementById('evalBadgeHeader');
      const evalCat = document.getElementById('evalCat');
      const evalBonif = document.getElementById('evalBonif');
      const evalPagoFinal = document.getElementById('evalPagoFinal');

      resultBox.classList.remove('hidden');

      if (evalRes.dictamen === 'RECHAZADO') {
        badgeHeader.className = 'eval-badge-header bg-rose text-white';
        badgeHeader.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> RECHAZADO: ${evalRes.motivo}`;
        evalCat.textContent = 'NO APTO PARA PROCESAMIENTO';
        evalBonif.textContent = '$ 0 / L';
        evalPagoFinal.textContent = '$ 0 / L';
        showToast(`Lote Rechazado: ${evalRes.motivo}`, 'warning');
      } else {
        const isGradoA = evalRes.dictamen === 'GRADO A';
        badgeHeader.className = isGradoA ? 'eval-badge-header status-ok' : 'eval-badge-header status-warning';
        badgeHeader.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${evalRes.dictamen} EXCELENCIA`;
        evalCat.textContent = isGradoA ? 'Calidad Premium Solida' : 'Calidad Estándar B';
        evalBonif.textContent = `+$ ${evalRes.bonificacion} / L`;
        evalPagoFinal.textContent = `$ ${evalRes.pagoTotal.toLocaleString('es-CO')} / L`;
        showToast(`Evaluación: ${evalRes.dictamen} - Pago Justo $${evalRes.pagoTotal}/L`, 'success');
      }
    });
  }

  function evaluarCalidad(temp, acidez, grasa, proteina, antibioticos, mbrt) {
    if (antibioticos === 'POSITIVO') {
      return { dictamen: 'RECHAZADO', motivo: 'Presencia de Antibióticos', bonificacion: 0, pagoTotal: 0 };
    }
    if (acidez > 20.0) {
      return { dictamen: 'RECHAZADO', motivo: 'Acidez Excesiva (>20°D)', bonificacion: 0, pagoTotal: 0 };
    }
    if (temp > 8.0) {
      return { dictamen: 'RECHAZADO', motivo: 'Temperatura fuera de rango (>8°C)', bonificacion: 0, pagoTotal: 0 };
    }

    let basePrice = 2100;
    let bonif = 0;

    // Bonificación por materia grasa
    if (grasa >= 3.8) bonif += 200;
    else if (grasa >= 3.5) bonif += 100;

    // Bonificación por proteína
    if (proteina >= 3.3) bonif += 150;
    else if (proteina >= 3.1) bonif += 50;

    // Bonificación por Reductasa (MBRT)
    if (mbrt >= 5.0) bonif += 100;

    let dictamen = (acidez <= 17.5 && temp <= 6.0 && bonif >= 200) ? 'GRADO A' : 'GRADO B';
    let pagoTotal = basePrice + bonif;

    return { dictamen, motivo: 'Parámetros óptimos', bonificacion: bonif, pagoTotal };
  }

  // --------------------------------------------------------------------------
  // 7. TABLE RENDERER & SEARCH
  // --------------------------------------------------------------------------
  function initTableRenderer() {
    renderTable();

    const searchInput = document.getElementById('searchCalidad');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderTable(query);
      });
    }
  }

  function renderTable(filterQuery = '') {
    const tbody = document.getElementById('tbodyCalidad');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filtered = appState.recepciones.filter(r => 
      r.id.toLowerCase().includes(filterQuery) || 
      r.proveedor.toLowerCase().includes(filterQuery)
    );

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      
      let badgeClass = 'badge success';
      if (item.dictamen === 'GRADO B') badgeClass = 'badge warning';
      if (item.dictamen === 'RECHAZADO') badgeClass = 'badge status-warning';

      tr.innerHTML = `
        <td><strong>${item.id}</strong></td>
        <td>${item.proveedor}</td>
        <td>${item.volumen.toLocaleString('es-CO')} L</td>
        <td>${item.temp} °C</td>
        <td>${item.acidez} °D</td>
        <td>${item.grasa}% / ${item.proteina}%</td>
        <td><span class="${item.antibioticos === 'NEGATIVO' ? 'text-emerald' : 'text-rose'} font-weight-700">${item.antibioticos}</span></td>
        <td><span class="${badgeClass}">${item.dictamen}</span></td>
        <td>
          <button class="btn-sm btn-action outline btn-trace-item" data-id="${item.id}">
            <i class="fa-solid fa-timeline"></i> Trazar
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach trace button events
    document.querySelectorAll('.btn-trace-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        document.getElementById('inputTraceCode').value = id;
        document.querySelector('[data-tab="tab-trazabilidad"]').click();
        triggerTraceSearch(id);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 8. MODAL LOGIC FOR NEW RECEPCTION
  // --------------------------------------------------------------------------
  function initModalLogic() {
    const modal = document.getElementById('modalRecepcion');
    const btnOpen1 = document.getElementById('btnNuevoLote');
    const btnOpen2 = document.getElementById('btnAbrirModalForm');
    const btnClose = document.getElementById('btnCerrarModal');
    const btnCancel = document.getElementById('btnCancelarModal');
    const form = document.getElementById('formNuevoLote');

    function openModal() {
      const nextCode = `LOT-2026-0${appState.nextLotNumber}`;
      document.getElementById('modalLoteCode').value = nextCode;
      modal.classList.remove('hidden');
    }

    function closeModal() {
      modal.classList.add('hidden');
    }

    if (btnOpen1) btnOpen1.addEventListener('click', openModal);
    if (btnOpen2) btnOpen2.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const code = document.getElementById('modalLoteCode').value;
        const prov = document.getElementById('modalProveedor').value;
        const vol = parseFloat(document.getElementById('modalVolumen').value) || 0;
        const temp = parseFloat(document.getElementById('modalTemp').value) || 0;
        const acidez = parseFloat(document.getElementById('modalAcidez').value) || 0;
        const grasa = parseFloat(document.getElementById('modalGrasa').value) || 0;
        const proteina = parseFloat(document.getElementById('modalProteina').value) || 0;
        const antib = document.getElementById('modalAntibioticos').value;

        const evalRes = evaluarCalidad(temp, acidez, grasa, proteina, antib, 5.0);

        const newRecepcion = {
          id: code,
          proveedor: prov,
          volumen: vol,
          temp: temp,
          acidez: acidez,
          grasa: grasa,
          proteina: proteina,
          antibioticos: antib,
          dictamen: evalRes.dictamen,
          pagoProductor: evalRes.pagoTotal,
          fecha: 'Justo ahora'
        };

        appState.recepciones.unshift(newRecepcion);
        appState.nextLotNumber++;

        renderTable();
        updateDashboardMetrics();
        closeModal();

        showToast(`Lote ${code} registrado exitosamente (${evalRes.dictamen})`, 'success');
      });
    }
  }

  function updateDashboardMetrics() {
    let totalVol = appState.recepciones.reduce((acc, r) => acc + (r.dictamen !== 'RECHAZADO' ? r.volumen : 0), 0);
    const metricLeche = document.getElementById('metricLecheHoy');
    const kpiVol = document.getElementById('kpiVolumen');

    if (metricLeche) metricLeche.textContent = `${totalVol.toLocaleString('es-CO')} L`;
    if (kpiVol) kpiVol.textContent = `${totalVol.toLocaleString('es-CO')} L`;
  }

  // --------------------------------------------------------------------------
  // 9. TRAZABILIDAD ENGINE
  // --------------------------------------------------------------------------
  function initTraceability() {
    const btnSearch = document.getElementById('btnBuscarTrace');
    const inputCode = document.getElementById('inputTraceCode');

    if (btnSearch && inputCode) {
      btnSearch.addEventListener('click', () => {
        triggerTraceSearch(inputCode.value.trim());
      });
    }
  }

  function triggerTraceSearch(batchId) {
    const batchIdEl = document.getElementById('traceBatchId');
    const statusBadge = document.getElementById('traceStatusBadge');
    
    if (batchIdEl) batchIdEl.textContent = batchId;

    const found = appState.recepciones.find(r => r.id.toLowerCase() === batchId.toLowerCase());

    if (found) {
      if (statusBadge) {
        statusBadge.textContent = found.dictamen === 'RECHAZADO' ? 'LOTE RECHAZADO' : 'EN PROCESO / APROBADO';
        statusBadge.className = found.dictamen === 'RECHAZADO' ? 'badge warning' : 'badge success';
      }
      showToast(`Trazabilidad cargada para ${batchId}`, 'info');
    } else {
      if (statusBadge) {
        statusBadge.textContent = 'LOTE REGISTRADO SMARTPRO';
        statusBadge.className = 'badge info';
      }
      showToast(`Mostrando genealogy estándar para ${batchId}`, 'info');
    }
  }

  // --------------------------------------------------------------------------
  // 10. TELEMETRY & COLD ROOM SIMULATOR
  // --------------------------------------------------------------------------
  function initTelemetrySimulator() {
    const btnSim = document.getElementById('btnSimularSensores');
    const btnAlertaFrío = document.getElementById('btnSimularAlertaFrio');

    if (btnSim) {
      btnSim.addEventListener('click', () => {
        // Randomize temperatures slightly
        const t1 = (3.5 + Math.random() * 0.8).toFixed(1);
        const t2 = (4.0 + Math.random() * 0.6).toFixed(1);
        const t3 = (2.7 + Math.random() * 0.5).toFixed(1);

        document.getElementById('tempCamara1').textContent = t1;
        document.getElementById('tempCamara2').textContent = t2;
        document.getElementById('tempCamara3').textContent = t3;

        showToast('Lectura de sensores actualizada en tiempo real', 'success');
      });
    }

    if (btnAlertaFrío) {
      btnAlertaFrío.addEventListener('click', () => {
        const temp2El = document.getElementById('tempCamara2');
        const pill2 = document.getElementById('pillCamara2');

        if (temp2El) temp2El.textContent = '7.8';
        if (pill2) {
          pill2.textContent = 'ALERTA TÉRMICA';
          pill2.className = 'status-pill status-warning';
        }

        showToast('⚠️ Alerta Crítica: Cámara 02 superó los 6.0°C. Sistema de compresión auxiliar activado.', 'warning');
      });
    }
  }

  // --------------------------------------------------------------------------
  // 11. FINANCE CALCULATOR
  // --------------------------------------------------------------------------
  function initFinanceCalculator() {
    const btnCalc = document.getElementById('btnCalcularFinanzas');
    if (!btnCalc) return;

    btnCalc.addEventListener('click', () => {
      const prodSelect = document.getElementById('finProducto').value;
      const precioLeche = parseFloat(document.getElementById('finPrecioLeche').value) || 2400;
      const insumos = parseFloat(document.getElementById('finCostoInsumos').value) || 850;
      const energia = parseFloat(document.getElementById('finCostoEnergia').value) || 620;
      const manoObra = parseFloat(document.getElementById('finCostoManoObra').value) || 1100;

      let rendimientoLitros = 9.5; // Queso fresco por defecto
      if (prodSelect === 'queso_maduro') rendimientoLitros = 11.0;
      if (prodSelect === 'yogur') rendimientoLitros = 1.05;
      if (prodSelect === 'leche_env') rendimientoLitros = 1.01;

      const costoMP = Math.round(precioLeche * rendimientoLitros);
      const costosOps = Math.round(insumos + energia + manoObra);
      const costoTotal = costoMP + costosOps;
      const precioPueblo = Math.round(costoTotal * 1.08); // 8% margen social sustentable

      document.getElementById('resMP').textContent = `$ ${costoMP.toLocaleString('es-CO')}`;
      document.getElementById('resOps').textContent = `$ ${costosOps.toLocaleString('es-CO')}`;
      document.getElementById('resCostoTotal').textContent = `$ ${costoTotal.toLocaleString('es-CO')} / Unidad`;
      document.getElementById('resPrecioPueblo').textContent = `$ ${precioPueblo.toLocaleString('es-CO')} / Unidad`;

      showToast(`Estructura de Costos calculada para ${prodSelect.toUpperCase()}`, 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 12. REPORT GENERATOR (PRINT PREVIEW)
  // --------------------------------------------------------------------------
  function initReportGenerator() {
    const btnPrint = document.getElementById('btnImprimirReporte');
    if (!btnPrint) return;

    btnPrint.addEventListener('click', () => {
      const reportWindow = window.open('', '_blank');
      const totalVol = appState.recepciones.reduce((acc, r) => acc + (r.dictamen !== 'RECHAZADO' ? r.volumen : 0), 0);

      reportWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <title>Reporte de Gestión Planta Láctea - SMARTPRO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #06b6d4; padding-bottom: 15px; margin-bottom: 20px; }
            .slogan { color: #f59e0b; font-weight: bold; font-style: italic; }
            h1 { margin: 5px 0; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.8rem; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="slogan">“Acompañando al Pueblo con caridad y justicia social”</div>
            <h1>SMARTPRO - INFORME EJECUTIVO DE PLANTA LÁCTEA</h1>
            <p>Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}</p>
          </div>
          
          <h3>Resumen de Operación</h3>
          <ul>
            <li><strong>Litros Procesados Hoy:</strong> ${totalVol.toLocaleString('es-CO')} Litros</li>
            <li><strong>Lotes Evaluados:</strong> ${appState.recepciones.length} Lotes</li>
            <li><strong>Tasa de Inocuidad:</strong> 100% Verificada</li>
          </ul>

          <h3>Detalle de Recepción de Leche Cruda</h3>
          <table>
            <thead>
              <tr>
                <th>Código Lote</th>
                <th>Proveedor</th>
                <th>Volumen</th>
                <th>Dictamen</th>
                <th>Pago Justo / L</th>
              </tr>
            </thead>
            <tbody>
              ${appState.recepciones.map(r => `
                <tr>
                  <td>${r.id}</td>
                  <td>${r.proveedor}</td>
                  <td>${r.volumen} L</td>
                  <td>${r.dictamen}</td>
                  <td>$ ${r.pagoProductor.toLocaleString('es-CO')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Prototipo de Digitalización y Eficiencia Productiva SMARTPRO - Impulsando el Desarrollo Rural Solidario.
          </div>
        </body>
        </html>
      `);

      reportWindow.document.close();
      reportWindow.print();
    });
  }

  // --------------------------------------------------------------------------
  // 13. CHARTS INITIALIZATION (CHART.JS)
  // --------------------------------------------------------------------------
  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js no está cargado. Omitiendo renderizado de gráficos.');
      return;
    }

    // Chart 1: Flujo Diario de Leche vs Producción
    const ctx1 = document.getElementById('chartFlujoLeche');
    if (ctx1) {
      appState.chartInstances.flujo = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
          datasets: [
            {
              label: 'Leche Recibida (L)',
              data: [12500, 13800, 14200, 13900, 14500, 15100, 12800],
              backgroundColor: 'rgba(6, 182, 212, 0.7)',
              borderColor: '#06b6d4',
              borderWidth: 1,
              borderRadius: 6
            },
            {
              label: 'Procesada en Queso/Yogur (L)',
              data: [11000, 12500, 13000, 12800, 13200, 14000, 11500],
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } }
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    // Chart 2: Distribución de Productos Derivados
    const ctx2 = document.getElementById('chartProductosPie');
    if (ctx2) {
      appState.chartInstances.pie = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Queso Fresco', 'Leche Pasteurized', 'Yogur Bebible', 'Mantequilla', 'Queso Madurado'],
          datasets: [{
            data: [45, 25, 15, 8, 7],
            backgroundColor: [
              '#06b6d4',
              '#10b981',
              '#f59e0b',
              '#a855f7',
              '#3b82f6'
            ],
            borderWidth: 2,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } }
          }
        }
      });
    }

    // Chart 3: Finanzas Modelo Social vs Comercial
    const ctx3 = document.getElementById('chartFinanzas');
    if (ctx3) {
      appState.chartInstances.finanzas = new Chart(ctx3, {
        type: 'bar',
        data: {
          labels: ['Queso Campesino (Kg)', 'Leche Envasada (L)', 'Yogur Bebible (L)', 'Mantequilla (500g)'],
          datasets: [
            {
              label: 'Precio Modelo Social SMARTPRO ($)',
              data: [27400, 3800, 6200, 14500],
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderRadius: 6
            },
            {
              label: 'Precio Promedio Mercado Comercial ($)',
              data: [36000, 4800, 8500, 19000],
              backgroundColor: 'rgba(245, 158, 11, 0.8)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } }
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 14. TOAST NOTIFICATIONS SYSTEM
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-info-circle text-cyan';
    if (type === 'success') iconClass = 'fa-check-circle text-emerald';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle text-amber';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

});
