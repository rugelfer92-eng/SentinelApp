const express   = require('express');
const router    = express.Router();
const PDFDoc    = require('pdfkit');
const path      = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Sensor    = require('../models/sensor');
const Auditoria = require('../models/auditoria');
const Sesion    = require('../models/sesion');

// Ruta del logo (colócalo en tu proyecto, ej: /assets/icon.png)
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'icon.png');

const chartCanvas = new ChartJSNodeCanvas({
  width: 500, height: 140, backgroundColour: '#ffffff',
});

// ── Helper: rango de un día (en UTC, para que coincida con cómo Mongo
//    guarda las fechas y evitar corrimientos por la zona horaria del
//    servidor) ────────────────────────────────────────────────────
function rangoDia(fechaStr) {
  const [yyyy, mm, dd] = fechaStr.split('-').map(Number);
  const inicio = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));
  const fin = new Date(Date.UTC(yyyy, mm - 1, dd, 23, 59, 59, 999));
  return { inicio, fin };
}

// ── Helper: formato fecha legible ──────────────────────────────────
function fmt(date) {
  return new Date(date).toLocaleString('es-VE', {
    dateStyle: 'short', timeStyle: 'short', hour12: true,
  });
}

// "2026-07-27" -> "270726"
function ddmmaa(fechaStr) {
  const [yyyy, mm, dd] = fechaStr.split('-');
  return `${dd}${mm}${yyyy.slice(2)}`;
}

