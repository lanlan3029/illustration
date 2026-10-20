// Imported design templates are paper layouts. Composite their translucent
// paper color over white instead of exposing the editor's transparency grid.
function opaquePaperColor(color) {
  if (typeof color !== 'string') return color;
  const value = color.trim();
  let channels, alpha;
  const hex = /^#([a-f\d]{4}|[a-f\d]{8})$/i.exec(value);
  const rgba = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(value);
  if (hex) {
    const full = hex[1].length === 4 ? [...hex[1]].map(c => c + c).join('') : hex[1];
    channels = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
    alpha = parseInt(full.slice(6, 8), 16) / 255;
  } else if (rgba) {
    channels = rgba.slice(1, 4).map(Number);
    alpha = Math.max(0, Math.min(1, Number(rgba[4])));
  } else if (value === 'transparent') {
    return '#ffffff';
  } else {
    return color;
  }
  if (alpha === 1) return color;
  return '#' + channels.map(c => Math.round(Math.max(0, Math.min(255, c)) * alpha + 255 * (1 - alpha))
    .toString(16).padStart(2, '0')).join('');
}

function repairLegacyDesignTemplateBackground(json) {
  const objects = json?.objects;
  if (!Array.isArray(objects)) return json;
  const workspace = objects.find(o => o.id === 'workspace');
  // Match only the exact pilot artifact and its original translucent color.
  // Leave deliberately transparent user canvases and user-changed colors alone.
  if (workspace?.fill?.toLowerCase?.() === '#d4915738' &&
    objects.some(o => typeof o.id === 'string' && o.id.startsWith('warm-love-square-'))) {
    workspace.fill = opaquePaperColor(workspace.fill);
  }
  return json;
}

module.exports = { opaquePaperColor, repairLegacyDesignTemplateBackground };
