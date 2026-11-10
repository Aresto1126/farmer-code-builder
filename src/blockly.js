import * as BlocklyModule from 'blockly/core';
// Blockly exposes CommonJS under Node and named ES exports in the browser.
export const Blockly = Reflect.get(BlocklyModule,'default') || BlocklyModule;
