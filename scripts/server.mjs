import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.mp3':'audio/mpeg','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const rel=relative(root,target);
  if(rel.startsWith('..')||rel.includes(':')){res.writeHead(403);res.end();return;}
  const content=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(5178,'127.0.0.1',()=>console.log('Farmer Code Builder: http://127.0.0.1:5178/'));
