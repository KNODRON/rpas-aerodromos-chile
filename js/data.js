let datos = [];

fetch("data/aerodromos_chile.json")
  .then(r => r.json())
  .then(json => {
    datos = json;
    cargarPuntos();
  });
