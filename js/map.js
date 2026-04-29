// ===============================
// MAPA BASE
// ===============================

let map = L.map("map", {
  zoomControl: true
}).setView([-35, -71], 5);

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

// ===============================
// VARIABLES
// ===============================

let marcadorCercano = null;
let puntoMedicion = null;
let midiendoDerecho = false;

// ===============================
// COLORES
// ===============================

function colorPorTipo(tipo) {
  if (tipo === "Aeropuerto") return "#ef4444";
  if (tipo === "Aeródromo") return "#f97316";
  return "#38bdf8";
}

function colorPorRiesgo(km) {
  if (km <= 3) return "#ef4444";
  if (km <= 5) return "#facc15";
  return "#22c55e";
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
        <b>Tipo:</b> ${p.tipo || "S/I"}<br>
        <b>OACI:</b> ${p.codigo_oaci || "S/I"}<br>
        <b>Región:</b> ${p.region || "S/I"}<br>
        <b>Comuna:</b> ${p.comuna || "S/I"}<br>
        <b>Uso:</b> ${p.uso || "S/I"}<br><br>
        <button class="popup-btn" onclick="abrirNotamAerodromo('${p.codigo_oaci || ""}')">
          Ver NOTAM
        </button>
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
// CLIC IZQUIERDO: EVALUAR PUNTO
// ===============================

map.on("click", e => {
  if (midiendoDerecho) return;
  evaluarDesdePunto(e.latlng, true);
});

// ===============================
// BOTÓN DERECHO: MEDIR RADIO
// ===============================

map.getContainer().addEventListener("contextmenu", e => {
  e.preventDefault();
});

map.getContainer().addEventListener("mousedown", e => {
  if (e.button !== 2) return;

  e.preventDefault();

  puntoMedicion = map.mouseEventToLatLng(e);
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

map.getContainer().addEventListener("mousemove", e => {
  if (!midiendoDerecho || !puntoMedicion) return;

  e.preventDefault();

  const destino = map.mouseEventToLatLng(e);
  dibujarMedicion(puntoMedicion, destino);
});

map.getContainer().addEventListener("mouseup", e => {
  if (e.button !== 2) return;
  if (!midiendoDerecho || !puntoMedicion) return;

  e.preventDefault();

  const destino = map.mouseEventToLatLng(e);
  midiendoDerecho = false;

  dibujarMedicion(puntoMedicion, destino);
});

// ===============================
// DIBUJAR MEDICIÓN
// ===============================

function dibujarMedicion(origen, destino) {
  capaMedicion.clearLayers();

  const radio = distanciaKm(origen, destino);
  const color = colorPorRiesgo(radio);
  const cercano = buscarMasCercano(origen);

  L.circleMarker(origen, {
    radius: 8,
    color: "#ffffff",
    fillColor: "#22c55e",
    fillOpacity: 1,
    weight: 3
  }).addTo(capaMedicion);

  L.polyline([origen, destino], {
    color: color,
    weight: 3,
    dashArray: "8,8"
  }).addTo(capaMedicion);

  L.circle(origen, {
    radius: radio * 1000,
    color: color,
    fillColor: color,
    fillOpacity: 0.08,
    weight: 2
  }).addTo(capaMedicion);

  if (cercano && cercano.punto) {
    L.circleMarker([cercano.punto.lat, cercano.punto.lon], {
      radius: 12,
      color: "#ffffff",
      fillColor: "#ef4444",
      fillOpacity: 1,
      weight: 3
    })
      .addTo(capaMedicion)
      .bindPopup(`
        <b>Infraestructura más cercana</b><br>
        ${cercano.punto.nombre}<br>
        ${cercano.punto.tipo}<br>
        ${cercano.distancia.toFixed(2)} km
      `);
  }

  mostrarResultadoMedicion(origen, radio, cercano);
}

function mostrarResultadoMedicion(origen, radio, cercano) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  resultado.innerHTML = `
    <b>Medición manual:</b><br>
    Origen: ${origen.lat.toFixed(6)}, ${origen.lng.toFixed(6)}<br>
    Radio medido: ${radio.toFixed(2)} km<br><br>

    <b>Más cercano desde el origen:</b><br>
    ${cercano?.punto?.nombre || "S/I"}<br>
    <b>Tipo:</b> ${cercano?.punto?.tipo || "S/I"}<br>
    <b>OACI:</b> ${cercano?.punto?.codigo_oaci || "S/I"}<br>
    <b>Distancia:</b> ${cercano?.distancia?.toFixed(2) || "S/I"} km
  `;
}

// ===============================
// LIMPIAR MEDICIÓN
// ===============================

function limpiarMedicion() {
  capaMedicion.clearLayers();
  marcadorCercano = null;
  puntoMedicion = null;
  midiendoDerecho = false;

  const resultado = document.getElementById("resultado");
  if (resultado) {
    resultado.innerHTML = "Selecciona tu ubicación o haz clic en el mapa para consultar. Usa botón derecho + arrastrar para medir distancia.";
  }
}

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

function evaluarDesdePunto(punto, limpiar = true) {
  const obj = buscarMasCercano(punto);
  if (!obj || !obj.punto) return;

  if (limpiar) capaMedicion.clearLayers();

  L.circleMarker([punto.lat, punto.lng], {
    radius: 8,
    color: "#ffffff",
    fillColor: "#22c55e",
    fillOpacity: 1,
    weight: 3
  }).addTo(capaMedicion);

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

  L.polyline(
    [
      [punto.lat, punto.lng],
      [obj.punto.lat, obj.punto.lon]
    ],
    {
      color: "#facc15",
      weight: 3,
      dashArray: "8,8"
    }
  ).addTo(capaMedicion);

  mostrarResultadoEvaluacion(punto, obj);
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
// CONTROL PERSONALIZADO DE CAPAS
// ===============================

function toggleLayer(checkbox, capa, elemento) {
  if (checkbox.checked) {
    map.addLayer(capa);
    elemento.classList.add("active");
  } else {
    map.removeLayer(capa);
    elemento.classList.remove("active");
  }
}

// ===============================
// EVENTOS UI
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tipoFiltro")?.addEventListener("change", cargarPuntos);
  document.getElementById("busqueda")?.addEventListener("input", cargarPuntos);

  const chkAerodromos = document.getElementById("chkAerodromos");
  const chkWMS = document.getElementById("chkWMS");
  const chkMedicion = document.getElementById("chkMedicion");

  const aerodromosEl = chkAerodromos?.closest(".layer-option");
  const wmsEl = chkWMS?.closest(".layer-option");
  const medicionEl = chkMedicion?.closest(".layer-option");

  if (chkAerodromos?.checked) aerodromosEl?.classList.add("active");
  if (chkWMS?.checked) wmsEl?.classList.add("active");
  if (chkMedicion?.checked) medicionEl?.classList.add("active");

  chkAerodromos?.addEventListener("change", () => {
    toggleLayer(chkAerodromos, capaAerodromos, aerodromosEl);
  });

  chkWMS?.addEventListener("change", () => {
    toggleLayer(chkWMS, capaWMS, wmsEl);
  });

  chkMedicion?.addEventListener("change", () => {
    toggleLayer(chkMedicion, capaMedicion, medicionEl);
  });
});
