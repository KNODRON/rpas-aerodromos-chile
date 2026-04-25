let map = L.map('map').setView([-35,-71],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  .addTo(map);

let capa = L.layerGroup().addTo(map);

function cargarPuntos(){
  datos.forEach(p=>{
    L.circleMarker([p.lat,p.lon],{
      radius:5,
      color:"orange"
    }).addTo(capa)
    .bindPopup(p.nombre);
  });
}

function centrarChile(){
  map.setView([-35,-71],5);
}
L.tileLayer.wms("https://geoportal.cl/geoserver/Infraestructura_Aerea/ows", {
  layers: "infraestructura_area",
  format: "image/png",
  transparent: true,
  attribution: "IDE Chile"
}).addTo(map);