// hora (0-23), minuto (0-59) -> "02:05 PM"
function fmtHora12(hora24, minuto) {
  const periodo = hora24 >= 12 ? 'PM' : 'AM';
  let h12 = hora24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(minuto).padStart(2, '0')} ${periodo}`;
}

// bloque de hora h (0-23) -> "02:00 PM a 03:00 PM"
function fmtRangoBloque(h) {
  const finHora = (h + 1) % 24;
  return `${fmtHora12(h, 0)} a ${fmtHora12(finHora, 0)}`;
}

// ════════════════════════════════════════════════════════════════════
// SENSORES — diseño con bloques por hora, gráficas y tabla por minuto
// ════════════════════════════════════════════════════════════════════

// ── Agregación: promedio por minuto ────────────────────────────────
async function agregarPorMinuto(inicio, fin) {
  return Sensor.aggregate([
    { $match: { fecha: { $gte: inicio, $lte: fin } } },
    {
      $group: {
        _id: {
          hora:   { $hour: '$fecha' },
          minuto: { $minute: '$fecha' },
        },
        fecha:          { $first: '$fecha' },
        temperatura:    { $avg: '$temperatura' },
        temperaturaMin: { $min: '$temperatura' },
        temperaturaMax: { $max: '$temperatura' },
        humedad:        { $avg: '$humedad' },
        humedadMin:     { $min: '$humedad' },
        humedadMax:     { $max: '$humedad' },
        voltaje:        { $avg: '$voltaje' },
        voltajeMin:     { $min: '$voltaje' },
        voltajeMax:     { $max: '$voltaje' },
      },
    },
    { $sort: { '_id.hora': 1, '_id.minuto': 1 } },
  ]);
}

// ── Agrupar lecturas por minuto en bloques de hora (0-23) ──────────
function agruparPorHora(lecturasPorMinuto) {
  const bloques = {};
  lecturasPorMinuto.forEach((r) => {
    const h = r._id.hora;
    if (!bloques[h]) bloques[h] = [];
    bloques[h].push(r);
  });
  return bloques;
}

// ── Generar imagen de gráfica para un bloque de hora ───────────────
async function generarGraficaBloque(filas) {
  const labels = filas.map((f) => String(f._id.minuto).padStart(2, '0'));
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Voltaje',     data: filas.map(f => f.voltaje),     borderColor: '#e0a020', borderWidth: 1.5, pointRadius: 0 },
        { label: 'Temperatura', data: filas.map(f => f.temperatura), borderColor: '#378ADD', borderWidth: 1.5, pointRadius: 0 },
        { label: 'Humedad',     data: filas.map(f => f.humedad),     borderColor: '#639922', borderWidth: 1.5, pointRadius: 0 },
      ],
    },
    options: {
      responsive: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 9 } } } },
      scales: {
        x: { ticks: { maxTicksLimit: 12, font: { size: 7 } } },
        y: { ticks: { font: { size: 7 } } },
      },
    },
  };
  return chartCanvas.renderToBuffer(config);
}

// ── Tabla del reporte de sensores (fila por minuto) ─────────────────
function drawTablaSensores(doc, headers, rows, startY) {
  const colWidth  = (doc.page.width - 80) / headers.length;
  const rowHeight = 14;
  let   y         = startY;

  doc.font('Helvetica-Bold').fontSize(7);
  doc.rect(40, y, doc.page.width - 80, rowHeight).fill('#12263f');
  doc.fillColor('#ffffff');
  headers.forEach((h, i) => {
    const align = i === 0 ? 'left' : 'right';
    doc.text(h, 40 + i * colWidth + 4, y + 4, { width: colWidth - 8, align, ellipsis: true });
  });
  y += rowHeight;

  doc.font('Helvetica').fontSize(6.5);
  rows.forEach((row, idx) => {
    doc.rect(40, y, doc.page.width - 80, rowHeight)
       .fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff');
    doc.fillColor('#1e293b');
    row.forEach((cell, i) => {
      const align = i === 0 ? 'left' : 'right';
      doc.text(String(cell ?? '—'), 40 + i * colWidth + 4, y + 4, { width: colWidth - 8, align, ellipsis: true });
    });
    y += rowHeight;

    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 60;
    }
  });

  return y + 10;
}

// ── Encabezado con logo (compartido por ambos reportes) ──────────────
function dibujarEncabezado(doc, fecha, subtitulo) {
  doc.rect(0, 0, doc.page.width, 80).fill('#0b1d33');
  try {
    doc.image(LOGO_PATH, 24, 14, { width: 52, height: 52 });
  } catch (e) {
    console.warn('No se pudo cargar el logo:', e.message);
  }
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
     .text('Sentinel Cold', 88, 22);
  doc.font('Helvetica').fontSize(10).fillColor('#8fc6e8')
     .text(subtitulo, 88, 44);
  doc.font('Helvetica').fontSize(9).fillColor('#ffffff')
     .text(new Date(fecha + 'T12:00:00').toLocaleDateString('es-VE', {
       year: 'numeric', month: '2-digit', day: '2-digit',
     }), doc.page.width - 130, 22, { width: 100, align: 'right' });
  return 96;
}

async function generarReporteSensores(res, fecha) {
  const { inicio, fin } = rangoDia(fecha);

  const lecturas = await agregarPorMinuto(inicio, fin);
  const bloques  = agruparPorHora(lecturas);
  const horas    = Object.keys(bloques).map(Number).sort((a, b) => a - b);

  const doc = new PDFDoc({ margin: 40, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="sensores${ddmmaa(fecha)}.pdf"`);
  doc.pipe(res);

  let y = dibujarEncabezado(doc, fecha, 'Reporte diario de sensores');

  if (horas.length === 0) {
    doc.font('Helvetica').fontSize(12).fillColor('#64748b')
       .text('No se encontraron registros para esta fecha.', 40, y + 20, { align: 'center' });
  }

  for (const h of horas) {
    const filas = bloques[h];

    if (y > doc.page.height - 260) { doc.addPage(); y = 60; }

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b')
       .text(`Bloque N°${horas.indexOf(h) + 1} — ${fmtRangoBloque(h)}`, 40, y);
    y += 20;

    // Gráfica del bloque
    const chartBuffer = await generarGraficaBloque(filas);
    doc.image(chartBuffer, 40, y, { width: doc.page.width - 80 });
    y += 140;

    // Tabla del bloque (1 fila por minuto)
    y = drawTablaSensores(
      doc,
      ['Hora', 'Temp', 'TempMin', 'TempMax', 'Hum', 'HumMin', 'HumMax', 'Volt', 'VoltMin', 'VoltMax'],
      filas.map(f => [
        fmtHora12(h, f._id.minuto),
        f.temperatura?.toFixed(1),
        f.temperaturaMin?.toFixed(1),
        f.temperaturaMax?.toFixed(1),
        f.humedad?.toFixed(0),
        f.humedadMin?.toFixed(0),
        f.humedadMax?.toFixed(0),
        f.voltaje?.toFixed(1),
        f.voltajeMin?.toFixed(1),
        f.voltajeMax?.toFixed(1),
      ]),
      y
    );
    y += 16;
  }

  // Pie de página
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
       .text(`Sentinel Cold — Reporte generado automáticamente | Página ${i + 1} de ${pages.count}`,
         40, doc.page.height - 30, { align: 'center', width: doc.page.width - 80 });
  }

  doc.end();
}

// ════════════════════════════════════════════════════════════════════
// AUDITORÍA — diseño simple de tablas (sesiones + cambios)
// ════════════════════════════════════════════════════════════════════

// ── Tabla del reporte de auditoría ──────────────────────────────────
function drawTablaAuditoria(doc, headers, rows, startY) {
  const colWidth  = (doc.page.width - 80) / headers.length;
  const rowHeight = 20;
  let   y         = startY;

  // Cabecera
  doc.font('Helvetica-Bold').fontSize(8);
  doc.rect(40, y, doc.page.width - 80, rowHeight).fill('#1e3a8a');
  doc.fillColor('#ffffff');
  headers.forEach((h, i) => {
    doc.text(h, 40 + i * colWidth + 4, y + 6, { width: colWidth - 4, ellipsis: true });
  });
  y += rowHeight;

  // Filas
  doc.font('Helvetica').fontSize(7.5);
  rows.forEach((row, idx) => {
    doc.rect(40, y, doc.page.width - 80, rowHeight)
       .fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff');
    doc.fillColor('#1e293b');
    row.forEach((cell, i) => {
      doc.text(String(cell ?? '—'), 40 + i * colWidth + 4, y + 6,
        { width: colWidth - 4, ellipsis: true });
    });
    y += rowHeight;

    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 60;
    }
  });

  return y + 10;
}

