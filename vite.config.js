import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{output:{manualChunks:{blockly:['blockly/core','blockly/msg/ja']}}}}});
