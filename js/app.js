(function () {
  'use strict';

  var KEY = 'bml_data';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var TIPOS = ['Vacuna', 'Pediatra', 'Control de peso y talla', 'Análisis', 'Otro'];
  var CLASE_TIPO = { 'Vacuna': 'c-menta', 'Pediatra': 'c-rosa', 'Control de peso y talla': 'c-amarillo', 'Análisis': 'c-celeste', 'Otro': 'c-lila' };
  var AVISOS = [
    { v: 'no', t: 'Sin aviso' },
    { v: '0', t: 'A la hora de la cita' },
    { v: '60', t: '1 hora antes' },
    { v: '1440', t: '1 día antes' }
  ];

  var ICO = {
    mas: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
    crec: '<svg viewBox="0 0 24 24"><path d="M4 19h16M7 19V9M12 19V5M17 19v-7"/></svg>',
    cita: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    med: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9 9.5l6 5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>',
    ok: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    pausa: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
    luna: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    sol: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>',
    hito: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    atras: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    hist: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    bebe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="11" r=".6"/><circle cx="15" cy="11" r=".6"/><path d="M9.5 15c1.4 1 3.6 1 5 0M12 4c1-1.5 2.5-1.5 3 0"/></svg>'
  };

  var estado = cargar();
  var pestana = 'crecimiento';
  var modalCb = null;
  var toastT = null;

  function $(id) { return document.getElementById(id); }

  /* ---------- datos ---------- */
  function porDefecto() {
    return { perfil: { nombre: '', nacimiento: '', visto: false }, medidas: [], citas: [], meds: [], sig: 1, unidad: 'kg', hitos: [], tema: 'auto' };
  }
  function arr(x) { return Object.prototype.toString.call(x) === '[object Array]' ? x : []; }
  function cargar() {
    try {
      var t = localStorage.getItem(KEY);
      if (!t) return porDefecto();
      var o = JSON.parse(t);
      var d = porDefecto();
      if (o && typeof o === 'object') {
        if (o.perfil) {
          d.perfil.nombre = String(o.perfil.nombre || '');
          d.perfil.nacimiento = String(o.perfil.nacimiento || '');
          d.perfil.visto = !!o.perfil.visto;
        }
        d.medidas = arr(o.medidas);
        d.citas = arr(o.citas);
        d.meds = arr(o.meds);
        d.sig = (typeof o.sig === 'number' && o.sig > 0) ? o.sig : 1;
        d.unidad = o.unidad === 'lb' ? 'lb' : 'kg';
        d.hitos = arr(o.hitos);
        d.tema = (o.tema === 'claro' || o.tema === 'oscuro') ? o.tema : 'auto';
      }
      return d;
    } catch (e) { return porDefecto(); }
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(estado)); }
    catch (e) { toast('No se pudo guardar en el teléfono'); }
  }
  function buscar(lista, id) {
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) return lista[i]; }
    return null;
  }
  function quitar(lista, id) { return lista.filter(function (x) { return x.id !== id; }); }

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hoyISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function horaAhora() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function parseF(s) {
    var p = String(s || '').split('-');
    if (p.length !== 3) return null;
    var o = { y: +p[0], m: +p[1], d: +p[2] };
    if (!o.y || !o.m || !o.d) return null;
    return o;
  }
  function fmtF(s) { var p = parseF(s); return p ? p.d + ' ' + MESES[p.m - 1] + ' ' + p.y : ''; }
  function dt(fecha, hora) {
    var p = parseF(fecha);
    if (!p) return null;
    var h = String(hora || '00:00').split(':');
    return new Date(p.y, p.m - 1, p.d, +h[0] || 0, +h[1] || 0, 0, 0);
  }
  function fmtDT(ms) {
    var d = new Date(ms);
    return d.getDate() + ' ' + MESES[d.getMonth()] + ', ' + horaMs(ms);
  }
  function diasMes(y, m) { return new Date(y, m, 0).getDate(); }
  function edadEn(fecha) {
    var n = parseF(estado.perfil.nacimiento), f = parseF(fecha);
    if (!n || !f) return '';
    var meses = (f.y - n.y) * 12 + (f.m - n.m), dias = f.d - n.d;
    if (dias < 0) {
      meses--;
      var pm = f.m - 1, py = f.y;
      if (pm < 1) { pm = 12; py--; }
      dias += diasMes(py, pm);
    }
    if (meses < 0) return '';
    return meses + ' m ' + dias + ' d';
  }
  function num(s) {
    var t = String(s == null ? '' : s).replace(',', '.').trim();
    if (t === '') return null;
    var v = parseFloat(t);
    return isFinite(v) ? v : null;
  }
  function fmtNum(v, dec) {
    if (v == null) return '—';
    return String(Math.round(v * Math.pow(10, dec)) / Math.pow(10, dec));
  }
  var LB = 2.2046226218;
  function aUnidad(kg) { return estado.unidad === 'lb' ? kg * LB : kg; }
  function deUnidad(v) { return estado.unidad === 'lb' ? v / LB : v; }
  function decPeso() { return estado.unidad === 'lb' ? 2 : 3; }
  function opciones(lista, sel) {
    return lista.map(function (x) {
      var v = typeof x === 'string' ? x : x.v, t = typeof x === 'string' ? x : x.t;
      return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }
  function toast(t) {
    var el = $('toast');
    el.textContent = t;
    el.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ---------- ventana emergente ---------- */
  function abrirModal(titulo, cuerpo, textoOk, cb, sinCancelar) {
    $('modalTitulo').textContent = titulo;
    $('modalCuerpo').innerHTML = cuerpo;
    $('modalOk').textContent = textoOk || 'Guardar';
    $('modalCancelar').hidden = !!sinCancelar;
    $('modalError').textContent = '';
    modalCb = cb;
    $('modal').hidden = false;
  }
  function cerrarModal() { $('modal').hidden = true; modalCb = null; }
  function errorModal(t) { $('modalError').textContent = t; return false; }
  function confirmar(texto, cb) {
    abrirModal('Confirmar', '<p>' + esc(texto) + '</p>', 'Eliminar', function () { cb(); });
  }

  /* ---------- vistas ---------- */
  function vacio(titulo, texto) {
    return '<div class="vacio">' + ICO.bebe + '<strong>' + esc(titulo) + '</strong>' + esc(texto) + '</div>';
  }
  function btn(accion, id, icono, texto, extra) {
    return '<button type="button" class="acc ' + (extra || '') + '" data-acc="' + accion + '" data-id="' + id + '">' + icono + esc(texto) + '</button>';
  }
  function difPrevio(lista, i, campo, dec) {
    var v = lista[i][campo];
    if (v == null) return '';
    for (var j = i + 1; j < lista.length; j++) {
      if (lista[j][campo] != null) {
        var d = v - lista[j][campo];
        if (campo === 'peso') d = aUnidad(d);
        return (d > 0 ? '+' : '') + fmtNum(d, dec);
      }
    }
    return '';
  }

  function vistaCrecimiento() {
    var l = estado.medidas.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : (a.fecha > b.fecha ? -1 : 0); });
    if (!l.length) return vacio('Aún no hay medidas', 'Toca + para anotar peso y altura.');
    var h = '';
    for (var i = 0; i < l.length; i++) {
      var m = l[i], e = edadEn(m.fecha);
      h += '<div class="tarjeta c-celeste"><div class="fila"><span class="titulo">' + esc(fmtF(m.fecha)) + '</span>' +
        (e ? '<span class="chip">' + esc(e) + '</span>' : '') + '</div>' +
        '<div class="datos">' +
        '<div class="dato"><span class="et">Peso</span><span class="val">' + (m.peso != null ? esc(fmtNum(aUnidad(m.peso), decPeso())) + ' ' + estado.unidad : '—') + '</span><small>' + esc(difPrevio(l, i, 'peso', decPeso())) + '</small></div>' +
        '<div class="dato"><span class="et">Altura</span><span class="val">' + (m.altura != null ? esc(fmtNum(m.altura, 1)) + ' cm' : '—') + '</span><small>' + esc(difPrevio(l, i, 'altura', 1)) + '</small></div>' +
        '</div>' +
        (m.notas ? '<p class="nota">' + esc(m.notas) + '</p>' : '') +
        '<div class="acciones">' + btn('ed-medida', m.id, ICO.edit, 'Editar') + btn('del-medida', m.id, ICO.del, 'Eliminar') + '</div></div>';
    }
    return h;
  }

  function claveCita(c) { return c.fecha + ' ' + (c.hora || '00:00'); }
  function isoDe(ms) { var d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function lineaCita(c) {
    return esc(fmtF(c.fecha)) + (c.hora ? ', ' + esc(fmtHora12(c.hora)) : '') + (c.lugar ? ' · ' + esc(c.lugar) : '');
  }

  function tarjetaCita(c) {
    var av = '';
    for (var i = 0; i < AVISOS.length; i++) { if (AVISOS[i].v === c.aviso && c.aviso !== 'no') av = AVISOS[i].t; }
    return '<div class="desliza"><div class="acc-atras">' +
      '<button type="button" class="ed" data-acc="ed-cita" data-id="' + c.id + '">' + ICO.edit + 'Editar</button>' +
      '<button type="button" class="el" data-acc="del-cita" data-id="' + c.id + '">' + ICO.del + 'Eliminar</button></div>' +
      '<div class="tarjeta ' + (CLASE_TIPO[c.tipo] || 'c-lila') + '" data-sw="1">' +
      '<div class="fila"><span class="titulo">' + esc(c.tipo) + (c.motivo ? ' · ' + esc(c.motivo) : '') + '</span></div>' +
      '<div class="sub">' + lineaCita(c) + '</div>' +
      (av ? '<div class="sub">Aviso: ' + esc(av) + '</div>' : '') +
      (c.notas ? '<p class="nota">' + esc(c.notas) + '</p>' : '') +
      '<div class="acciones">' + btn('hecha-cita', c.id, ICO.ok, 'Marcar hecha', 'fuerte') + '</div></div></div>';
  }
  function vistaCitas() {
    var hechas = estado.citas.filter(function (c) { return c.hecha; }).length;
    var h = '<button type="button" class="hist-btn" data-acc="hist-citas">' + ICO.hist + '<span>Historial de citas</span><span class="chip">' + hechas + '</span></button>';
    var pend = estado.citas.filter(function (c) { return !c.hecha; });
    if (!pend.length) return h + vacio('Sin citas pendientes', 'Toca + para agregar vacunas, visitas al pediatra y más.');
    var hoy = hoyISO();
    var prox = pend.filter(function (c) { return c.fecha >= hoy; }).sort(function (a, b) { return claveCita(a) < claveCita(b) ? -1 : 1; });
    var venc = pend.filter(function (c) { return c.fecha < hoy; }).sort(function (a, b) { return claveCita(a) < claveCita(b) ? -1 : 1; });
    if (prox.length) { h += '<div class="seccion">Próximas</div>'; prox.forEach(function (c) { h += tarjetaCita(c); }); }
    if (venc.length) { h += '<div class="seccion">Vencidas sin marcar</div>'; venc.forEach(function (c) { h += tarjetaCita(c); }); }
    return h + '<p class="aviso">Desliza una cita hacia la izquierda para editarla o eliminarla.</p>';
  }

  /* ---------- historial de citas hechas ---------- */
  var histCitas = false;
  var swAbierto = null;
  function cerrarSwipe() {
    if (swAbierto) { swAbierto.style.transform = ''; swAbierto = null; }
  }
  function abrirHistCitas() { histCitas = true; $('hcitas').hidden = false; $('hcitas').innerHTML = ''; pintarHistCitas(); }
  function cerrarHistCitas() { histCitas = false; $('hcitas').hidden = true; }
  function tarjetaHecha(c) {
    return '<div class="tarjeta ' + (CLASE_TIPO[c.tipo] || 'c-lila') + '">' +
      '<div class="fila"><span class="titulo">' + esc(c.motivo || c.tipo) + '</span></div>' +
      '<div class="sub">' + lineaCita(c) + '</div>' +
      (c.hechaEn ? '<div class="sub">Marcada como hecha el ' + esc(fmtF(isoDe(c.hechaEn))) + '</div>' : '') +
      (c.notas ? '<p class="nota">' + esc(c.notas) + '</p>' : '') +
      '<div class="acciones">' + btn('reabrir-cita', c.id, ICO.play, 'Reabrir') + btn('del-cita', c.id, ICO.del, 'Eliminar') + '</div></div>';
  }
  function pintarHistCitas() {
    var el = $('hcitas'), prev = el.querySelector('.det-cuerpo'), y = prev ? prev.scrollTop : 0;
    var hechas = estado.citas.filter(function (c) { return c.hecha; });
    var cuerpo = '';
    if (!hechas.length) {
      cuerpo = vacio('Aún no hay citas hechas', 'Cuando marques una cita como hecha, se guardará aquí.');
    } else {
      TIPOS.forEach(function (tipo) {
        var g = hechas.filter(function (c) { return c.tipo === tipo; }).sort(function (a, b) {
          return (b.hechaEn || (dt(b.fecha, b.hora || '00:00') || 0).valueOf()) - (a.hechaEn || (dt(a.fecha, a.hora || '00:00') || 0).valueOf());
        });
        if (!g.length) return;
        cuerpo += '<div class="grupo-cab"><span class="titulo">' + esc(tipo) + '</span><span class="chip">' + g.length + '</span></div>';
        g.forEach(function (c) { cuerpo += tarjetaHecha(c); });
      });
    }
    el.innerHTML = '<div class="det-cab"><button type="button" class="icbtn" data-acc="cerrar-hc" aria-label="Volver">' + ICO.atras + '</button>' +
      '<div class="det-tit"><div class="titulo">Historial de citas</div><div class="sub">' + hechas.length + (hechas.length === 1 ? ' cita hecha' : ' citas hechas') + ' · por tipo</div></div></div>' +
      '<div class="det-cuerpo">' + cuerpo + '</div>';
    var cp = el.querySelector('.det-cuerpo');
    if (cp) cp.scrollTop = y;
  }

  function proxima(m) {
    var d0 = dt(m.inicio, m.hora);
    if (!d0 || !(m.cada > 0)) return null;
    var t0 = d0.getTime(), iv = m.cada * 3600000, ahora = Date.now();
    var fin = m.dias > 0 ? t0 + m.dias * 86400000 : Infinity;
    var t = t0;
    if (t < ahora) t = t0 + Math.ceil((ahora - t0) / iv) * iv;
    return t < fin ? t : null;
  }
  function horaMs(ms) {
    var d = new Date(ms);
    return fmtHora12(pad(d.getHours()) + ':' + pad(d.getMinutes()));
  }
  function mismoDia(a, b) {
    var x = new Date(a), y = new Date(b);
    return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  }
  function difDias(ms) {
    var d = new Date(ms), h = new Date();
    var a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var b = new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime();
    return Math.round((a - b) / 86400000);
  }
  function fmtDia(ms) {
    var x = difDias(ms);
    if (x === 0) return 'hoy';
    if (x === 1) return 'mañana';
    if (x === -1) return 'ayer';
    var d = new Date(ms);
    return d.getDate() + ' ' + MESES[d.getMonth()];
  }
  function diaTitulo(ms) {
    var x = difDias(ms);
    if (x === 0) return 'Hoy';
    if (x === -1) return 'Ayer';
    var d = new Date(ms);
    return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
  }
  function cuando(ms, ref) { return mismoDia(ms, ref) ? horaMs(ms) : fmtDia(ms) + ' ' + horaMs(ms); }
  function fmtDur(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), r = min % 60;
    return r ? h + ' h ' + r + ' min' : h + ' h';
  }
  function normDosis(x) { return typeof x === 'number' ? { t: x, p: null } : x; }
  function programadaCerca(m, t) {
    var d0 = dt(m.inicio, m.hora);
    if (!d0 || !(m.cada > 0)) return null;
    var t0 = d0.getTime(), iv = m.cada * 3600000;
    var k = Math.round((t - t0) / iv);
    if (k < 0) k = 0;
    var p = t0 + k * iv;
    if (m.dias > 0 && p >= t0 + m.dias * 86400000) return null;
    return p;
  }
  function diffDosis(t, p) {
    if (p == null) return { txt: '', cls: '' };
    var d = Math.round((t - p) / 60000);
    if (Math.abs(d) <= 10) return { txt: 'A tiempo', cls: 'ok' };
    return d > 0 ? { txt: fmtDur(d) + ' tarde', cls: 'tarde' } : { txt: fmtDur(-d) + ' antes', cls: 'antes' };
  }
  function ultimaDosis(m) {
    var u = null;
    (m.registro || []).forEach(function (r) {
      var x = normDosis(r);
      if (!u || x.t > u.t) u = x;
    });
    return u;
  }
  function textoEstado(m) {
    if (!m.activo) return 'En pausa';
    var p = proxima(m);
    return p ? 'Próxima ' + fmtDia(p) + ' ' + horaMs(p) : 'Terminado';
  }

  function vistaMedicinas() {
    if (!estado.meds.length) return vacio('Sin medicamentos', 'Toca + para agregar uno con su dosis y horario.') + '<p class="aviso">Anota solo lo que indique el pediatra.</p>';
    var h = '';
    estado.meds.forEach(function (m) {
      var ult = ultimaDosis(m);
      h += '<div class="tarjeta c-lila med' + (m.activo ? '' : ' pasada') + '">' +
        '<div class="fila"><span class="titulo">' + esc(m.nombre) + '</span><span class="chip est">' + esc(textoEstado(m)) + '</span></div>' +
        '<div class="med-res">' + esc(m.dosis) + ' · cada ' + esc(fmtNum(m.cada, 1)) + ' h</div>' +
        '<div class="sub">' + (ult ? 'Última: ' + esc(fmtDia(ult.t) + ' ' + horaMs(ult.t)) : 'Aún sin dosis registradas') + '</div>' +
        (m.notas ? '<div class="nota-1">' + esc(m.notas) + '</div>' : '') +
        '<div class="acciones">' + btn('dada-med', m.id, ICO.ok, 'Dada ahora', 'fuerte grande') + btn('hist-med', m.id, ICO.hist, 'Historial', 'grande') + '</div></div>';
    });
    return h + '<p class="aviso">Anota solo lo que indique el pediatra. La app no calcula dosis.</p>';
  }

  /* ---------- pantalla de historial de dosis ---------- */
  var detalleId = null;
  function abrirDetalle(id) {
    detalleId = id;
    $('detalle').hidden = false;
    $('detalle').innerHTML = '';
    pintarDetalle();
  }
  function cerrarDetalle() {
    detalleId = null;
    $('detalle').hidden = true;
  }
  function pintarDetalle() {
    var m = detalleId === null ? null : buscar(estado.meds, detalleId);
    if (!m) { cerrarDetalle(); return; }
    var el = $('detalle'), prev = el.querySelector('.det-cuerpo'), y = prev ? prev.scrollTop : 0;
    var d0 = dt(m.inicio, m.hora), t0 = d0 ? d0.getTime() : 0;
    var fin = m.dias > 0 && t0 ? 'Termina: ' + fmtDT(t0 + m.dias * 86400000) : 'Sin fecha de fin';
    var lista = (m.registro || []).map(function (r, i) {
      var x = normDosis(r);
      return { t: x.t, p: x.p == null ? programadaCerca(m, x.t) : x.p, i: i };
    }).sort(function (a, b) { return b.t - a.t; });
    var filas = '', diaPrev = '';
    lista.forEach(function (x) {
      var dia = diaTitulo(x.t);
      if (dia !== diaPrev) { filas += '<div class="seccion">' + esc(dia) + '</div>'; diaPrev = dia; }
      var df = diffDosis(x.t, x.p);
      filas += '<div class="dosis"><div class="info"><div class="hora">Dada ' + esc(horaMs(x.t)) + '</div>' +
        (x.p != null ? '<div class="sub">Le tocaba ' + esc(cuando(x.p, x.t)) + '</div>' : '') + '</div>' +
        (df.txt ? '<span class="chip ' + df.cls + '">' + esc(df.txt) + '</span>' : '') +
        '<button type="button" class="mini" aria-label="Quitar este registro" data-acc="del-dosis" data-id="' + m.id + '" data-i="' + x.i + '">' + ICO.del + '</button></div>';
    });
    if (!lista.length) filas = vacio('Aún no hay dosis', 'Toca "Registrar dosis ahora" cuando se la des.');
    el.innerHTML =
      '<div class="det-cab"><button type="button" class="icbtn" data-acc="cerrar-det" aria-label="Volver">' + ICO.atras + '</button>' +
      '<div class="det-tit"><div class="titulo">' + esc(m.nombre) + '</div><div class="sub">' + esc(m.dosis) + ' · cada ' + esc(fmtNum(m.cada, 1)) + ' h</div></div></div>' +
      '<div class="det-cuerpo"><div class="tarjeta c-lila med">' +
      '<div class="fila"><span class="titulo">' + esc(textoEstado(m)) + '</span></div>' +
      '<div class="sub">Inicio: ' + esc(fmtF(m.inicio)) + ', ' + esc(fmtHora12(m.hora)) + '</div>' +
      '<div class="sub">' + esc(fin) + '</div>' +
      (m.notas ? '<p class="nota">' + esc(m.notas) + '</p>' : '') +
      '<div class="acciones">' + btn('ed-med', m.id, ICO.edit, 'Editar') +
      btn('pausa-med', m.id, m.activo ? ICO.pausa : ICO.play, m.activo ? 'Pausar' : 'Activar') +
      btn('del-med', m.id, ICO.del, 'Eliminar') + '</div></div>' +
      '<div class="seccion">Dosis registradas (' + lista.length + ')</div>' + filas + '</div>' +
      '<div class="det-pie"><button type="button" class="pri" data-acc="dada-med" data-id="' + m.id + '">Registrar dosis ahora</button></div>';
    var cp = el.querySelector('.det-cuerpo');
    if (cp) cp.scrollTop = y;
  }

  function render() {
    $('cabNombre').textContent = estado.perfil.nombre || 'Mi bebé';
    var e = edadEn(hoyISO());
    $('cabEdad').textContent = e || (estado.perfil.nacimiento ? '' : 'Toca para agregar su nacimiento');
    var ub = $('btnUnidad');
    if (ub) ub.innerHTML = '<span class="u' + (estado.unidad === 'kg' ? ' act' : '') + '">kg</span><span class="u' + (estado.unidad === 'lb' ? ' act' : '') + '">lb</span>';
    var h = pestana === 'crecimiento' ? vistaCrecimiento() : (pestana === 'citas' ? vistaCitas() : (pestana === 'hitos' ? vistaHitos() : vistaMedicinas()));
    swAbierto = null;
    $('contenido').innerHTML = h;
    var g = $('grafica');
    g.hidden = pestana !== 'crecimiento';
    if (!g.hidden) g.innerHTML = htmlGrafica();
    var tabs = document.querySelectorAll('.nav button');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].className = tabs[i].getAttribute('data-tab') === pestana ? 'activo' : '';
    }
    if (detalleId !== null) pintarDetalle();
    if (histCitas) pintarHistCitas();
    $('fab').setAttribute('aria-label', pestana === 'crecimiento' ? 'Agregar medida' : (pestana === 'citas' ? 'Agregar cita' : (pestana === 'hitos' ? 'Agregar hito' : 'Agregar medicamento')));
  }

  /* ---------- gráfica fija ---------- */
  var metrica = 'peso';
  function fmtCorta(s) { var p = parseF(s); return p ? p.d + ' ' + MESES[p.m - 1] + ' ' + String(p.y).slice(2) : ''; }
  function chipGrafica(m, texto) {
    return '<button type="button" class="g-chip' + (metrica === m ? ' act' : '') + '" data-m="' + m + '">' + texto + '</button>';
  }
  function htmlGrafica() {
    var campo = metrica, esPeso = campo === 'peso', lb = estado.unidad === 'lb';
    var unidad = esPeso ? estado.unidad : 'cm', dec = esPeso ? 2 : 1;
    var pts = estado.medidas.filter(function (m) { return m[campo] != null && dt(m.fecha); })
      .sort(function (a, b) { return a.fecha < b.fecha ? -1 : (a.fecha > b.fecha ? 1 : 0); });
    var vals = pts.map(function (p) { return esPeso ? aUnidad(p.peso) : p.altura; });
    var color = esPeso ? '#ED6956' : '#7C9DBB';
    var h = '<div class="g-cab"><div class="g-tabs">' + chipGrafica('peso', 'Peso') + chipGrafica('altura', 'Altura') + '</div>';
    if (pts.length > 1) {
      var d = vals[vals.length - 1] - vals[0];
      h += '<span class="g-res">' + (d > 0 ? '+' : '') + fmtNum(d, dec) + ' ' + unidad + ' en total</span>';
    }
    h += '</div>';
    if (!pts.length) return h + '<div class="g-vacio">Anota la primera medida para ver la gráfica.</div>';

    var W = 320, H = 140, L = 38, R = 12, T = 20, B = 26, ph = H - T - B, n = pts.length;
    var a = L + 16, b = W - R - 16;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var minimo = esPeso ? (lb ? 0.5 : 0.2) : 1;
    if (max - min < minimo) { var c = (max + min) / 2; min = c - minimo; max = c + minimo; }
    else { var colchon = (max - min) * 0.14; min -= colchon; max += colchon; }
    if (min < 0) min = 0;
    var t0 = dt(pts[0].fecha).getTime(), t1 = dt(pts[n - 1].fecha).getTime();
    function X(p) { return t1 === t0 ? (a + b) / 2 : a + (dt(p.fecha).getTime() - t0) / (t1 - t0) * (b - a); }
    function Y(v) { return T + ph - (v - min) / (max - min) * ph; }

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfica de ' + campo + '">';
    for (var i = 0; i < 3; i++) {
      var gv = min + (max - min) * i / 2, gy = Y(gv).toFixed(1);
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" class="g-grid"/>' +
        '<text class="gtxt" x="' + (L - 5) + '" y="' + (+gy + 4) + '" text-anchor="end">' + fmtNum(gv, 1) + '</text>';
    }
    var xs = pts.map(function (p) { return X(p).toFixed(1); });
    var ys = vals.map(function (v) { return Y(v).toFixed(1); });
    if (n > 1) {
      var base = (T + ph).toFixed(1), linea = '', area = 'M' + xs[0] + ',' + base;
      for (var k = 0; k < n; k++) { linea += xs[k] + ',' + ys[k] + ' '; area += ' L' + xs[k] + ',' + ys[k]; }
      area += ' L' + xs[n - 1] + ',' + base + ' Z';
      s += '<path d="' + area + '" fill="' + color + '" opacity="0.15"/>' +
        '<polyline points="' + linea + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    for (var j = 0; j < n; j++) {
      s += '<circle cx="' + xs[j] + '" cy="' + ys[j] + '" r="4" style="fill:var(--blanco)" stroke="' + color + '" stroke-width="2"/>';
      if (n <= 5 || j === 0 || j === n - 1) {
        s += '<text class="gtxt val" x="' + xs[j] + '" y="' + (ys[j] - 9) + '" text-anchor="middle">' + fmtNum(vals[j], dec) + '</text>';
      }
    }
    if (n > 1) {
      s += '<text class="gtxt" x="' + L + '" y="' + (H - 7) + '" text-anchor="start">' + esc(fmtCorta(pts[0].fecha)) + '</text>' +
        '<text class="gtxt" x="' + (W - R) + '" y="' + (H - 7) + '" text-anchor="end">' + esc(fmtCorta(pts[n - 1].fecha)) + '</text>';
    } else {
      s += '<text class="gtxt" x="' + ((a + b) / 2) + '" y="' + (H - 7) + '" text-anchor="middle">' + esc(fmtCorta(pts[0].fecha)) + '</text>';
    }
    return h + s + '</svg>';
  }

  /* ---------- recordatorios ---------- */
  function reprogramar(pedir) {
    if (!window.NativeNotif) {
      if (pedir) toast('Los recordatorios funcionan en la app instalada');
      return;
    }
    var lista = [], ahora = Date.now(), horizonte = ahora + 3 * 86400000;
    var quien = estado.perfil.nombre || 'tu bebé';
    estado.citas.forEach(function (c) {
      if (c.hecha || !c.aviso || c.aviso === 'no') return;
      var t = dt(c.fecha, c.hora || '09:00');
      if (!t) return;
      var ms = t.getTime() - (parseInt(c.aviso, 10) || 0) * 60000;
      if (ms > ahora + 5000) {
        lista.push({ id: 1000000000 + c.id, title: 'Cita: ' + c.tipo, body: quien + ' · ' + fmtF(c.fecha) + (c.hora ? ', ' + fmtHora12(c.hora) : '') + (c.lugar ? ' · ' + c.lugar : ''), at: ms });
      }
    });
    estado.meds.forEach(function (m) {
      if (!m.activo || !(m.cada > 0)) return;
      var d0 = dt(m.inicio, m.hora);
      if (!d0) return;
      var t0 = d0.getTime(), iv = m.cada * 3600000;
      var fin = m.dias > 0 ? t0 + m.dias * 86400000 : Infinity;
      var t = t0, k = 0;
      if (t < ahora) t = t0 + Math.ceil((ahora - t0) / iv) * iv;
      while (t <= horizonte && t < fin && k < 150) {
        if (t > ahora + 5000) lista.push({ id: m.id * 1000 + k, title: 'Medicina: ' + m.nombre, body: 'Dosis: ' + m.dosis + ' · ' + quien, at: t });
        t += iv; k++;
      }
    });
    lista.sort(function (a, b) { return a.at - b.at; });
    lista = lista.slice(0, 200);
    var paso = pedir ? window.NativeNotif.permiso(true) : Promise.resolve(true);
    paso.then(function (ok) {
      if (!ok) {
        if (pedir) toast('Activa las notificaciones de la app en los ajustes del teléfono');
        return;
      }
      return window.NativeNotif.reprogramar(lista);
    }).catch(function () {});
  }

  /* ---------- selectores propios de fecha y hora ---------- */
  var MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  var S = { tipo: '', target: '', opc: false, y: 0, m: 0, fecha: '', h: 9, mi: 0 };
  var ALTO = 44;

  function fmtHora12(v) {
    if (!v) return 'Sin hora';
    var p = String(v).split(':'), h = +p[0] || 0, m = +p[1] || 0;
    return ((h % 12) || 12) + ':' + pad(m) + (h >= 12 ? ' p. m.' : ' a. m.');
  }
  var LISTAS = {};
  function campoLista(id, items, valor, titulo) {
    var norm = items.map(function (x) { return typeof x === 'string' ? { v: x, t: x } : x; });
    var txt = valor;
    norm.forEach(function (x) { if (x.v === valor) txt = x.t; });
    LISTAS[id] = { items: norm, titulo: titulo };
    return '<input type="hidden" id="' + id + '" value="' + esc(valor) + '">' +
      '<button type="button" class="sel con-flecha" id="' + id + '_b" data-pick="lista" data-target="' + id + '" data-opc="0">' + esc(txt) + '</button>';
  }
  function listaOpciones() {
    var items = LISTAS[S.target].items;
    return '<div class="lista">' + items.map(function (x) {
      return '<button type="button" class="op' + (x.v === S.valor ? ' elegida' : '') + '" data-sel="op" data-v="' + esc(x.v) + '"><span>' + esc(x.t) + '</span><i class="radio"></i></button>';
    }).join('') + '</div>';
  }
  function campoFecha(id, valor, opc) {
    return '<input type="hidden" id="' + id + '" value="' + esc(valor) + '">' +
      '<button type="button" class="sel" id="' + id + '_b" data-pick="fecha" data-target="' + id + '" data-opc="' + (opc ? 1 : 0) + '">' + esc(valor ? fmtF(valor) : 'Elegir fecha') + '</button>';
  }
  function campoHora(id, valor, opc) {
    return '<input type="hidden" id="' + id + '" value="' + esc(valor) + '">' +
      '<button type="button" class="sel" id="' + id + '_b" data-pick="hora" data-target="' + id + '" data-opc="' + (opc ? 1 : 0) + '">' + esc(fmtHora12(valor)) + '</button>';
  }

  function calendario() {
    var primero = new Date(S.y, S.m - 1, 1).getDay(), n = diasMes(S.y, S.m), hoy = hoyISO();
    var h = '<div class="cal-cab">' +
      '<button type="button" class="flecha" data-sel="anio-" aria-label="Año anterior">«</button>' +
      '<button type="button" class="flecha" data-sel="mes-" aria-label="Mes anterior">‹</button>' +
      '<span class="cal-tit">' + MESES_L[S.m - 1] + ' ' + S.y + '</span>' +
      '<button type="button" class="flecha" data-sel="mes+" aria-label="Mes siguiente">›</button>' +
      '<button type="button" class="flecha" data-sel="anio+" aria-label="Año siguiente">»</button></div>' +
      '<div class="cal-sem">' + DIAS.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="cal-dias">';
    for (var i = 0; i < primero; i++) h += '<span></span>';
    for (var d = 1; d <= n; d++) {
      var iso = S.y + '-' + pad(S.m) + '-' + pad(d);
      h += '<button type="button" class="dia' + (iso === S.fecha ? ' elegido' : '') + (iso === hoy ? ' hoy' : '') + '" data-sel="dia" data-v="' + iso + '">' + d + '</button>';
    }
    return h + '</div>';
  }
  function ruedas() {
    var hs = '', ms = '', i;
    for (i = 1; i <= 12; i++) hs += '<div class="it">' + i + '</div>';
    for (i = 0; i < 60; i++) ms += '<div class="it">' + pad(i) + '</div>';
    return '<div class="ruedas"><div class="banda"></div>' +
      '<div class="rueda" id="rH">' + hs + '</div><div class="dospuntos">:</div>' +
      '<div class="rueda" id="rM">' + ms + '</div>' +
      '<div class="rueda rp" id="rP"><div class="it">a. m.</div><div class="it">p. m.</div></div></div>';
  }
  function marcarRueda(el) {
    var i = Math.round(el.scrollTop / ALTO), items = el.children;
    for (var k = 0; k < items.length; k++) items[k].className = k === i ? 'it act' : 'it';
  }
  function posicionarRuedas() {
    var cfg = [['rH', ((S.h % 12) || 12) - 1], ['rM', S.mi], ['rP', S.h >= 12 ? 1 : 0]];
    cfg.forEach(function (c) {
      var el = $(c[0]);
      el.scrollTop = c[1] * ALTO;
      marcarRueda(el);
      el.addEventListener('scroll', function () {
        var me = this;
        if (me.__raf) return;
        me.__raf = requestAnimationFrame(function () { me.__raf = 0; marcarRueda(me); });
      });
    });
  }
  function leerRueda(id, max) {
    return Math.max(0, Math.min(max, Math.round($(id).scrollTop / ALTO)));
  }
  function pintarSelector() {
    $('selCuerpo').innerHTML = S.tipo === 'lista' ? listaOpciones() : (S.tipo === 'fecha' ? calendario() : ruedas());
    if (S.tipo === 'hora') posicionarRuedas();
  }
  function abrirSelector(tipo, target, opc) {
    var v = $(target).value;
    S.tipo = tipo; S.target = target; S.opc = opc;
    if (tipo === 'lista') {
      S.valor = v;
      $('selTitulo').textContent = LISTAS[target].titulo;
    } else if (tipo === 'fecha') {
      var p = parseF(v) || parseF(hoyISO());
      S.y = p.y; S.m = p.m; S.fecha = v || '';
      $('selTitulo').textContent = 'Elige la fecha';
    } else {
      var q = String(v || '09:00').split(':');
      S.h = +q[0] || 0; S.mi = +q[1] || 0;
      $('selTitulo').textContent = 'Elige la hora';
    }
    $('selBorrar').hidden = !opc || tipo === 'lista';
    $('selOk').hidden = tipo === 'lista';
    $('selector').hidden = false;
    pintarSelector();
  }
  function cerrarSelector() { $('selector').hidden = true; }
  function accionSelector(a, v) {
    if (a === 'cancelar') { cerrarSelector(); return; }
    if (a === 'op') {
      var it = LISTAS[S.target].items, txt = v;
      it.forEach(function (x) { if (x.v === v) txt = x.t; });
      $(S.target).value = v;
      $(S.target + '_b').textContent = txt;
      cerrarSelector();
      return;
    }
    if (a === 'dia') { S.fecha = v; pintarSelector(); return; }
    if (a === 'mes-') { S.m--; if (S.m < 1) { S.m = 12; S.y--; } pintarSelector(); return; }
    if (a === 'mes+') { S.m++; if (S.m > 12) { S.m = 1; S.y++; } pintarSelector(); return; }
    if (a === 'anio-') { S.y--; pintarSelector(); return; }
    if (a === 'anio+') { S.y++; pintarSelector(); return; }
    var val = '';
    if (a === 'ok') {
      if (S.tipo === 'fecha') {
        if (!S.fecha) { cerrarSelector(); return; }
        val = S.fecha;
      } else {
        var ih = leerRueda('rH', 11), im = leerRueda('rM', 59), ip = leerRueda('rP', 1);
        val = pad(((ih + 1) % 12) + (ip ? 12 : 0)) + ':' + pad(im);
      }
    }
    $(S.target).value = val;
    $(S.target + '_b').textContent = S.tipo === 'fecha' ? (val ? fmtF(val) : 'Elegir fecha') : fmtHora12(val);
    cerrarSelector();
  }

  /* ---------- formularios ---------- */
  function formPerfil() {
    var p = estado.perfil;
    var h = '<label>Nombre del bebé<input type="text" id="f_nombre" maxlength="40" value="' + esc(p.nombre) + '"></label>' +
      '<label>Fecha de nacimiento' + campoFecha('f_nac', p.nacimiento, true) + '</label>' +
      '<label>Apariencia' + campoLista('f_tema', TEMAS, estado.tema, 'Apariencia') + '</label>';
    abrirModal('Datos del bebé', h, 'Guardar', function () {
      var nac = $('f_nac').value;
      if (nac && nac > hoyISO()) return errorModal('La fecha de nacimiento no puede ser futura.');
      estado.perfil.nombre = $('f_nombre').value.trim();
      estado.perfil.nacimiento = nac;
      estado.perfil.visto = true;
      estado.tema = $('f_tema').value;
      aplicarTema();
      guardar(); render(); reprogramar(false);
    });
  }

  function formMedida(id) {
    var m = id ? buscar(estado.medidas, id) : null;
    var h = '<label>Fecha' + campoFecha('f_fecha', m ? m.fecha : hoyISO(), false) + '</label>' +
      '<div class="dos"><label>Peso (' + estado.unidad + ')<input type="text" inputmode="decimal" id="f_peso" placeholder="' + (estado.unidad === 'lb' ? '7.50' : '3.450') + '" value="' + esc(m && m.peso != null ? fmtNum(aUnidad(m.peso), decPeso()) : '') + '"></label>' +
      '<label>Altura (cm)<input type="text" inputmode="decimal" id="f_alt" placeholder="50.5" value="' + esc(m && m.altura != null ? m.altura : '') + '"></label></div>' +
      '<label>Notas (opcional)<textarea id="f_notas" maxlength="300">' + esc(m ? m.notas : '') + '</textarea></label>';
    abrirModal(m ? 'Editar medida' : 'Nueva medida', h, 'Guardar', function () {
      var fecha = $('f_fecha').value, peso = num($('f_peso').value), alt = num($('f_alt').value);
      if (peso !== null) peso = Math.round(deUnidad(peso) * 10000) / 10000;
      if (!fecha) return errorModal('Elige la fecha.');
      if (peso === null && alt === null) return errorModal('Anota al menos el peso o la altura.');
      if (peso !== null && (peso <= 0 || peso > 40)) return errorModal('Revisa el peso: el valor no parece correcto.');
      if (alt !== null && (alt <= 0 || alt > 150)) return errorModal('Revisa la altura: debe estar entre 0 y 150 cm.');
      var o = m || { id: estado.sig++ };
      o.fecha = fecha; o.peso = peso; o.altura = alt; o.notas = $('f_notas').value.trim();
      if (!m) estado.medidas.push(o);
      guardar(); render(); toast('Medida guardada');
    });
  }

  function formCita(id) {
    var c = id ? buscar(estado.citas, id) : null;
    var h = '<label>Tipo' + campoLista('f_tipo', TIPOS, c ? c.tipo : 'Pediatra', 'Tipo de cita') + '</label>' +
      '<label>Detalle (opcional, ej. nombre de la vacuna)<input type="text" id="f_motivo" maxlength="60" value="' + esc(c ? c.motivo : '') + '"></label>' +
      '<div class="dos"><label>Fecha' + campoFecha('f_fecha', c ? c.fecha : hoyISO(), false) + '</label>' +
      '<label>Hora' + campoHora('f_hora', c ? (c.hora || '') : '09:00', true) + '</label></div>' +
      '<label>Lugar (opcional)<input type="text" id="f_lugar" maxlength="60" value="' + esc(c ? c.lugar : '') + '"></label>' +
      '<label>Recordatorio' + campoLista('f_aviso', AVISOS, c ? c.aviso : '1440', 'Recordatorio') + '</label>' +
      '<label>Notas (opcional)<textarea id="f_notas" maxlength="300">' + esc(c ? c.notas : '') + '</textarea></label>';
    abrirModal(c ? 'Editar cita' : 'Nueva cita', h, 'Guardar', function () {
      var fecha = $('f_fecha').value, hora = $('f_hora').value, aviso = $('f_aviso').value;
      if (!fecha) return errorModal('Elige la fecha.');
      if (aviso !== 'no' && !hora) return errorModal('Para el recordatorio necesito la hora de la cita.');
      var o = c || { id: estado.sig++, hecha: false };
      o.tipo = $('f_tipo').value; o.motivo = $('f_motivo').value.trim(); o.fecha = fecha; o.hora = hora;
      o.lugar = $('f_lugar').value.trim(); o.aviso = aviso; o.notas = $('f_notas').value.trim();
      if (!c) estado.citas.push(o);
      guardar(); render(); toast('Cita guardada');
      reprogramar(aviso !== 'no');
    });
  }

  function formMed(id) {
    var m = id ? buscar(estado.meds, id) : null;
    var h = '<label>Medicamento<input type="text" id="f_nombre" maxlength="60" value="' + esc(m ? m.nombre : '') + '"></label>' +
      '<label>Dosis indicada (ej. 2.5 ml)<input type="text" id="f_dosis" maxlength="40" value="' + esc(m ? m.dosis : '') + '"></label>' +
      '<label>Cada cuántas horas<input type="text" inputmode="decimal" id="f_cada" placeholder="8" value="' + esc(m ? m.cada : '') + '"></label>' +
      '<div class="dos"><label>Primera dosis (día)' + campoFecha('f_inicio', m ? m.inicio : hoyISO(), false) + '</label>' +
      '<label>Hora' + campoHora('f_hora', m ? m.hora : horaAhora(), false) + '</label></div>' +
      '<label>Duración en días (vacío = sin fecha de fin)<input type="text" inputmode="numeric" id="f_dias" placeholder="7" value="' + esc(m && m.dias > 0 ? m.dias : '') + '"></label>' +
      '<label>Notas (opcional)<textarea id="f_notas" maxlength="300">' + esc(m ? m.notas : '') + '</textarea></label>';
    abrirModal(m ? 'Editar medicamento' : 'Nuevo medicamento', h, 'Guardar', function () {
      var nombre = $('f_nombre').value.trim(), dosis = $('f_dosis').value.trim(), cada = num($('f_cada').value);
      var inicio = $('f_inicio').value, hora = $('f_hora').value, dias = num($('f_dias').value);
      if (!nombre) return errorModal('Escribe el nombre del medicamento.');
      if (!dosis) return errorModal('Escribe la dosis que indicó el pediatra.');
      if (cada === null || cada < 0.5 || cada > 72) return errorModal('Las horas entre dosis deben estar entre 0.5 y 72.');
      if (!inicio || !hora) return errorModal('Elige el día y la hora de la primera dosis.');
      if (dias !== null && (dias < 1 || dias > 365)) return errorModal('La duración debe ser de 1 a 365 días, o déjala vacía.');
      var o = m || { id: estado.sig++, activo: true, registro: [] };
      o.nombre = nombre; o.dosis = dosis; o.cada = cada; o.inicio = inicio; o.hora = hora;
      o.dias = dias === null ? 0 : Math.round(dias); o.notas = $('f_notas').value.trim();
      if (!m) estado.meds.push(o);
      guardar(); render(); toast('Medicamento guardado');
      reprogramar(true);
    });
  }

  /* ---------- acciones ---------- */
  function accion(a, id, idx) {
    var o;
    if (a === 'ed-medida') formMedida(id);
    else if (a === 'del-medida') confirmar('¿Eliminar esta medida?', function () { estado.medidas = quitar(estado.medidas, id); guardar(); render(); });
    else if (a === 'ed-cita') formCita(id);
    else if (a === 'del-cita') confirmar('¿Eliminar esta cita?', function () { estado.citas = quitar(estado.citas, id); guardar(); render(); reprogramar(false); });
    else if (a === 'hecha-cita') {
      o = buscar(estado.citas, id);
      if (o) { o.hecha = true; o.hechaEn = Date.now(); guardar(); render(); reprogramar(false); toast('Cita guardada en el historial'); }
    }
    else if (a === 'reabrir-cita') {
      o = buscar(estado.citas, id);
      if (o) { o.hecha = false; delete o.hechaEn; guardar(); render(); reprogramar(false); toast('La cita volvió a pendientes'); }
    }
    else if (a === 'hist-citas') abrirHistCitas();
    else if (a === 'ed-hito') formHito(id);
    else if (a === 'del-hito') confirmar('¿Eliminar este hito?', function () { estado.hitos = quitar(estado.hitos, id); guardar(); render(); });
    else if (a === 'cerrar-hc') cerrarHistCitas();
    else if (a === 'ed-med') formMed(id);
    else if (a === 'del-med') confirmar('¿Eliminar este medicamento y su historial?', function () { cerrarDetalle(); estado.meds = quitar(estado.meds, id); guardar(); render(); reprogramar(false); });
    else if (a === 'hist-med') abrirDetalle(id);
    else if (a === 'cerrar-det') cerrarDetalle();
    else if (a === 'del-dosis') {
      confirmar('¿Quitar este registro de dosis?', function () {
        var q = buscar(estado.meds, id);
        if (q && q.registro && idx >= 0 && idx < q.registro.length) { q.registro.splice(idx, 1); guardar(); render(); }
      });
    }
    else if (a === 'pausa-med') { o = buscar(estado.meds, id); if (o) { o.activo = !o.activo; guardar(); render(); reprogramar(o.activo); } }
    else if (a === 'dada-med') {
      o = buscar(estado.meds, id);
      if (o) {
        if (!o.registro) o.registro = [];
        var ahoraT = Date.now();
        o.registro.push({ t: ahoraT, p: programadaCerca(o, ahoraT) });
        while (o.registro.length > 300) o.registro.shift();
        guardar(); render(); toast('Dosis registrada');
      }
    }
  }

  /* ---------- PDF ---------- */
  function tabla(cab, filas) {
    if (!filas.length) return '<p style="color:#7A7288">Sin registros.</p>';
    var h = '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr>';
    cab.forEach(function (c) { h += '<th style="text-align:left;background:#F3A9B0;padding:6px;border:1px solid #F2DDE0">' + esc(c) + '</th>'; });
    h += '</tr>';
    filas.forEach(function (f) {
      h += '<tr style="page-break-inside:avoid">';
      f.forEach(function (c) { h += '<td style="padding:6px;border:1px solid #F2DDE0;vertical-align:top">' + esc(c) + '</td>'; });
      h += '</tr>';
    });
    return h + '</table>';
  }
  function crearPDF() {
    if (typeof window.html2pdf !== 'function') { toast('No se pudo cargar el creador de PDF'); return; }
    var p = estado.perfil, u = estado.unidad;
    function cmp(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }
    var med = estado.medidas.slice().sort(function (a, b) { return cmp(a.fecha, b.fecha); });
    var pend = estado.citas.filter(function (c) { return !c.hecha; }).sort(function (a, b) { return cmp(claveCita(a), claveCita(b)); });
    var hechas = estado.citas.filter(function (c) { return c.hecha; });
    var hitos = estado.hitos.slice().sort(function (a, b) { return cmp(a.fecha, b.fecha); });
    function t2(t) { return '<h2 style="font-size:16px;margin:18px 0 6px;color:#3A2F3F;border-bottom:3px solid #F3A9B0;padding-bottom:3px">' + esc(t) + '</h2>'; }
    function t3(t) { return '<h3 style="font-size:13px;margin:12px 0 4px;color:#C9503E">' + esc(t) + '</h3>'; }
    function fh(c) { return fmtF(c.fecha) + (c.hora ? ' ' + fmtHora12(c.hora) : ''); }
    function cuandoPdf(ms) { return fmtF(isoDe(ms)) + ' ' + horaMs(ms); }

    var h = '<div style="box-sizing:border-box;width:700px;padding:4px 8px;font-family:Nunito,Arial,sans-serif;color:#3A2F3F;background-color:#fff;background-image:url(\'' + MARCA_PDF + '\');background-size:700px 1020.5px;background-repeat:repeat-y;background-position:0 0">' +
      '<h1 style="margin:0 0 4px;font-size:22px">Baby Medical List</h1>' +
      '<div style="font-size:14px">' + esc(p.nombre || 'Bebé') + (p.nacimiento ? ' · Nació el ' + esc(fmtF(p.nacimiento)) : '') + '</div>' +
      '<div style="font-size:12px;color:#7B6F80;margin-bottom:6px">Reporte generado el ' + esc(fmtF(hoyISO())) + '</div>';

    h += t2('Crecimiento') + tabla(['Fecha', 'Edad', 'Peso (' + u + ')', 'Altura (cm)', 'Notas'], med.map(function (m) {
      return [fmtF(m.fecha), edadEn(m.fecha), m.peso != null ? fmtNum(aUnidad(m.peso), decPeso()) : '—', m.altura != null ? fmtNum(m.altura, 1) : '—', m.notas || ''];
    }));

    h += t2('Citas pendientes') + tabla(['Fecha', 'Tipo', 'Lugar', 'Notas'], pend.map(function (c) {
      return [fh(c), c.tipo + (c.motivo ? ' · ' + c.motivo : ''), c.lugar || '', c.notas || ''];
    }));

    h += t2('Historial de citas hechas');
    if (!hechas.length) {
      h += '<p style="font-size:12px;color:#7B6F80">Sin citas hechas todavía.</p>';
    } else {
      TIPOS.forEach(function (tipo) {
        var g = hechas.filter(function (c) { return c.tipo === tipo; }).sort(function (a, b) { return (b.hechaEn || 0) - (a.hechaEn || 0); });
        if (!g.length) return;
        h += t3(tipo + ' (' + g.length + ')') + tabla(['Fecha de la cita', 'Detalle', 'Lugar', 'Marcada hecha', 'Notas'], g.map(function (c) {
          return [fh(c), c.motivo || '', c.lugar || '', c.hechaEn ? fmtF(isoDe(c.hechaEn)) : '—', c.notas || ''];
        }));
      });
    }

    h += t2('Medicamentos') + tabla(['Medicamento', 'Dosis', 'Cada', 'Inicio', 'Duración', 'Estado', 'Notas'], estado.meds.map(function (m) {
      return [m.nombre, m.dosis, fmtNum(m.cada, 1) + ' h', fmtF(m.inicio) + ' ' + fmtHora12(m.hora), m.dias > 0 ? m.dias + ' días' : 'Sin fecha de fin', textoEstado(m), m.notas || ''];
    }));
    estado.meds.forEach(function (m) {
      var todas = (m.registro || []).map(normDosis).sort(function (a, b) { return b.t - a.t; });
      if (!todas.length) return;
      var regs = todas.slice(0, 100);
      h += t3('Registro de dosis · ' + m.nombre + (todas.length > regs.length ? ' (últimas ' + regs.length + ')' : ' (' + regs.length + ')')) +
        tabla(['Dada', 'Le tocaba', 'Diferencia'], regs.map(function (x) {
          var pr = x.p == null ? programadaCerca(m, x.t) : x.p;
          return [cuandoPdf(x.t), pr != null ? cuandoPdf(pr) : '—', diffDosis(x.t, pr).txt || '—'];
        }));
    });

    h += t2('Hitos del bebé') + tabla(['Fecha', 'Edad', 'Hito'], hitos.map(function (x) {
      return [fmtF(x.fecha), edadEn(x.fecha), tituloHito(x) + (x.tipo !== 'Otro' && x.detalle ? ' · ' + x.detalle : '')];
    }));

    h += '<p style="font-size:11px;color:#7B6F80;margin-top:18px">Registro llevado por la familia. No sustituye las indicaciones del pediatra.</p></div>';

    var cont = document.createElement('div');
    cont.style.cssText = 'position:absolute;left:0;top:0;z-index:-1;background:#fff';
    cont.innerHTML = h;
    document.body.appendChild(cont);
    toast('Creando PDF...');
    var nombre = 'Baby-Medical-List-' + hoyISO() + '.pdf';
    window.html2pdf().set({
      margin: 10, filename: nombre, image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h2', 'h3'] }
    }).from(cont.firstChild).outputPdf('datauristring').then(function (uri) {
      var b64 = String(uri).split(',')[1];
      if (cont.parentNode) cont.parentNode.removeChild(cont);
      if (typeof window.NativeShare === 'function') {
        return window.NativeShare(b64, nombre);
      }
      var a = document.createElement('a');
      a.href = uri; a.download = nombre;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }).catch(function () {
      if (cont.parentNode) cont.parentNode.removeChild(cont);
      toast('No se pudo crear el PDF');
    });
  }

  /* ---------- apariencia (claro / oscuro) ---------- */
  var TEMAS = [{ v: 'auto', t: 'Automática (como el teléfono)' }, { v: 'claro', t: 'Clara' }, { v: 'oscuro', t: 'Oscura' }];
  function temaEfectivo() {
    if (estado.tema === 'auto') {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'oscuro' : 'claro';
    }
    return estado.tema;
  }
  function aplicarTema() {
    var t = temaEfectivo();
    document.documentElement.setAttribute('data-tema', t);
    var b = $('btnTema');
    if (b) {
      b.innerHTML = t === 'oscuro' ? ICO.sol : ICO.luna;
      b.setAttribute('aria-label', t === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo noche');
    }
    if (window.NativeStatus) window.NativeStatus.oscuro(t === 'oscuro');
  }

  /* ---------- hitos del bebé ---------- */
  var HITOS_TIPOS = ['Primera sonrisa', 'Primer diente', 'Se sentó solo', 'Empezó a gatear', 'Primeros pasos', 'Primera palabra', 'Otro'];
  var CLASES_HITO = ['c-amarillo', 'c-rosa', 'c-menta', 'c-celeste'];
  function tituloHito(h) { return h.tipo === 'Otro' ? (h.detalle || 'Otro hito') : h.tipo; }
  function tarjetaHito(h) {
    var e = edadEn(h.fecha);
    return '<div class="desliza"><div class="acc-atras">' +
      '<button type="button" class="ed" data-acc="ed-hito" data-id="' + h.id + '">' + ICO.edit + 'Editar</button>' +
      '<button type="button" class="el" data-acc="del-hito" data-id="' + h.id + '">' + ICO.del + 'Eliminar</button></div>' +
      '<div class="tarjeta ' + CLASES_HITO[h.id % 4] + '" data-sw="1">' +
      '<div class="fila"><span class="titulo">' + esc(tituloHito(h)) + '</span>' + (e ? '<span class="chip">' + esc(e) + '</span>' : '') + '</div>' +
      '<div class="sub">' + esc(fmtF(h.fecha)) + '</div>' +
      (h.tipo !== 'Otro' && h.detalle ? '<p class="nota">' + esc(h.detalle) + '</p>' : '') + '</div></div>';
  }
  function vistaHitos() {
    if (!estado.hitos.length) return vacio('Aún no hay hitos', 'Toca + para guardar la primera sonrisa, el primer diente y más.');
    var l = estado.hitos.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : (a.fecha > b.fecha ? -1 : 0); });
    var h = '';
    l.forEach(function (x) { h += tarjetaHito(x); });
    return h + '<p class="aviso">Desliza un hito hacia la izquierda para editarlo o eliminarlo.</p>';
  }
  function formHito(id) {
    var o0 = id ? buscar(estado.hitos, id) : null;
    var h = '<label>Tipo de hito' + campoLista('f_htipo', HITOS_TIPOS, o0 ? o0.tipo : 'Primera sonrisa', 'Tipo de hito') + '</label>' +
      '<label>Detalle (obligatorio si eliges Otro)<input type="text" id="f_hdet" maxlength="80" value="' + esc(o0 ? o0.detalle : '') + '"></label>' +
      '<label>Fecha' + campoFecha('f_hfecha', o0 ? o0.fecha : hoyISO(), false) + '</label>';
    abrirModal(o0 ? 'Editar hito' : 'Nuevo hito', h, 'Guardar', function () {
      var tipo = $('f_htipo').value, det = $('f_hdet').value.trim(), fecha = $('f_hfecha').value;
      if (!fecha) return errorModal('Elige la fecha.');
      if (fecha > hoyISO()) return errorModal('La fecha no puede ser futura.');
      if (tipo === 'Otro' && !det) return errorModal('Escribe qué hito fue.');
      var o = o0 || { id: estado.sig++ };
      o.tipo = tipo; o.detalle = det; o.fecha = fecha;
      if (!o0) estado.hitos.push(o);
      guardar(); render(); toast('Hito guardado');
    });
  }

  /* ---------- eventos ---------- */
  function iniciar() {
    $('btnPdf').innerHTML = ICO.pdf;
    $('fab').innerHTML = ICO.mas;
    var b4 = document.createElement('button');
    b4.type = 'button'; b4.setAttribute('data-tab', 'hitos');
    document.querySelector('.nav').appendChild(b4);
    var navs = document.querySelectorAll('.nav button');
    var nombres = { crecimiento: ['crec', 'Crecimiento'], citas: ['cita', 'Citas'], medicinas: ['med', 'Medicinas'], hitos: ['hito', 'Hitos'] };
    for (var i = 0; i < navs.length; i++) {
      var t = navs[i].getAttribute('data-tab');
      navs[i].innerHTML = ICO[nombres[t][0]] + '<span>' + nombres[t][1] + '</span>';
      navs[i].addEventListener('click', function () {
        pestana = this.getAttribute('data-tab');
        render();
        $('contenido').scrollTop = 0;
      });
    }
    var clicAcc = function (e) {
      if (swAbierto && !e.target.closest('.acc-atras')) { cerrarSwipe(); return; }
      var b = e.target;
      while (b && b !== this && !b.getAttribute('data-acc')) b = b.parentNode;
      if (!b || b === this) return;
      accion(b.getAttribute('data-acc'), parseInt(b.getAttribute('data-id'), 10), parseInt(b.getAttribute('data-i'), 10));
    };
    $('contenido').addEventListener('click', clicAcc);
    $('fab').addEventListener('click', function () {
      if (pestana === 'crecimiento') formMedida(0);
      else if (pestana === 'citas') formCita(0);
      else if (pestana === 'hitos') formHito(0);
      else formMed(0);
    });
    var hcEl = document.createElement('section');
    hcEl.id = 'hcitas'; hcEl.className = 'detalle'; hcEl.hidden = true;
    document.body.appendChild(hcEl);
    hcEl.addEventListener('click', clicAcc);

    var ANCHO_SW = 156, sw = { card: null, x0: 0, y0: 0, dir: '', base: 0, x: 0 };
    var cont = $('contenido');
    cont.addEventListener('touchstart', function (e) {
      if (e.target.closest('.acc-atras')) return;
      var card = e.target.closest('[data-sw]');
      if (!card) { cerrarSwipe(); return; }
      if (swAbierto && swAbierto !== card) cerrarSwipe();
      var t = e.touches[0];
      sw.card = card; sw.x0 = t.clientX; sw.y0 = t.clientY; sw.dir = '';
      sw.base = swAbierto === card ? -ANCHO_SW : 0; sw.x = sw.base;
      card.style.transition = 'none';
    }, { passive: true });
    cont.addEventListener('touchmove', function (e) {
      if (!sw.card) return;
      var t = e.touches[0], dx = t.clientX - sw.x0, dy = t.clientY - sw.y0;
      if (!sw.dir && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) sw.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (sw.dir === 'h') {
        sw.x = Math.max(-ANCHO_SW, Math.min(0, sw.base + dx));
        sw.card.style.transform = 'translateX(' + sw.x + 'px)';
      }
    }, { passive: true });
    function finSwipe() {
      var c = sw.card;
      if (!c) return;
      c.style.transition = '';
      if (sw.dir === 'h') {
        var abre = sw.x < -ANCHO_SW / 2;
        c.style.transform = abre ? 'translateX(-' + ANCHO_SW + 'px)' : '';
        swAbierto = abre ? c : null;
      }
      sw.card = null;
    }
    cont.addEventListener('touchend', finSwipe);
    cont.addEventListener('touchcancel', finSwipe);

    var detEl = document.createElement('section');
    detEl.id = 'detalle'; detEl.className = 'detalle'; detEl.hidden = true;
    document.body.appendChild(detEl);
    detEl.addEventListener('click', clicAcc);
    var gEl = document.createElement('section');
    gEl.id = 'grafica'; gEl.className = 'grafica'; gEl.hidden = true;
    document.body.insertBefore(gEl, $('contenido'));
    gEl.addEventListener('click', function (e) {
      var b = e.target;
      while (b && b !== this && !b.getAttribute('data-m')) b = b.parentNode;
      if (!b || b === this) return;
      metrica = b.getAttribute('data-m');
      render();
    });
    var selEl = document.createElement('div');
    selEl.id = 'selector'; selEl.className = 'selector'; selEl.hidden = true;
    selEl.innerHTML = '<div class="sel-hoja"><h3 id="selTitulo"></h3><div id="selCuerpo"></div><div class="botones">' +
      '<button id="selBorrar" class="sec" type="button" data-sel="borrar">Borrar</button>' +
      '<button class="sec" type="button" data-sel="cancelar">Cancelar</button>' +
      '<button id="selOk" class="pri" type="button" data-sel="ok">Establecer</button></div></div>';
    document.body.appendChild(selEl);
    selEl.addEventListener('click', function (e) {
      if (e.target === this) { cerrarSelector(); return; }
      var b = e.target;
      while (b && b !== this && !b.getAttribute('data-sel')) b = b.parentNode;
      if (!b || b === this) return;
      accionSelector(b.getAttribute('data-sel'), b.getAttribute('data-v'));
    });
    $('modalCuerpo').addEventListener('click', function (e) {
      var b = e.target;
      while (b && b !== this && !b.getAttribute('data-pick')) b = b.parentNode;
      if (!b || b === this) return;
      abrirSelector(b.getAttribute('data-pick'), b.getAttribute('data-target'), b.getAttribute('data-opc') === '1');
    });
    var cab = document.querySelector('.cab');
    var der = document.createElement('div');
    der.className = 'cab-der';
    var ub = document.createElement('button');
    ub.type = 'button'; ub.id = 'btnUnidad'; ub.className = 'unid';
    ub.setAttribute('aria-label', 'Cambiar entre kilos y libras');
    var tb = document.createElement('button');
    tb.type = 'button'; tb.id = 'btnTema'; tb.className = 'icbtn';
    cab.appendChild(der); der.appendChild(ub); der.appendChild(tb); der.appendChild($('btnPdf'));
    tb.addEventListener('click', function () {
      estado.tema = temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro';
      guardar(); aplicarTema();
    });
    aplicarTema();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var cambioSistema = function () { if (estado.tema === 'auto') aplicarTema(); };
      if (mq.addEventListener) mq.addEventListener('change', cambioSistema); else if (mq.addListener) mq.addListener(cambioSistema);
    }
    ub.addEventListener('click', function () {
      estado.unidad = estado.unidad === 'kg' ? 'lb' : 'kg';
      guardar(); render();
    });
    document.addEventListener('contextmenu', function (e) {
      var t = e.target.tagName;
      if (t !== 'INPUT' && t !== 'TEXTAREA') e.preventDefault();
    });
    $('btnPerfil').addEventListener('click', formPerfil);
    $('btnPdf').addEventListener('click', crearPDF);
    $('modalCancelar').addEventListener('click', cerrarModal);
    $('modalOk').addEventListener('click', function () {
      if (modalCb && modalCb() === false) return;
      cerrarModal();
    });
    $('modal').addEventListener('click', function (e) { if (e.target === this) cerrarModal(); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { render(); reprogramar(false); }
    });
    setInterval(function () { if (pestana === 'medicinas' && $('modal').hidden) render(); }, 30000);

    render();
    reprogramar(false);
    if (!estado.perfil.visto) formPerfil();
  }

  var MARCA_PDF = 'data:image/webp;base64,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1ACg599KcUHddio49/yqp1Q8kDef6rk3IVb9QcUB/c/tXLg3AOF/Yz766e2nADAXx31xE8qIpz/qt4OjF9nVX98jo5yavCoFwtUBZPM3Piujm/rp37WD089e+YEZGdXUxOlcuD3I5q5/TEUzeffFAK4PwF/3y3kZwfQ3VwtIAPJC7ouvRC894HksCQAe4zc+o2Sk0nsuhuQg93sfm5fRSck/97AEAXT6+R/MyaikHvpUBkSSAITIfWJGyiik9OglkDzs7PrQU/My+qjJj60RCQSeT3d+/zkddfRPzhQ8lUAAziB/wz062ugvHwvJxWzPle99TsmoouSuDcd4CQbIF/Jr/jAno4meuDYHWZZk4Exke37xjI4ii/98vIDkI79izQ0DqGS00HJywzE+JCE7u1K89+l5HSGU3n1pDkAkIoAD8Pz3f6NlVNCT95zCIEmZyXf1fHJORwGp9EcuyXqQrMzmc+zGH0wq3eCUnrr5SgZCJCwAOM+sPu+xP2nZwJS+95v5dkhoZnp7e6/48oxuWPqn3zg2n2NJDcj2FAreB26aRy0bjtI4seE04MJPbgAAz/r5mz6x5zktG4rWu3aedx6D5Cfv3LC+t/D5u2a1bBhaf+WeFuH7XgIEINvbVfDY9QOHNSpZ97TW+tqBNABwjyVCAEAI4eU/dPHv98xrXc+U1runTu9NQfI0e2VvodD11R1/XND1Suuf3vNlz4NEKs8WenLCh46BLykt64/S+iMDrbCUC5Y8qcy4EPmN6x9D1FrXCaW1RPzYuvUpSMBme9Z35QqF/B937lRay1rTWk/s3PkZ308BCJaAgawvhAdCCP6NLXc+o7WWNaK01vrL27efzgUDAOBCJGGW574nsh/85E3veXqJXiotUHqpRMTxizds2NguIAPJXO77hRwDyBd611355927d++c0pWDKb387p27d+/+yfk9vYUcAHDfYyyhAwBcwLJcCAEf2L701jvV4pHKuvJD99y1ffuO7Tvu+vJ5IisEg+WFYJA47lm3ftmNGze+Z8PG02ApZwyEgOQyq2SWi6wQApLMXDBghriomGj6b///t//5z3/+8/+//c9//vOf//znP//5z3/+85///Oc///nPf/7zn//85z//+c9//vOf//znP//5z3/+85///Oc///nPf/7zn//85z//+c9//vOf//znP//5z3/+85///Oc///nPf/7zn//85z//+c9//vOf//znP//5z3/+85///H/tAQBWUDggAm8AANDjA50BKngF+Qc+nU6kTaWkMykg8ThyYBOJaW78HIxeRZgWC2w86bxrz8y9GDJAX6C/0f5rehuz/6H+N6IzzP71/gPemzXMtehB1R5w/9z6nv2F7Bn9g8tL1b+af91v3C94T1Df2b1Cv3R61v+q/7T////r4Fv4//qPTx/df4Q/3J9gb+T/4T///+j3AP//6gH/L///uC/wD9//cH8P/4X+g9UHx/+H/2X+Q85/yD7n/Y+ZU/heD+cv+773fl3qC4s9gPun/M9Av2z/AeYP935x/wvqBeaH/R8H38N/1PYJ/nP+T9W//Z8iv2J7A/87/vXp1ew391///7nX63//wH5U18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXwLh18hDNPb0Wn1NfEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RBUwgf/ZkTvhNJtzuhGFKqUVs8We0+hNntPoTZ7T6E2e0+hNntPoTZ7T6E2e0+hNntPoTZ7KMIH/2ZEKT5qAkqlDLWaSwX+tyV2PxZ7T6E2e0+hNntPoTZ7T6E2e0+hNntPoLGY35BXko5nApRPuVC1pqiK0jiKezxZ7T6CymQBqR5U0OfRvX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Q3UbBORSBWNPoTZ7T6E2e0+hNntPoTZ7T6E2Z/TV6NhpiKMbz79cblLhs0Lya+BVvaK8XzK1c50ArHPdZxBre0XskJN0Ojs3em21U8aW4K7dx9i6MyIJ9TXxEHn18RB59fEQefXxEHn18RBYqOM6FSL5fOlkC9TGiuBIlQmP9nVBmF9wWLFLOFWGVedbBAxB3KF5O6hCEU9niz2n0Js9p9CbPafQmz2n0Js82qPZkV1iEXiDkt2SM1YBZ5v+VUI5mhZuKB2KenDheq8osZ9l7sb0eLPafQmz2n0Js9p9CbPafQmz2n0Js9p9CbPNvmNVCTsJXJZyi60t2Ip7CFaJ9Pa5NEoCd2qn1HyqMhewkIhR9hF/7jT+zHDTqaPPr4iDz6+Ig8+viIPPr4iDz6+Ig8+viIPPr4iTBfnpvlN2v1UGf4n2X+yMthfiDp4rI26MJk6Je38oW9IzE4lgjwewiBNOISx3XtvOcrw815qQioZX18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQebgtCWss/VKxTNcMx59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18RB59fEQefXxEHn18CAAA/v9umAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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';
  iniciar();
  window.__appListo = true;
})();