// ── Encabezado de sección (reporte de auditoría) ─────────────────────
function sectionHeader(doc, title, y) {
  doc.rect(40, y, doc.page.width - 80, 24).fill('#2563eb');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
     .text(title, 48, y + 7);
  return y + 34;
}

async function generarReporteAuditoria(res, fecha) {
  const { inicio, fin } = rangoDia(fecha);

  const [auditorias, sesiones] = await Promise.all([
    Auditoria.find({ fecha: { $gte: inicio, $lte: fin } }).sort({ fecha: 1 }).lean(),
    Sesion.find({ fecha: { $gte: inicio, $lte: fin } }).sort({ fecha: 1 }).lean(),
  ]);

  const doc = new PDFDoc({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="auditoria${ddmmaa(fecha)}.pdf"`);
  doc.pipe(res);

  // ── Encabezado (mismo diseño que el reporte de sensores) ────────────
  let y = dibujarEncabezado(doc, fecha, 'Reporte de Auditoría (Sesiones y Cambios)');
  doc.font('Helvetica').fontSize(8).fillColor('#64748b')
     .text(`Generado: ${fmt(new Date())}  |  Tucape, Panadería`, 40, y,
       { width: doc.page.width - 80, align: 'right' });
  y += 20;

  // ── Resumen ────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b');
  const resumenItems = [
    `Sesiones de usuarios: ${sesiones.length}`,
    `Cambios del sistema:  ${auditorias.length}`,
  ];
  doc.rect(40, y, doc.page.width - 80, resumenItems.length * 18 + 14).fill('#eff6ff');
  doc.fillColor('#1e3a8a');
  resumenItems.forEach((item, i) => {
    doc.text(`• ${item}`, 52, y + 8 + i * 18);
  });
  y += resumenItems.length * 18 + 24;

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 1: SESIONES DE USUARIOS
  // ═══════════════════════════════════════════════════════════
  if (sesiones.length > 0) {
    if (y > doc.page.height - 200) { doc.addPage(); y = 60; }
    y = sectionHeader(doc, '🔐  CONEXIONES DE USUARIOS', y);
    y = drawTablaAuditoria(
      doc,
      ['Hora', 'Usuario', 'Cédula', 'Rol', 'Acción'],
      sesiones.map(s => [
        fmt(s.fecha),
        s.usuario?.nombre,
        s.usuario?.cedula,
        s.usuario?.role?.toUpperCase(),
        s.accion,
      ]),
      y
    );
    y += 10;
  }

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 2: CAMBIOS DEL SISTEMA
  // ═══════════════════════════════════════════════════════════
  if (auditorias.length > 0) {
    if (y > doc.page.height - 200) { doc.addPage(); y = 60; }
    y = sectionHeader(doc, '⚙️  CAMBIOS REALIZADOS EN EL SISTEMA', y);
    y = drawTablaAuditoria(
      doc,
      ['Hora', 'Usuario', 'Rol', 'Acción', 'Afectado'],
      auditorias.map(a => [
        fmt(a.fecha),
        a.realizadoPor?.nombre,
        a.realizadoPor?.role?.toUpperCase(),
        a.accion?.replace(/_/g, ' '),
        a.entidad?.nombre,
      ]),
      y
    );
  }

  // Sin datos
  if (sesiones.length === 0 && auditorias.length === 0) {
    doc.font('Helvetica').fontSize(12).fillColor('#64748b')
       .text('No se encontraron registros para esta fecha.', 40, y, { align: 'center' });
  }

  // ── Pie de página ─────────────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
       .text(
         `Sentinel Cold — Reporte generado automáticamente | Página ${i + 1} de ${pages.count}`,
         40, doc.page.height - 30, { align: 'center', width: doc.page.width - 80 }
       );
  }

  doc.end();
}

// ════════════════════════════════════════════════════════════════════
// RUTA ÚNICA
// ════════════════════════════════════════════════════════════════════

// ── GET /api/pdf/dia?fecha=YYYY-MM-DD&tipo=sensores|auditoria ──────
router.get('/dia', async (req, res) => {
  const { fecha, tipo } = req.query;

  if (!fecha) return res.status(400).json({ message: 'Parámetro fecha requerido (YYYY-MM-DD)' });
  if (tipo !== 'sensores' && tipo !== 'auditoria') {
    return res.status(400).json({ message: 'Parámetro tipo requerido: "sensores" o "auditoria"' });
  }

  try {
    if (tipo === 'sensores') {
      await generarReporteSensores(res, fecha);
    } else {
      await generarReporteAuditoria(res, fecha);
    }
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ message: 'Error al generar el PDF', error: err.message });
  }
});

module.exports = router;