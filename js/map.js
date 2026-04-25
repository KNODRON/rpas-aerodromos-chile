// ===============================
// MAPA BASE
// ===============================

let map = L.map("map").setView([-35, -71], 5);

let mapaBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);


// ===============================
// CAPAS
// ===============================

let capaAerodromos = L.layerGroup().addTo(map);

let capaWMS = L.tileLayer.wms("https://geoportal.cl/geoserver/Infraestructura_Aerea/ows", {
  layers: "infraestructura_area",
  format: "image/png",
  transparent: true,
  attribution: "IDE Chile"
});

// Si quieres que la capa WMS aparezca encendida al inicio, deja esta línea.
// Si no, bórrala o coméntala.
// capaWMS.addTo(map);

let controlCapas = L.control.layers(
  {
    "Mapa base": mapaBase
  },
  {
    "Aeródromos / Aeropuertos JSON": capaAerodromos,
    "Infraestructura Aérea IDE Chile (WMS)": capaWMS
    "Radio de influencia": capaRadio
  },
  {
    collapsed: false
  }
).addTo(map);


// ===============================
// FUNCIONES DE COLOR
// ===============================

function colorPorTipo(tipo) {
  if (tipo === "Aeropuerto") return "red";
  if (tipo === "Aeródromo") return "orange";
  return "blue";
}


// ===============================
// CARGAR PUNTOS JSON
// ===============================

function cargarPuntos() {
  capaAerodromos.clearLayers();

// ===============================
// CENTRAR MAPA
// ===============================

function centrarChile() {
  map.setView([-35, -71], 5);
}

function aplicarFiltroRadio(){
  radioActivo = parseFloat(document.getElementById("radioFiltro").value);
  cargarPuntos();
}

// ===============================
// MEDICIÓN DINÁMICA
// ===============================

let inicioMedicion = null;
let lineaMedicion = null;
let circuloMedicion = null;
let marcadorInicio = null;
let marcadorCercano = null;
let midiendo = false;
let ultimoCentro = null;   // punto desde donde filtras (ubicación o medición)
let radioActivo = 0;       // km

map.on("mousedown", function(e) {
  inicioMedicion = e.latlng;
  midiendo = true;

  if (marcadorInicio) map.removeLayer(marcadorInicio);

  marcadorInicio = L.circleMarker(inicioMedicion, {
    radius: 8,
    color: "#ffffff",
    fillColor: "#22c55e",
    fillOpacity: 1,
    weight: 3
  }).addTo(map);
});

map.on("mousemove", function(e) {
  if (!midiendo || !inicioMedicion) return;

  actualizarMedicion(e.latlng);
});

map.on("mouseup", function(e) {
  if (!midiendo || !inicioMedicion) return;

  midiendo = false;
  actualizarMedicion(e.latlng);
});

capaRadio.clearLayers();

datos.forEach(p => {
  if (!p.lat || !p.lon) return;

  let d = distanciaKm(inicioMedicion, {
    lat: p.lat,
    lng: p.lon
  });

  if (d <= distanciaManual) {
    L.circleMarker([p.lat, p.lon], {
      radius: 7,
      color: "#facc15",
      fillColor: "#facc15",
      fillOpacity: 0.7,
      weight: 2
    })
    .bindPopup(`
      <b>${p.nombre}</b><br>
      ${p.tipo}<br>
      ${d.toFixed(2)} km
    `)
    .addTo(capaRadio);
  }
});
function actualizarMedicion(destino) {
  let distanciaManual = distanciaKm(inicioMedicion, destino);
  let cercano = buscarMasCercano(inicioMedicion);

  if (lineaMedicion) map.removeLayer(lineaMedicion);
  if (circuloMedicion) map.removeLayer(circuloMedicion);
  if (marcadorCercano) map.removeLayer(marcadorCercano);

  lineaMedicion = L.polyline([inicioMedicion, destino], {
    color: "yellow",
    weight: 3,
    dashArray: "8,8"
  }).addTo(map);

  circuloMedicion = L.circle(inicioMedicion, {
  radius: distanciaManual * 1000,
  color: "#facc15",
  weight: 2,
  fillColor: "#facc15",
  fillOpacity: 0.08
}).addTo(capaRadio);

  if (cercano && cercano.punto) {
    marcadorCercano = L.circleMarker([cercano.punto.lat, cercano.punto.lon], {
      radius: 12,
      color: "#ffffff",
      fillColor: "red",
      fillOpacity: 1,
      weight: 3
    })
    .addTo(map)
    .bindPopup(`
      <b>Más cercano</b><br>
      ${cercano.punto.nombre}<br>
      ${cercano.punto.tipo}<br>
      ${cercano.distancia.toFixed(2)} km
    `);

    let resultado = document.getElementById("resultado");

    if (resultado) {
      resultado.innerHTML = `
        <b>Radio manual:</b> ${distanciaManual.toFixed(2)} km<br>
        <b>Más cercano:</b> ${cercano.punto.nombre}<br>
        <b>Tipo:</b> ${cercano.punto.tipo}<br>
        <b>Distancia al más cercano:</b> ${cercano.distancia.toFixed(2)} km<br>
        <b>Evaluación:</b> ${alertaPorDistancia(cercano.distancia)}
      `;
    }
  }
}

function limpiarMedicion() {
  inicioMedicion = null;
  midiendo = false;
  capaRadio.clearLayers();

  if (lineaMedicion) map.removeLayer(lineaMedicion);
  if (circuloMedicion) map.removeLayer(circuloMedicion);
  if (marcadorInicio) map.removeLayer(marcadorInicio);
  if (marcadorCercano) map.removeLayer(marcadorCercano);

  lineaMedicion = null;
  circuloMedicion = null;
  marcadorInicio = null;
  marcadorCercano = null;

  let resultado = document.getElementById("resultado");
  if (resultado) resultado.innerHTML = "Medición limpiada.";
}


// ===============================
// BUSCAR MÁS CERCANO
// ===============================

function buscarMasCercano(origen) {
  if (!datos || datos.length === 0) return null;

  let distanciaMinima = Infinity;
  let puntoMasCercano = null;

  datos.forEach(p => {
    if (!p.lat || !p.lon) return;

    let d = distanciaKm(origen, {
      lat: p.lat,
      lng: p.lon
    });

    if (d < distanciaMinima) {
      distanciaMinima = d;
      puntoMasCercano = p;
    }
  });

  return {
    punto: puntoMasCercano,
    distancia: distanciaMinima
  };
}
