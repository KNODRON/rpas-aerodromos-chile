// ===============================
// EVALUADOR OPERACIONAL RPAS
// ===============================

let ultimoInforme = "";

function nivelRiesgo(km) {
  if (km <= 3) {
    return {
      nivel: "ALTO RIESGO",
      clase: "rojo",
      recomendacion: "Infraestructura aeronáutica a menos de 3 km. Requiere revisión operacional específica y validación con fuentes oficiales DGAC/AIP/NOTAM antes de cualquier operación RPAS."
    };
  }

  if (km <= 5) {
    return {
      nivel: "PRECAUCIÓN",
      clase: "amarillo",
      recomendacion: "Infraestructura aeronáutica entre 3 y 5 km. Se recomienda análisis complementario, revisión de espacio aéreo y eventuales coordinaciones operacionales."
    };
  }

  return {
    nivel: "REFERENCIAL / BAJO",
    clase: "verde",
    recomendacion: "Distancia superior a 5 km respecto de la infraestructura más cercana registrada en la base. De todos modos, debe validarse con fuentes oficiales vigentes."
  };
}

function evaluarPuntoActual() {
  let punto = null;

  if (marcadorUbicacion) {
    const pos = marcadorUbicacion.getLatLng();
    punto = { lat: pos.lat, lng: pos.lng };
  } else if (inicioMedicion) {
    punto = inicioMedicion;
  } else {
    alert("Primero usa tu ubicación o realiza una medición en el mapa.");
    return;
  }

  const obj = buscarMasCercano(punto);

  if (!obj || !obj.punto) {
    alert("No hay datos cargados para evaluar.");
    return;
  }

  const riesgo = nivelRiesgo(obj.distancia);

  ultimoInforme =
`EVALUACIÓN PRELIMINAR RPAS

Ubicación consultada:
Latitud: ${punto.lat.toFixed(6)}
Longitud: ${punto.lng.toFixed(6)}

Infraestructura aeronáutica más cercana:
Nombre: ${obj.punto.nombre || "S/I"}
Tipo: ${obj.punto.tipo || "S/I"}
Código OACI: ${obj.punto.codigo_oaci || obj.punto.codigo || "S/I"}
Región: ${obj.punto.region || "S/I"}
Comuna: ${obj.punto.comuna || "S/I"}
Distancia aproximada: ${obj.distancia.toFixed(2)} km

Nivel preliminar:
${riesgo.nivel}

Recomendación:
${riesgo.recomendacion}

Nota:
Esta evaluación es referencial y no reemplaza la validación oficial mediante DGAC, AIP, NOTAM, cartas aeronáuticas vigentes o plataformas autorizadas de gestión de espacio aéreo.`;

  const resultado = document.getElementById("resultado");

  if (resultado) {
    resultado.innerHTML = `
      <b>EVALUACIÓN PRELIMINAR RPAS</b><br><br>
      <b>Ubicación:</b><br>
      ${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}<br><br>

      <b>Más cercano:</b><br>
      ${obj.punto.nombre || "S/I"}<br>
      <b>Tipo:</b> ${obj.punto.tipo || "S/I"}<br>
      <b>OACI:</b> ${obj.punto.codigo_oaci || obj.punto.codigo || "S/I"}<br>
      <b>Comuna:</b> ${obj.punto.comuna || "S/I"}<br>
      <b>Distancia:</b> ${obj.distancia.toFixed(2)} km<br><br>

      <div class="alerta ${riesgo.clase}">${riesgo.nivel}</div>

      <br><b>Recomendación:</b><br>
      ${riesgo.recomendacion}
    `;
  }
}

function copiarInforme() {
  if (!ultimoInforme) {
    alert("Primero genera una evaluación.");
    return;
  }

  navigator.clipboard.writeText(ultimoInforme)
    .then(() => alert("Informe copiado al portapapeles."))
    .catch(() => alert("No se pudo copiar el informe."));
}
