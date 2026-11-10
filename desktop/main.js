import {app,BrowserWindow,Menu,dialog,net,protocol,session} from 'electron';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveAsset,allowNavigation} from './policy.js';

app.setName('Farmer Code Builder');
app.setAppUserModelId('io.github.aresto1126.farmercodebuilder');
protocol.registerSchemesAsPrivileged([{scheme:'fcb',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
const root=fileURLToPath(new URL('../dist/',import.meta.url));
let mainWindow;
const gotLock=app.requestSingleInstanceLock();
if(!gotLock)app.quit();
else {
 app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
 app.whenReady().then(async()=>{
  protocol.handle('fcb',async request=>{
   try{
    const response=await net.fetch(pathToFileURL(resolveAsset(request.url,root)).href);
    const headers=new Headers(response.headers);
    headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'");
    headers.set('X-Content-Type-Options','nosniff');
    return new Response(response.body,{status:response.status,headers});
   }catch{return new Response('Not found',{status:404});}
  });
  session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(permission==='clipboard-sanitized-write'&&allowNavigation(contents.getURL())));
  session.defaultSession.setPermissionCheckHandler((_contents,permission,origin)=>permission==='clipboard-sanitized-write'&&origin==='fcb://app');
  session.defaultSession.on('will-download',(_event,item)=>{
   const fileName=path.basename(item.getFilename()).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_');
   item.setSaveDialogOptions({title:'ファイルを保存',defaultPath:path.join(app.getPath('downloads'),fileName)});
   item.once('done',(_e,state)=>{if(state==='interrupted')dialog.showErrorBox('保存できませんでした','保存先の空き容量やアクセス権を確認し、もう一度出力してください。');});
  });
  const menu=[
   {label:'ファイル',submenu:[{role:'quit',label:'終了'}]},
   {label:'編集',submenu:[{role:'undo',label:'元に戻す'},{role:'redo',label:'やり直す'},{type:'separator'},{role:'cut',label:'切り取り'},{role:'copy',label:'コピー'},{role:'paste',label:'貼り付け'},{role:'selectAll',label:'すべて選択'}]},
   {label:'表示',submenu:[{role:'resetZoom',label:'標準サイズ'},{role:'zoomIn',label:'拡大'},{role:'zoomOut',label:'縮小'},{type:'separator'},{role:'togglefullscreen',label:'全画面表示'}]},
   {label:'ヘルプ',submenu:[{label:'このアプリについて',click:()=>dialog.showMessageBox(mainWindow,{type:'info',title:'Farmer Code Builder',message:`Farmer Code Builder ${app.getVersion()}`,detail:'農家は Replace() されました 向けの非公式コード構築アプリ。\n完全ローカル動作・基本ゲーム・単一ドローン向け。\nAPI資料照合: Steam build 26462009。ゲーム内実行は未検証。'})}]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  mainWindow=new BrowserWindow({width:1440,height:960,minWidth:850,minHeight:650,show:false,title:'Farmer Code Builder',backgroundColor:'#f5f4ee',icon:fileURLToPath(new URL('../build/icon.ico',import.meta.url)),webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,spellcheck:false}});
  mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(!allowNavigation(url))event.preventDefault();});
  mainWindow.webContents.on('will-attach-webview',event=>event.preventDefault());
  mainWindow.webContents.on('will-prevent-unload',event=>{
   const choice=dialog.showMessageBoxSync(mainWindow,{type:'warning',title:'未保存の変更があります',message:'変更を保存せずに終了しますか？',detail:'編集に戻って保存するか、JSONファイルに出力すると作業を残せます。',buttons:['編集に戻る','保存せず終了'],defaultId:0,cancelId:0,noLink:true});
   // Electron uses preventDefault here to override the renderer's unload veto.
   if(choice===1)event.preventDefault();
  });
  mainWindow.once('ready-to-show',()=>mainWindow.show());
  // Hidden-start Windows launches may not emit ready-to-show promptly.
  mainWindow.webContents.once('did-finish-load',()=>mainWindow.show());
  mainWindow.webContents.on('did-fail-load',(_event,code,description,_url,isMainFrame)=>{if(isMainFrame&&code!==-3)dialog.showErrorBox('起動できませんでした',`アプリの画面を読み込めませんでした。\n${description}`);});
  await mainWindow.loadURL('fcb://app/index.html');
 }).catch(error=>{dialog.showErrorBox('起動できませんでした',error.message);app.quit();});
 app.on('window-all-closed',()=>app.quit());
}
