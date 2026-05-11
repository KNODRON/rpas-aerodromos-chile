// ===============================
// CARGA DE DATOS
// ===============================

let datos = [];

async function cargarDatos() {
  try {
    const [aerodromosResp, helipuertosResp] = await Promise.all([
      fetch("data/aerodromos_chile.json"),
      fetch("data/helipuertos_chile_osm.json")
    ]);

    const aerodromos = aerodromosResp.ok ? await aerodromosResp.json() : [];
    const helipuertos = helipuertosResp.ok ? await helipuertosResp.json() : [];

    datos = [...aerodromos, ...helipuertos];

    console.log(`Datos cargados: ${datos.length}`);
    console.log(`Aeródromos/Aeropuertos: ${aerodromos.length}`);
    console.log(`Helipuertos OSM: ${helipuertos.length}`);

    if (typeof cargarPuntos === "function") {
      cargarPuntos();
    }

  } catch (error) {
    console.error("Error cargando datos:", error);

    const resultado = document.getElementById("resultado");
    if (resultado) {
      resultado.innerHTML = "Error cargando datos aeronáuticos. Revisa los archivos JSON en la carpeta data.";
    }
  }
}

document.addEventListener("DOMContentLoaded", cargarDatos);
