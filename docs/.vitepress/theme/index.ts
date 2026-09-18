import DefaultTheme from 'vitepress/theme'
import ModelDemo from '../../components/ModelDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModelDemo', ModelDemo)
  }
}
