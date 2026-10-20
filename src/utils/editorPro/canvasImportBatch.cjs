// Import hooks can resize the workspace and remove many objects. Keep those
// operations in one transaction instead of rendering/snapshotting each step.
async function runCanvasImportBatch(canvas, task) {
  if (canvas.kidstoryImporting) return task();
  const render = canvas.renderAll;
  const request = canvas.requestRenderAll;
  const ownRender = Object.prototype.hasOwnProperty.call(canvas, 'renderAll');
  const ownRequest = Object.prototype.hasOwnProperty.call(canvas, 'requestRenderAll');
  const renderOnAddRemove = canvas.renderOnAddRemove;
  canvas.cancelRequestedRender?.();
  canvas.kidstoryImporting = true;
  canvas.renderOnAddRemove = false;
  canvas.renderAll = canvas.requestRenderAll = () => canvas;
  let success = false;
  let result;
  let failure;
  try {
    canvas.fire('import:batch:start');
    result = await task();
    success = true;
  } catch (error) {
    failure = { error };
  } finally {
    if (ownRender) canvas.renderAll = render;
    else delete canvas.renderAll;
    if (ownRequest) canvas.requestRenderAll = request;
    else delete canvas.requestRenderAll;
    canvas.renderOnAddRemove = renderOnAddRemove;
    canvas.kidstoryImporting = false;
    try { canvas.renderAll(); }
    catch (error) { success = false; failure ||= { error }; }
    finally { canvas.fire('import:batch:end', { success }); }
  }
  if (failure) throw failure.error;
  return result;
}

module.exports = { runCanvasImportBatch };
