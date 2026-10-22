// Prueba de integración del bundle web en DOM. No renderiza ni prueba cámara nativa.
// Ejecutar: npm run test:ui (genera dist y luego ejecuta este archivo).
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dist = path.resolve(__dirname, '..', 'dist');

class LocalAssets extends ResourceLoader {
  fetch(url) {
    const file = path.resolve(dist, '.' + new URL(url).pathname);
    const request = file.startsWith(dist + path.sep) && fs.existsSync(file)
      ? Promise.resolve(fs.readFileSync(file)) : Promise.reject(new Error(`Asset no disponible: ${url}`));
    request.abort = () => {};
    return request;
  }
}

async function openApp(snapshot = {}) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', e => { if (!e.message.includes('CSS')) errors.push(e.message); });
  console.on('error', (...args) => errors.push(args.join(' ')));
  const dom = new JSDOM(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), {
    url: 'http://stockroom.test/', resources: new LocalAssets(), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console,
    beforeParse(w) {
      Object.defineProperty(w, 'crypto', { value: webcrypto });
      w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.fetch = fetch; w.scrollTo = () => {};
      w.matchMedia = media => ({ matches: false, media, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      for (const [key, value] of Object.entries(snapshot)) w.localStorage.setItem(key, value);
    },
  });
  const w = dom.window;
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function text(value) {
    for (let i = 0; i < 200; i++) { if (w.document.body.textContent.includes(value)) return; await pause(50); }
    throw new Error(`No se encontró: ${value}. Errores: ${errors.join('; ')}`);
  }
  function input(label, value) {
    // El stack conserva escenas anteriores ocultas: usar el control de la última escena.
    const el = [...w.document.querySelectorAll('input')].filter(e => e.getAttribute('aria-label') === label).at(-1);
    assert.ok(el, `Campo ${label}`);
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  function click(label) {
    const el = [...w.document.querySelectorAll('[role="button"],button,a')].reverse().find(e => e.getAttribute('aria-label') === label || e.textContent === label);
    assert.ok(el, `Botón ${label}`); el.click();
  }
  function tab(label) { const el = [...w.document.querySelectorAll('a')].find(e => e.textContent.endsWith(label)); assert.ok(el); el.click(); }
  function back() { const el = [...w.document.querySelectorAll('a')].reverse().find(e => e.getAttribute('aria-label')?.endsWith(', back')); assert.ok(el); el.click(); }
  return { w, errors, dom, pause, text, input, click, tab, back };
}

(async () => {
  let app;
  try {
    app = await openApp();
    const { w, pause, text, input, click, tab, back } = app;
    await text('Iniciar sesión');
    input('Correo electrónico', 'tecnico@dtech.com'); input('Contraseña', 'incorrecta'); await pause(70); click('Iniciar sesión');
    await text('Correo o contraseña incorrectos.');
    input('Contraseña', 'Stockroom2026!'); await pause(70); click('Iniciar sesión'); await text('Hola, Juan');
    console.log('OK: login válido e inválido');

    click('Nueva salida'); await text('Registrar salida');
    click('Equipo o material: Seleccionar…'); await pause(70); click('EQ-001 · Ubiquiti U7 Pro XG (1 disponibles)'); await pause(70);
    click('Proyecto / destino: Seleccionar…'); await pause(70); click('Torre 1 · Instalación de red'); await pause(70);
    input('Cantidad · máximo 1', '2'); await pause(70); click('Guardar movimiento'); await text('Ingresa una cantidad entera entre 1 y 1.');
    input('Cantidad · máximo 1', '1'); await pause(70); click('Guardar movimiento'); await text('Confirmar salida'); click('Confirmar'); await text('Trazabilidad'); await pause(250);
    let db = JSON.parse(w.localStorage.getItem('stockroom-database-v1'));
    assert.equal(db.equipment.find(e => e.id === 'EQ-001').stock, 0);
    console.log('OK: rechazo de sobrestock y salida persistida');

    back(); await pause(150); click('Instalación'); await text('Registrar instalación');
    click('Asignación pendiente: Seleccionar…'); await pause(70);
    const option = [...w.document.querySelectorAll('[role="button"]')].find(e => e.textContent.startsWith('Ubiquiti U7 Pro XG · Torre 1'));
    assert.ok(option); option.click(); await pause(70);
    input('Ubicación exacta de instalación', 'Piso 2 · Sala de reuniones'); await pause(70); click('Guardar movimiento'); await text('Confirmar instalación'); click('Confirmar'); await pause(350);
    db = JSON.parse(w.localStorage.getItem('stockroom-database-v1'));
    assert.equal(db.equipment.find(e => e.id === 'EQ-001').status, 'INSTALLED');
    console.log('OK: instalación de asignación');

    back(); await pause(150); tab('Perfil'); await text('Cerrar sesión'); click('Cerrar sesión'); await pause(70); click('Confirmar'); await text('Crear cuenta de técnico');
    click('Crear cuenta de técnico'); await text('Nombre completo');
    input('Nombre completo', 'Técnico de Prueba'); input('Correo electrónico', 'nuevo@dtech.com'); input('Contraseña', 'Prueba2026!'); input('Confirmar contraseña', 'Prueba2026!'); await pause(70); click('Registrarme'); await text('Hola, Técnico');
    assert.ok(w.document.body.textContent.includes('Sin asignaciones pendientes'));
    console.log('OK: registro y estado vacío de técnico nuevo');

    tab('Perfil'); await text('Cambiar contraseña'); click('Cambiar contraseña'); await text('Contraseña actual');
    input('Contraseña actual', 'Prueba2026!'); input('Nueva contraseña', 'Nueva2026!'); input('Confirmar nueva contraseña', 'Nueva2026!'); await pause(70); click('Guardar contraseña'); await text('Contraseña actualizada.');
    const accounts = w.localStorage.getItem('stockroom-accounts-v1');
    assert.ok(!accounts.includes('Prueba2026!') && !accounts.includes('Nueva2026!'));
    const snapshot = Object.fromEntries(Object.keys(w.localStorage).map(k => [k, w.localStorage.getItem(k)]));
    assert.deepEqual(app.errors, []); app.dom.window.close();
    console.log('OK: cambio de contraseña y persistencia de hashes');

    app = await openApp(snapshot);
    await app.text('Iniciar sesión');
    app.input('Correo electrónico', 'nuevo@dtech.com'); app.input('Contraseña', 'Nueva2026!'); await app.pause(70); app.click('Iniciar sesión'); await app.text('Hola, Técnico');
    const recovered = JSON.parse(app.w.localStorage.getItem('stockroom-database-v1'));
    assert.equal(recovered.equipment.find(e => e.id === 'EQ-001').status, 'INSTALLED');
    assert.deepEqual(app.errors, []);
    console.log('OK: reinicio, nueva contraseña e inventario conservado');
  } finally { app?.dom.window.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
