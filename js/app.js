(function () {
  'use strict';

  var KEY = 'bml_data';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var TIPOS = ['Vacuna', 'Pediatra', 'Control de peso y talla', 'Análisis', 'Otro'];
  var CLASE_TIPO = { 'Vacuna': 'c-menta', 'Pediatra': 'c-rosa', 'Control de peso y talla': 'c-amarillo', 'Análisis': 'c-lila', 'Otro': 'c-durazno' };
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
    bebe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="11" r=".6"/><circle cx="15" cy="11" r=".6"/><path d="M9.5 15c1.4 1 3.6 1 5 0M12 4c1-1.5 2.5-1.5 3 0"/></svg>'
  };

  var estado = cargar();
  var pestana = 'crecimiento';
  var modalCb = null;
  var toastT = null;

  function $(id) { return document.getElementById(id); }

  /* ---------- datos ---------- */
  function porDefecto() {
    return { perfil: { nombre: '', nacimiento: '', visto: false }, medidas: [], citas: [], meds: [], sig: 1 };
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
    return d.getDate() + ' ' + MESES[d.getMonth()] + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
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
        '<div class="dato"><span class="et">Peso</span><span class="val">' + (m.peso != null ? esc(fmtNum(m.peso, 3)) + ' kg' : '—') + '</span><small>' + esc(difPrevio(l, i, 'peso', 3)) + '</small></div>' +
        '<div class="dato"><span class="et">Altura</span><span class="val">' + (m.altura != null ? esc(fmtNum(m.altura, 1)) + ' cm' : '—') + '</span><small>' + esc(difPrevio(l, i, 'altura', 1)) + '</small></div>' +
        '</div>' +
        (m.notas ? '<p class="nota">' + esc(m.notas) + '</p>' : '') +
        '<div class="acciones">' + btn('ed-medida', m.id, ICO.edit, 'Editar') + btn('del-medida', m.id, ICO.del, 'Eliminar') + '</div></div>';
    }
    return h;
  }

  function tarjetaCita(c, pasada) {
    var t = dt(c.fecha, c.hora);
    var av = '';
    for (var i = 0; i < AVISOS.length; i++) { if (AVISOS[i].v === c.aviso && c.aviso !== 'no') av = AVISOS[i].t; }
    return '<div class="tarjeta ' + (CLASE_TIPO[c.tipo] || 'c-durazno') + (pasada ? ' pasada' : '') + '">' +
      '<div class="fila"><span class="titulo">' + esc(c.tipo) + (c.motivo ? ' · ' + esc(c.motivo) : '') + '</span>' +
      (c.hecha ? '<span class="chip">Hecha</span>' : '') + '</div>' +
      '<div class="sub">' + esc(fmtF(c.fecha)) + (c.hora ? ', ' + esc(c.hora) : '') + (c.lugar ? ' · ' + esc(c.lugar) : '') + '</div>' +
      (av ? '<div class="sub">Aviso: ' + esc(av) + '</div>' : '') +
      (c.notas ? '<p class="nota">' + esc(c.notas) + '</p>' : '') +
      '<div class="acciones">' +
      btn('hecha-cita', c.id, ICO.ok, c.hecha ? 'Reabrir' : 'Marcar hecha', c.hecha ? '' : 'fuerte') +
      btn('ed-cita', c.id, ICO.edit, 'Editar') + btn('del-cita', c.id, ICO.del, 'Eliminar') + '</div></div>';
  }
  function vistaCitas() {
    if (!estado.citas.length) return vacio('Sin citas anotadas', 'Toca + para agregar vacunas, visitas al pediatra y más.');
    var hoy = hoyISO();
    function clave(c) { return c.fecha + ' ' + (c.hora || '00:00'); }
    var prox = estado.citas.filter(function (c) { return !c.hecha && c.fecha >= hoy; }).sort(function (a, b) { return clave(a) < clave(b) ? -1 : 1; });
    var pas = estado.citas.filter(function (c) { return c.hecha || c.fecha < hoy; }).sort(function (a, b) { return clave(a) < clave(b) ? 1 : -1; });
    var h = '';
    if (prox.length) { h += '<div class="seccion">Próximas</div>'; prox.forEach(function (c) { h += tarjetaCita(c, false); }); }
    if (pas.length) { h += '<div class="seccion">Pasadas y hechas</div>'; pas.forEach(function (c) { h += tarjetaCita(c, true); }); }
    return h;
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
  function vistaMedicinas() {
    if (!estado.meds.length) return vacio('Sin medicamentos', 'Toca + para agregar uno con su dosis y horario.') + '<p class="aviso">Anota solo lo que indique el pediatra.</p>';
    var h = '';
    estado.meds.forEach(function (m) {
      var p = proxima(m), ult = m.registro && m.registro.length ? m.registro[m.registro.length - 1] : null;
      var estadoTxt = !m.activo ? 'En pausa' : (p ? 'Próxima dosis: ' + fmtDT(p) : 'Tratamiento terminado');
      h += '<div class="tarjeta c-lila' + (m.activo ? '' : ' pasada') + '">' +
        '<div class="fila"><span class="titulo">' + esc(m.nombre) + '</span><span class="chip">cada ' + esc(fmtNum(m.cada, 1)) + ' h</span></div>' +
        '<div class="sub">Dosis: ' + esc(m.dosis) + '</div>' +
        '<div class="sub">Inicio: ' + esc(fmtF(m.inicio)) + ', ' + esc(m.hora) + (m.dias > 0 ? ' · ' + esc(m.dias) + ' días' : ' · sin fecha de fin') + '</div>' +
        '<div class="titulo" style="margin-top:6px">' + esc(estadoTxt) + '</div>' +
        (ult ? '<div class="sub">Última dosis dada: ' + esc(fmtDT(ult)) + '</div>' : '') +
        (m.notas ? '<p class="nota">' + esc(m.notas) + '</p>' : '') +
        '<div class="acciones">' +
        btn('dada-med', m.id, ICO.ok, 'Dada ahora', 'fuerte') +
        btn('pausa-med', m.id, m.activo ? ICO.pausa : ICO.play, m.activo ? 'Pausar' : 'Activar') +
        btn('ed-med', m.id, ICO.edit, 'Editar') + btn('del-med', m.id, ICO.del, 'Eliminar') + '</div></div>';
    });
    return h + '<p class="aviso">Anota solo lo que indique el pediatra. La app no calcula dosis.</p>';
  }

  function render() {
    $('cabNombre').textContent = estado.perfil.nombre || 'Mi bebé';
    var e = edadEn(hoyISO());
    $('cabEdad').textContent = e || (estado.perfil.nacimiento ? '' : 'Toca para agregar su nacimiento');
    var h = pestana === 'crecimiento' ? vistaCrecimiento() : (pestana === 'citas' ? vistaCitas() : vistaMedicinas());
    $('contenido').innerHTML = h;
    var tabs = document.querySelectorAll('.nav button');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].className = tabs[i].getAttribute('data-tab') === pestana ? 'activo' : '';
    }
    $('fab').setAttribute('aria-label', pestana === 'crecimiento' ? 'Agregar medida' : (pestana === 'citas' ? 'Agregar cita' : 'Agregar medicamento'));
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
        lista.push({ id: 1000000000 + c.id, title: 'Cita: ' + c.tipo, body: quien + ' · ' + fmtF(c.fecha) + (c.hora ? ', ' + c.hora : '') + (c.lugar ? ' · ' + c.lugar : ''), at: ms });
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
    $('selCuerpo').innerHTML = S.tipo === 'fecha' ? calendario() : ruedas();
    if (S.tipo === 'hora') posicionarRuedas();
  }
  function abrirSelector(tipo, target, opc) {
    var v = $(target).value;
    S.tipo = tipo; S.target = target; S.opc = opc;
    if (tipo === 'fecha') {
      var p = parseF(v) || parseF(hoyISO());
      S.y = p.y; S.m = p.m; S.fecha = v || '';
      $('selTitulo').textContent = 'Elige la fecha';
    } else {
      var q = String(v || '09:00').split(':');
      S.h = +q[0] || 0; S.mi = +q[1] || 0;
      $('selTitulo').textContent = 'Elige la hora';
    }
    $('selBorrar').hidden = !opc;
    $('selector').hidden = false;
    pintarSelector();
  }
  function cerrarSelector() { $('selector').hidden = true; }
  function accionSelector(a, v) {
    if (a === 'cancelar') { cerrarSelector(); return; }
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
      '<label>Fecha de nacimiento' + campoFecha('f_nac', p.nacimiento, true) + '</label>';
    abrirModal('Datos del bebé', h, 'Guardar', function () {
      var nac = $('f_nac').value;
      if (nac && nac > hoyISO()) return errorModal('La fecha de nacimiento no puede ser futura.');
      estado.perfil.nombre = $('f_nombre').value.trim();
      estado.perfil.nacimiento = nac;
      estado.perfil.visto = true;
      guardar(); render(); reprogramar(false);
    });
  }

  function formMedida(id) {
    var m = id ? buscar(estado.medidas, id) : null;
    var h = '<label>Fecha' + campoFecha('f_fecha', m ? m.fecha : hoyISO(), false) + '</label>' +
      '<div class="dos"><label>Peso (kg)<input type="text" inputmode="decimal" id="f_peso" placeholder="3.450" value="' + esc(m && m.peso != null ? m.peso : '') + '"></label>' +
      '<label>Altura (cm)<input type="text" inputmode="decimal" id="f_alt" placeholder="50.5" value="' + esc(m && m.altura != null ? m.altura : '') + '"></label></div>' +
      '<label>Notas (opcional)<textarea id="f_notas" maxlength="300">' + esc(m ? m.notas : '') + '</textarea></label>';
    abrirModal(m ? 'Editar medida' : 'Nueva medida', h, 'Guardar', function () {
      var fecha = $('f_fecha').value, peso = num($('f_peso').value), alt = num($('f_alt').value);
      if (!fecha) return errorModal('Elige la fecha.');
      if (peso === null && alt === null) return errorModal('Anota al menos el peso o la altura.');
      if (peso !== null && (peso <= 0 || peso > 40)) return errorModal('Revisa el peso: debe estar entre 0 y 40 kg.');
      if (alt !== null && (alt <= 0 || alt > 150)) return errorModal('Revisa la altura: debe estar entre 0 y 150 cm.');
      var o = m || { id: estado.sig++ };
      o.fecha = fecha; o.peso = peso; o.altura = alt; o.notas = $('f_notas').value.trim();
      if (!m) estado.medidas.push(o);
      guardar(); render(); toast('Medida guardada');
    });
  }

  function formCita(id) {
    var c = id ? buscar(estado.citas, id) : null;
    var h = '<label>Tipo<select id="f_tipo">' + opciones(TIPOS, c ? c.tipo : 'Pediatra') + '</select></label>' +
      '<label>Detalle (opcional, ej. nombre de la vacuna)<input type="text" id="f_motivo" maxlength="60" value="' + esc(c ? c.motivo : '') + '"></label>' +
      '<div class="dos"><label>Fecha' + campoFecha('f_fecha', c ? c.fecha : hoyISO(), false) + '</label>' +
      '<label>Hora' + campoHora('f_hora', c ? (c.hora || '') : '09:00', true) + '</label></div>' +
      '<label>Lugar (opcional)<input type="text" id="f_lugar" maxlength="60" value="' + esc(c ? c.lugar : '') + '"></label>' +
      '<label>Recordatorio<select id="f_aviso">' + opciones(AVISOS, c ? c.aviso : '1440') + '</select></label>' +
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
  function accion(a, id) {
    var o;
    if (a === 'ed-medida') formMedida(id);
    else if (a === 'del-medida') confirmar('¿Eliminar esta medida?', function () { estado.medidas = quitar(estado.medidas, id); guardar(); render(); });
    else if (a === 'ed-cita') formCita(id);
    else if (a === 'del-cita') confirmar('¿Eliminar esta cita?', function () { estado.citas = quitar(estado.citas, id); guardar(); render(); reprogramar(false); });
    else if (a === 'hecha-cita') { o = buscar(estado.citas, id); if (o) { o.hecha = !o.hecha; guardar(); render(); reprogramar(false); } }
    else if (a === 'ed-med') formMed(id);
    else if (a === 'del-med') confirmar('¿Eliminar este medicamento?', function () { estado.meds = quitar(estado.meds, id); guardar(); render(); reprogramar(false); });
    else if (a === 'pausa-med') { o = buscar(estado.meds, id); if (o) { o.activo = !o.activo; guardar(); render(); reprogramar(o.activo); } }
    else if (a === 'dada-med') {
      o = buscar(estado.meds, id);
      if (o) {
        if (!o.registro) o.registro = [];
        o.registro.push(Date.now());
        if (o.registro.length > 30) o.registro.shift();
        guardar(); render(); toast('Dosis registrada');
      }
    }
  }

  /* ---------- PDF ---------- */
  function tabla(cab, filas) {
    if (!filas.length) return '<p style="color:#7A7288">Sin registros.</p>';
    var h = '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr>';
    cab.forEach(function (c) { h += '<th style="text-align:left;background:#E8DFF7;padding:6px;border:1px solid #F0E4EA">' + esc(c) + '</th>'; });
    h += '</tr>';
    filas.forEach(function (f) {
      h += '<tr>';
      f.forEach(function (c) { h += '<td style="padding:6px;border:1px solid #F0E4EA;vertical-align:top">' + esc(c) + '</td>'; });
      h += '</tr>';
    });
    return h + '</table>';
  }
  function crearPDF() {
    if (typeof window.html2pdf !== 'function') { toast('No se pudo cargar el creador de PDF'); return; }
    var p = estado.perfil;
    var med = estado.medidas.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    var cit = estado.citas.slice().sort(function (a, b) { return (a.fecha + (a.hora || '')) < (b.fecha + (b.hora || '')) ? -1 : 1; });
    var h = '<div style="font-family:Nunito,Arial,sans-serif;color:#4B4457;width:700px;padding:10px;background:#fff">' +
      '<h1 style="margin:0 0 4px;font-size:22px">Baby Medical List</h1>' +
      '<div style="font-size:14px">' + esc(p.nombre || 'Bebé') + (p.nacimiento ? ' · Nació el ' + esc(fmtF(p.nacimiento)) : '') + '</div>' +
      '<div style="font-size:12px;color:#7A7288;margin-bottom:12px">Reporte generado el ' + esc(fmtF(hoyISO())) + '</div>' +
      '<h2 style="font-size:16px;margin:14px 0 6px">Crecimiento</h2>' +
      tabla(['Fecha', 'Edad', 'Peso (kg)', 'Altura (cm)', 'Notas'], med.map(function (m) { return [fmtF(m.fecha), edadEn(m.fecha), m.peso != null ? fmtNum(m.peso, 3) : '—', m.altura != null ? fmtNum(m.altura, 1) : '—', m.notas || '']; })) +
      '<h2 style="font-size:16px;margin:14px 0 6px">Citas</h2>' +
      tabla(['Fecha', 'Tipo', 'Lugar', 'Estado', 'Notas'], cit.map(function (c) { return [fmtF(c.fecha) + (c.hora ? ' ' + c.hora : ''), c.tipo + (c.motivo ? ' · ' + c.motivo : ''), c.lugar || '', c.hecha ? 'Hecha' : 'Pendiente', c.notas || '']; })) +
      '<h2 style="font-size:16px;margin:14px 0 6px">Medicamentos</h2>' +
      tabla(['Medicamento', 'Dosis', 'Cada', 'Inicio', 'Duración', 'Notas'], estado.meds.map(function (m) { return [m.nombre, m.dosis, fmtNum(m.cada, 1) + ' h', fmtF(m.inicio) + ' ' + m.hora, m.dias > 0 ? m.dias + ' días' : 'Sin fecha de fin', m.notas || '']; })) +
      '<p style="font-size:11px;color:#7A7288;margin-top:16px">Registro llevado por la familia. No sustituye las indicaciones del pediatra.</p></div>';
    var cont = document.createElement('div');
    cont.style.cssText = 'position:absolute;left:0;top:0;z-index:-1;background:#fff';
    cont.innerHTML = h;
    document.body.appendChild(cont);
    toast('Creando PDF...');
    var nombre = 'Baby-Medical-List-' + hoyISO() + '.pdf';
    window.html2pdf().set({
      margin: 10, filename: nombre, image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

  /* ---------- eventos ---------- */
  function iniciar() {
    $('btnPdf').innerHTML = ICO.pdf;
    $('fab').innerHTML = ICO.mas;
    var navs = document.querySelectorAll('.nav button');
    var nombres = { crecimiento: ['crec', 'Crecimiento'], citas: ['cita', 'Citas'], medicinas: ['med', 'Medicinas'] };
    for (var i = 0; i < navs.length; i++) {
      var t = navs[i].getAttribute('data-tab');
      navs[i].innerHTML = ICO[nombres[t][0]] + '<span>' + nombres[t][1] + '</span>';
      navs[i].addEventListener('click', function () {
        pestana = this.getAttribute('data-tab');
        render();
        $('contenido').scrollTop = 0;
      });
    }
    $('contenido').addEventListener('click', function (e) {
      var b = e.target;
      while (b && b !== this && !b.getAttribute('data-acc')) b = b.parentNode;
      if (!b || b === this) return;
      accion(b.getAttribute('data-acc'), parseInt(b.getAttribute('data-id'), 10));
    });
    $('fab').addEventListener('click', function () {
      if (pestana === 'crecimiento') formMedida(0);
      else if (pestana === 'citas') formCita(0);
      else formMed(0);
    });
    var selEl = document.createElement('div');
    selEl.id = 'selector'; selEl.className = 'selector'; selEl.hidden = true;
    selEl.innerHTML = '<div class="sel-hoja"><h3 id="selTitulo"></h3><div id="selCuerpo"></div><div class="botones">' +
      '<button id="selBorrar" class="sec" type="button" data-sel="borrar">Borrar</button>' +
      '<button class="sec" type="button" data-sel="cancelar">Cancelar</button>' +
      '<button class="pri" type="button" data-sel="ok">Establecer</button></div></div>';
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

  iniciar();
  window.__appListo = true;
})();
