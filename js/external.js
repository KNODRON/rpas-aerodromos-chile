function abrirNotamDGAC() {
  window.open("https://aipchile.dgac.gob.cl/notam", "_blank");
}

function abrirSkyVector() {
  window.open("https://skyvector.com", "_blank");
}

function abrirNotamAerodromo(codigoOaci) {
  if (!codigoOaci) {
    alert("No hay código OACI disponible.");
    return;
  }

  window.open(`https://aipchile.dgac.gob.cl/notam?designador=${codigoOaci}`, "_blank");
}
