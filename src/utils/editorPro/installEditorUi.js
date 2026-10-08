import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import '@/styles/editorPro.css'
import '@/assets/editorpro/fonts/font.css'

const installedApps = new WeakSet()

export function installEditorUi(app) {
  if (installedApps.has(app)) return
  app.use(ViewUIPlus)
  installedApps.add(app)
}
