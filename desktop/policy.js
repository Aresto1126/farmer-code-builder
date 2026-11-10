import path from 'node:path';

/** Resolve a URL to a bundled file, never to a remote or parent resource. */
export function resolveAsset(rawUrl,root){
 const url=new URL(rawUrl);
 if(url.protocol!=='fcb:'||url.hostname!=='app'||url.username||url.password||url.port)throw new Error('Unsupported origin');
 const pathname=decodeURIComponent(url.pathname).replaceAll('\\','/');
 if(pathname.includes('\0')||pathname.includes(':')||pathname.split('/').some(part=>part==='..'))throw new Error('Unsafe asset path');
 const resolved=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 const rel=path.relative(root,resolved);
 if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Asset outside bundle');
 return resolved;
}
export function allowNavigation(rawUrl){
 try{
  const url=new URL(rawUrl);
  return url.protocol==='fcb:'&&url.hostname==='app'&&!url.username&&!url.password&&!url.port&&!url.search&&['/','/index.html'].includes(url.pathname);
 }catch{return false;}
}
