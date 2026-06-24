import { Modal } from 'view-ui-plus';

/**
 * 将绘本版式 JSON 载入 EditorPro 画布
 * @param {object} canvasEditor
 * @param {object} template - { json, nameKey? }
 * @param {object} i18n - { t, ok, cancel, tip, replaceTip }
 */
export function applyPictureBookTemplate(canvasEditor, template, i18n) {
  if (!canvasEditor || !template?.json) return Promise.resolve(false);

  return new Promise((resolve) => {
    Modal.confirm({
      title: i18n.tip,
      content: `<p>${i18n.replaceTip}</p>`,
      okText: i18n.ok,
      cancelText: i18n.cancel,
      onOk: () => {
        const payload = JSON.stringify(template.json);
        canvasEditor.loadJSON(payload, () => {
          if (typeof canvasEditor.clearAndSaveState === 'function') {
            canvasEditor.clearAndSaveState();
          } else if (typeof canvasEditor.historyUpdate === 'function') {
            canvasEditor.historyUpdate();
          }
          resolve(true);
        });
      },
      onCancel: () => resolve(false),
    });
  });
}
