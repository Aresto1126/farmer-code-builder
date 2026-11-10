import {Blockly} from './blockly.js';
import {createIcons, Sprout, SlidersHorizontal, CircleHelp, FolderOpen, FilePlus2, CopyPlus, Save, Download, Search, Repeat2, Move, ScanEye, Calculator, Variable, Braces, Flower2, BookOpen, ArrowUpRight, Blocks, Undo2, Redo2, Maximize, AlignStartVertical, Code2, FileCode2, Copy, RefreshCw, ListChecks, Lightbulb, Info, MousePointer2, X, ArrowRight, TriangleAlert, CircleCheck, CircleX} from 'lucide';
import {registerBlocks,CATEGORIES,toolbox} from './blocks.js';
import {API,FEATURES,BUILD,defaultProfile} from './catalog.js';
import {compile} from './compiler.js';
import {createProject,validateProject,loadLocal,saveLocal,listLocal} from './project.js';
import {samples} from './samples.js';
import './style.css';

const $=s=>document.querySelector(s);
const iconSet={Sprout,SlidersHorizontal,CircleHelp,FolderOpen,FilePlus2,CopyPlus,Save,Download,Search,Repeat2,Move,ScanEye,Calculator,Variable,Braces,Flower2,BookOpen,ArrowUpRight,Blocks,Undo2,Redo2,Maximize,AlignStartVertical,Code2,FileCode2,Copy,RefreshCw,ListChecks,Lightbulb,Info,MousePointer2,X,ArrowRight,TriangleAlert,CircleCheck,CircleX};
const icons=()=>createIcons({icons:iconSet});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer,saveTimer,renderTimer,dirty=false,loading=false,preserveStored=false,selectedId=null;
function toast(message,error=false){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').className=`toast visible${error?' error':''}`;toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);}
function ask(title,message,action='続ける'){
 return new Promise(resolve=>{const dialog=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-text').textContent=message;$('#confirm-ok').textContent=action;const finish=v=>{dialog.close();resolve(v);};$('#confirm-ok').onclick=()=>finish(true);$('#confirm-cancel').onclick=()=>finish(false);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.showModal();});
}
registerBlocks();
const theme=Blockly.Theme.defineTheme('fieldNotes',{base:Blockly.Themes.Classic,componentStyles:{workspaceBackgroundColour:'#fcfcf7',toolboxBackgroundColour:'#f2f4ea',toolboxForegroundColour:'#708365',flyoutBackgroundColour:'#f3f5eb',flyoutForegroundColour:'#607450',flyoutOpacity:1,scrollbarColour:'#c6d0ba',insertionMarkerColour:'#7b9c66',insertionMarkerOpacity:.4,cursorColour:'#769463'},fontStyle:{family:'Yu Gothic UI, Meiryo, sans-serif',weight:'500',size:11},startHats:false});
const workspace=Blockly.inject('blockly',{toolbox:toolbox(CATEGORIES[0].types),theme,renderer:'zelos',sounds:false,media:'/blockly-media/',grid:{spacing:22,length:1,colour:'#dfe4d5',snap:false},zoom:{controls:true,wheel:true,startScale:.95,maxScale:1.7,minScale:.45,scaleSpeed:1.12},move:{scrollbars:true,drag:true,wheel:true},trashcan:true,collapse:true,comments:false,disable:false});
const resize=new ResizeObserver(()=>Blockly.svgResize(workspace));resize.observe($('#blockly'));
let project=createProject(samples[0].name,samples[0].workspace),result,activeCategory=0;
try{const stored=loadLocal(localStorage);if(stored){verifyWorkspace(stored);project=stored;}}catch(error){preserveStored=true;toast(`自動保存データを読めませんでした。元データは保持しています。${error.message}`,true);}
function snapshot(){return {...project,name:$('#project-name').value.trim()||'無題の農場',workspace:Blockly.serialization.workspaces.save(workspace),updatedAt:new Date().toISOString()};}
function save(manual=false,replaceInvalid=false){
 clearTimeout(saveTimer);
 if(preserveStored){$('#save-state').textContent='既存データ保持中';return false;}
 try{project=snapshot();saveLocal(localStorage,project,replaceInvalid);dirty=false;$('#save-state').textContent=`保存済み ${new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}`;$('#save-state').classList.remove('error');if(manual)toast('この端末に保存しました');return true;}
 catch(error){$('#save-state').textContent='保存できません — JSON保存をご利用ください';$('#save-state').classList.add('error');dirty=true;if(manual)toast(`保存できませんでした: ${error.message}`,true);return false;}
}
function changed(){if(loading)return;dirty=true;$('#save-state').textContent='保存中…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>save(),650);clearTimeout(renderTimer);renderTimer=setTimeout(render,90);}
function verifyWorkspace(p){
 validateProject(p);const temporary=new Blockly.Workspace();
 try{Blockly.serialization.workspaces.load(p.workspace,temporary);return Blockly.serialization.workspaces.save(temporary);}finally{temporary.dispose();}
}
function replaceProject(p){
 const safeState=verifyWorkspace(p),old=snapshot();loading=true;
 try{workspace.clear();Blockly.serialization.workspaces.load(safeState,workspace);project={...p,workspace:safeState};$('#project-name').value=project.name;workspace.clearUndo();workspace.scrollCenter();selectedId=null;}
 catch(error){workspace.clear();Blockly.serialization.workspaces.load(old.workspace,workspace);project=old;$('#project-name').value=old.name;throw error;}
 finally{loading=false;}
 render();changed();
}
replaceProject(project);
workspace.addChangeListener(event=>{
 if(event.type===Blockly.Events.SELECTED){selectedId=event.newElementId;showHint();highlightCode();return;}
 if(!event.isUiEvent)changed();
});
function category(index){activeCategory=index;$('#block-search').value='';workspace.updateToolbox(toolbox(CATEGORIES[index].types));document.querySelectorAll('.category').forEach((el,i)=>el.classList.toggle('active',i===index));$('#category-label').textContent=`${CATEGORIES[index].name}ブロック`;}
$('#categories').innerHTML=CATEGORIES.map((c,i)=>`<button class="category ${i===0?'active':''}" style="--category-color:${c.color}" data-category="${i}"><i data-lucide="${c.icon}"></i>${c.name}<span class="category-count">${String(c.types.length).padStart(2,'0')}</span></button>`).join('');
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b)category(Number(b.dataset.category));});
// Search descriptions and Japanese labels without adding blocks to the real workspace.
const searchWorkspace=new Blockly.Workspace();
const searchEntries=CATEGORIES.flatMap(c=>c.types).map(type=>{const b=searchWorkspace.newBlock(type);return {type,text:`${b.toString()} ${b.getTooltip()} ${type}`.toLowerCase()};});searchWorkspace.dispose();
$('#block-search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();if(!q){category(activeCategory);return;}workspace.updateToolbox(toolbox(searchEntries.filter(x=>x.text.includes(q)).map(x=>x.type)));document.querySelectorAll('.category').forEach(el=>el.classList.remove('active'));$('#category-label').textContent='検索結果';});
function colorCode(text){return escape(text).replace(/\b(while|True|False|if|else|for|in|range|def|return|and|or|not)\b|\b(\d+(?:\.\d+)?)\b|\b([a-z_]\w*)(?=\()/g,(word,kw,num,fn)=>`<span class="${kw?'code-keyword':num?'code-number':'code-call'}">${word}</span>`);}
function render(){
 result=compile(Blockly.serialization.workspaces.save(workspace),project.gameProfile);
 const errors=result.issues.filter(i=>i.severity==='error'),warnings=result.issues.filter(i=>i.severity==='warning');
 const code=result.code.trimEnd().split('\n');
 $('#code-output').innerHTML=result.code?code.map((line,i)=>`<button class="code-line" ${result.lineMap[i+1]?`data-block="${escape(result.lineMap[i+1])}"`:''} aria-label="${i+1}行目 ${escape(line)}"><span class="line-number">${i+1}</span><span class="line-content">${colorCode(line)||' '}</span></button>`).join(''):'<div class="code-line"><span class="line-number">1</span><span class="line-content code-comment"># ブロックを開始につなぎましょう</span></div>';
 $('#issues').innerHTML=result.issues.length?result.issues.map(i=>`<button class="issue ${i.severity}" ${i.blockId?`data-block="${escape(i.blockId)}"`:''}><i data-lucide="${i.severity==='error'?'circle-x':'triangle-alert'}"></i><span>${escape(i.message)}</span></button>`).join(''):'<div class="success-check"><i data-lucide="circle-check"></i>静的検査に問題はありません</div>';
 $('#issue-count').textContent=errors.length?`${errors.length} エラー`:warnings.length?`${warnings.length} 件の注意`:'問題なし';
 $('#py-export').disabled=!!errors.length||!result.code;$('#copy').disabled=$('#py-export').disabled;
 $('#block-count').textContent=`${workspace.getAllBlocks(false).length} ブロック`;
 $('#compile-state').textContent=errors.length?`要修正 · ${errors.length} エラー`:`コード生成済み · ${code.length} 行${warnings.length?' · 解放設定と注意を確認':''}`;
 workspace.getAllBlocks(false).forEach(b=>{const own=result.issues.filter(i=>i.blockId===b.id);b.setWarningText(own.length?own.map(i=>i.message).join('\n'):null);});
 icons();highlightCode();
}
function highlightCode(){document.querySelectorAll('.code-line').forEach(el=>el.classList.toggle('selected',el.dataset.block===selectedId));}
function showHint(){const b=workspace.getBlockById(selectedId);$('#hint-title').textContent=b?API[b.type]?.label||b.toString().slice(0,50):'ブロックを選んでみよう';$('#hint-text').textContent=b?b.getTooltip():'選択したブロックの役割と使い方が、ここに表示されます。';}
function focusBlock(id){const b=workspace.getBlockById(id);if(b){workspace.centerOnBlock(id);b.select();}}
for(const selector of ['#issues','#code-output'])$(selector).addEventListener('click',e=>{const el=e.target.closest('[data-block]');if(el)focusBlock(el.dataset.block);});
$('#project-name').addEventListener('input',changed);
$('#undo').onclick=()=>workspace.undo(false);$('#redo').onclick=()=>workspace.undo(true);$('#fit').onclick=()=>workspace.zoomToFit();$('#arrange').onclick=()=>workspace.cleanUp();
$('#save').onclick=async()=>{let replaceInvalid=false;if(preserveStored){if(!await ask('自動保存を再開しますか？','読み込めなかった以前の自動保存データを、今の作業で置き換えます。元のデータを残す場合はキャンセルしてください。','置き換えて保存'))return;preserveStored=false;replaceInvalid=true;}save(true,replaceInvalid);};
async function confirmReplace(){const saved=save();return ask('現在のワークスペースを切り替えますか？',saved?'現在のプロジェクトは保存しました。「開く」から戻せます。':'自動保存できていません。今の作業を残す場合はキャンセルし、先にJSON保存してください。','切り替える');}
$('#new').onclick=async()=>{if(!await confirmReplace())return;const p=createProject('無題の農場',{blocks:{languageVersion:0,blocks:[{type:'start',x:70,y:60}]}});p.gameProfile=structuredClone(project.gameProfile);replaceProject(p);toast('新しいプロジェクトを作成しました');};
$('#duplicate').onclick=()=>{if(!save()){toast('先にJSON保存で現在の作業を保存してください。',true);return;}const p=snapshot();p.projectId=crypto.randomUUID();p.name=(p.name+' のコピー').slice(0,100);p.createdAt=new Date().toISOString();replaceProject(p);toast('プロジェクトを複製しました。元のプロジェクトは「開く」から戻せます。');};
function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function filename(){return ($('#project-name').value.trim()||'farm').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,80);}
$('#json-export').onclick=()=>{download(JSON.stringify(snapshot(),null,2),'application/json',`${filename()}.farm.json`);toast('ブロックを含むJSONファイルを出力しました');};
$('#py-export').onclick=()=>{render();if(!$('#py-export').disabled){download(result.code,'text/x-python;charset=utf-8','main.py');toast('main.py を出力しました。ゲーム側で取り込んで実行してください。');}};
$('#copy').onclick=async()=>{render();if($('#copy').disabled)return;try{await navigator.clipboard.writeText(result.code);toast('コードをコピーしました');}catch{toast('コピーできませんでした。「.py を出力」をお使いください。',true);}};
$('#open').onclick=()=>{
 const list=$('#saved-projects');list.replaceChildren();
 try{
  const projects=listLocal(localStorage).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  for(const p of projects){
   const card=document.createElement('button');card.className='sample-card';
   card.innerHTML=`<span class="sample-art"><i data-lucide="folder-open"></i></span><span><h3>${escape(p.name)}</h3><p>${new Date(p.updatedAt).toLocaleString('ja-JP')}${p.projectId===project.projectId?' · 現在のプロジェクト':''}</p></span>`;
   card.onclick=()=>{
    if(!save()){toast('現在の作業をJSON保存してから切り替えてください。',true);return;}
    $('#open-dialog').close();
    try{const latest=listLocal(localStorage).find(item=>item.projectId===p.projectId);replaceProject(latest||p);toast('保存済みプロジェクトを開きました');}catch(error){toast(error.message,true);}
   };
   list.append(card);
  }
  if(!projects.length)list.textContent='保存済みプロジェクトはまだありません。';
 }
 catch(error){list.textContent=`保存データを読み込めません: ${error.message}`;}
 icons();$('#open-dialog').showModal();
};
$('#import-file').onclick=()=>{$('#open-dialog').close();$('#file-input').click();};
$('#file-input').onchange=async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 try{if(file.size>2_000_000)throw new Error('ファイルが大きすぎます（最大2MB）。');const p=validateProject(JSON.parse(await file.text()));verifyWorkspace(p);if(!await confirmReplace())return;replaceProject(p);toast('プロジェクトを読み込みました');}
 catch(error){toast(`読み込めませんでした。現在の作業は保持しています。${error.message}`,true);}
};
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
for(const id of ['help','handoff-help'])$('#'+id).onclick=()=>$('#help-dialog').showModal();
$('#samples').onclick=()=>$('#samples-dialog').showModal();
$('#sample-list').innerHTML=samples.map((s,i)=>`<button class="sample-card" data-sample="${i}"><span class="sample-art"><i data-lucide="${['sprout','blocks','flower-2','braces'][i]}"></i></span><span><h3>${escape(s.name)}</h3><p>${escape(s.description)}</p></span><i data-lucide="arrow-right"></i></button>`).join('');
$('#sample-list').onclick=async e=>{const el=e.target.closest('[data-sample]');if(!el)return;$('#samples-dialog').close();if(!await confirmReplace())return;const s=samples[Number(el.dataset.sample)],p=createProject(s.name,s.workspace);p.gameProfile=structuredClone(project.gameProfile);replaceProject(p);toast('サンプルを読み込みました。必要な解放設定を確認してください。');};
for(const [key,[label,kind]] of Object.entries(FEATURES)){
 const row=document.createElement('label');row.className='feature-row';row.innerHTML=`<span>${escape(label)}</span><select data-feature="${key}" aria-label="${escape(label)}の解放状況"><option value="unknown">未確認</option><option value="yes">使える</option><option value="no">未解放</option></select>`;$(kind==='language'?'#language-features':'#game-features').append(row);
}
$('#settings').onclick=()=>{$('#game-version').value=project.gameProfile.version===BUILD?BUILD:'unknown';$('#all-language').checked=project.gameProfile.allLanguage;document.querySelectorAll('[data-feature]').forEach(el=>el.value=project.gameProfile.unlocks[el.dataset.feature]||'unknown');$('#settings-dialog').showModal();};
$('#apply-settings').onclick=()=>{project.gameProfile={...defaultProfile(),version:$('#game-version').value,allLanguage:$('#all-language').checked,unlocks:Object.fromEntries([...document.querySelectorAll('[data-feature]')].map(el=>[el.dataset.feature,el.value]))};$('#settings-dialog').close();render();changed();toast('ゲームの解放設定を更新しました');};
window.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();$('#save').click();}if(e.key==='/'&&!typing&&!document.querySelector('dialog[open]')){e.preventDefault();$('#block-search').focus();}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
icons();
