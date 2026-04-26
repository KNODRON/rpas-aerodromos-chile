// ===============================
// MAPA BASE
// ===============================

let map = L.map("map").setView([-35, -71], 5);

let mapaBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

let capaAerodromos = L.layerGroup().addTo(map);
let capaMedicion = L.layerGroup().addTo(map);

let capaWMS = L.tileLayer.wms("https://geoportal.cl/geoserver/Infraestructura_Aerea/ows", {
  layers: "infraestructura_area",
  format: "image/png",
  transparent: true,
  attribution: "IDE Chile"
});

L.control.layers(
  { "Mapa base": mapaBase },
  {
    "Aeródromos / Aeropuertos": capaAerodromos,
    "Capa oficial IDE Chile": capaWMS,
    "Medición": capaMedicion
  },
  { collapsed: false }
).addTo(map);


// ===============================
// VARIABLES
// ===============================

let inicioMedicion = null;
let midiendo = false;
let marcadorCercano = null;


// ===============================
// COLORES
// ===============================

function colorPorTipo(tipo) {
  if (tipo === "Aeropuerto") return "#ef4444";
  if (tipo === "Aeródromo") return "#f97316";
  return "#38bdf8";
}


// ===============================
// CARGA Y RENDER DE PUNTOS
// ===============================

function cargarPuntos() {
  capaAerodromos.clearLayers();

  const tipoFiltro = document.getElementById("tipoFiltro")?.value || "TODOS";
  const busqueda = document.getElementById("busqueda")?.value.toLowerCase().trim() || "";

  let visibles = 0;

  datos.forEach(p => {
    if (!p.lat || !p.lon) return;

    const texto = `${p.nombre} ${p.codigo_oaci || ""} ${p.region || ""} ${p.comuna || ""}`.toLowerCase();

    if (tipoFiltro !== "TODOS" && p.tipo !== tipoFiltro) return;
    if (busqueda && !texto.includes(busqueda)) return;

    visibles++;

    L.circleMarker([p.lat, p.lon], {
      radius: p.tipo === "Aeropuerto" ? 7 : 5,
      color: colorPorTipo(p.tipo),
      fillColor: colorPorTipo(p.tipo),
      fillOpacity: 0.85,
      weight: 2
    })
    .addTo(capaAerodromos)
    .bindPopup(`
      <b>${p.nombre || "Sin nombre"}</b><br>
      Tipo: ${p.tipo || "S/I"}<br>
      OACI: ${p.codigo_oaci || "S/I"}<br>
      Región: ${p.region || "S/I"}<br>
      Comuna: ${p.comuna || "S/I"}<br>
      Uso: ${p.uso || "S/I"}
    `);
  });

  actualizarContadores(visibles);
}

function actualizarContadores(visibles) {
  const total = document.getElementById("totalDatos");
  const visiblesBox = document.getElementById("visiblesDatos");

  if (total) total.textContent = datos.length;
  if (visiblesBox) visiblesBox.textContent = visibles;
}


// ===============================
// CENTRADO
// ===============================

function centrarChile() {
  map.setView([-35, -71], 5);
}

// ===============================
// MEDICIÓN CON CLICK + ARRASTRE
// ===============================

// Evita menú del botón derecho
map.getContainer().addEventListener("contextmenu", e => e.preventDefault());

let puntoMedicion = null;
let midiendoDerecho = false;

// CLIC IZQUIERDO: evaluar punto
map.on("click", e => {
  evaluarDesdePunto(e.latlng);
});

// BOTÓN DERECHO PRESIONADO: inicia medición
map.getContainer().addEventListener("mousedown", e => {
  if (e.button !== 2) return;

  const punto = map.mouseEventToLatLng(e);
  puntoMedicion = punto;
  midiendoDerecho = true;

  capaMedicion.clearLayers();

  L.circleMarker(puntoMedicion, {
    radius: 8,
    color: "#ffffff",
    fillColor: "#22c55e",
    fillOpacity: 1,
    weight: 3
  }).addTo(capaMedicion);
});

// BOTÓN DERECHO ARRASTRANDO: dibuja radio
map.getContainer().addEventListener("mousemove", e => {
  if (!midiendoDerecho || !puntoMedicion) return;

  const destino = map.mouseEventToLatLng(e);
  dibujarMedicion(puntoMedicion, destino);
});

// SOLTAR BOTÓN DERECHO: termina medición
map.getContainer().addEventListener("mouseup", e => {
  if (e.button !== 2) return;
  if (!midiendoDerecho || !puntoMedicion) return;

  const destino = map.mouseEventToLatLng(e);
  midiendoDerecho = false;

  dibujarMedicion(puntoMedicion, destino);
});

// ===============================
// EVALUACIÓN DE PROXIMIDAD
// ===============================

function buscarMasCercano(origen) {
  let min = Infinity;
  let cercano = null;

  datos.forEach(p => {
    if (!p.lat || !p.lon) return;

    const d = distanciaKm(origen, {
      lat: p.lat,
      lng: p.lon
    });

    if (d < min) {
      min = d;
      cercano = p;
    }
  });

  return { punto: cercano, distancia: min };
}

function evaluarDesdePunto(punto) {
  const obj = buscarMasCercano(punto);
  if (!obj || !obj.punto) return;

  if (marcadorCercano) {
    capaMedicion.removeLayer(marcadorCercano);
  }

  marcadorCercano = L.circleMarker([obj.punto.lat, obj.punto.lon], {
    radius: 12,
    color: "#ffffff",
    fillColor: "#ef4444",
    fillOpacity: 1,
    weight: 3
  })
  .addTo(capaMedicion)
  .bindPopup(`
    <b>Infraestructura más cercana</b><br>
    ${obj.punto.nombre}<br>
    ${obj.punto.tipo}<br>
    ${obj.distancia.toFixed(2)} km
  `);

  mostrarResultadoEvaluacion(punto, obj);
}

function mostrarResultadoParcial(radio) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  resultado.innerHTML = `
    <b>Radio manual:</b> ${radio.toFixed(2)} km<br>
    Suelta el mouse para evaluar el punto inicial.
  `;
}

function mostrarResultadoEvaluacion(punto, obj) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  const nivel = alertaPorDistancia(obj.distancia);
  let clase = "verde";

  if (nivel === "ALTO RIESGO") clase = "rojo";
  if (nivel === "PRECAUCIÓN") clase = "amarillo";

  resultado.innerHTML = `
    <b>Ubicación evaluada:</b><br>
    ${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}<br><br>

    <b>Más cercano:</b><br>
    ${obj.punto.nombre}<br>
    <b>Tipo:</b> ${obj.punto.tipo}<br>
    <b>OACI:</b> ${obj.punto.codigo_oaci || "S/I"}<br>
    <b>Comuna:</b> ${obj.punto.comuna || "S/I"}<br>
    <b>Distancia:</b> ${obj.distancia.toFixed(2)} km

    <div class="alerta ${clase}">${nivel}</div>
  `;
}


// ===============================
// EVENTOS UI
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tipoFiltro")?.addEventListener("change", cargarPuntos);
  document.getElementById("busqueda")?.addEventListener("input", cargarPuntos);
});
