import {cpSync,mkdirSync} from 'node:fs';
mkdirSync(new URL('../public/',import.meta.url),{recursive:true});
cpSync(new URL('../node_modules/blockly/media/',import.meta.url),new URL('../public/blockly-media/',import.meta.url),{recursive:true});
