import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetMini
} from 'unocss';

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
        width: '1.4em',
        height: '1.4em'
        // ...
      }
    }),
    presetMini()
  ]
});
