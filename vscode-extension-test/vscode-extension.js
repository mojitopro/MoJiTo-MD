export function activate(context) {
  window.acode.alert("Extensión activa", "La API de VSCode ya funciona dentro de Acode.");
}

export function deactivate() {
  window.acode.alert("Extensión desactivada", "La extensión fue desactivada.");
}
