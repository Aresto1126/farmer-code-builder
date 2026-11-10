import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const url='http://127.0.0.1:5178/';
async function healthy(){try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});return r.ok&&(await r.text()).includes('Farmer Code Builder');}catch{return false;}}
if(!await healthy()){
 const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{detached:true,stdio:'ignore',windowsHide:true});child.unref();
 for(let n=0;n<30&&!await healthy();n++)await new Promise(r=>setTimeout(r,200));
}
if(!await healthy()){console.error('起動できません。ポート5178が別アプリに使われていないか確認してください。');process.exit(1);}
if(process.argv.includes('--no-open'))console.log(url);
else {const child=spawn('cmd.exe',['/c','start','',url],{stdio:'ignore',windowsHide:true});child.unref();}
