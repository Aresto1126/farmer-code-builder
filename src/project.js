import {BLOCK_TYPES,defaultProfile} from './catalog.js';
import {registerBlocks,BLOCK_SCHEMA} from './blocks.js';
registerBlocks();
const KEY='farmer-code-builder.project.v1';
export function createProject(name,workspace){const now=new Date().toISOString();return {schemaVersion:1,projectId:crypto.randomUUID(),name,createdAt:now,updatedAt:now,gameProfile:defaultProfile(),workspace:structuredClone(workspace),generatorVersion:'0.1.0',exportSettings:{fileName:'main.py'}};}
export function validateProject(p){
 if(!p||p.schemaVersion!==1)throw new Error('このプロジェクト形式には対応していません（対応: バージョン1）。');
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100||typeof p.projectId!=='string')throw new Error('プロジェクト名またはIDが不正です。');
 if(!p.gameProfile||typeof p.gameProfile.version!=='string'||typeof p.gameProfile.allLanguage!=='boolean'||!p.gameProfile.unlocks||typeof p.gameProfile.unlocks!=='object')throw new Error('ゲーム設定が不正です。');
 if(Object.values(p.gameProfile.unlocks).some(v=>!['yes','no','unknown'].includes(v)))throw new Error('解放状況が不正です。');
 const tops=p.workspace?.blocks?.blocks;
 if(!Array.isArray(tops)||tops.length>2000)throw new Error('ブロックの保存形式が不正です。');
 let count=0;const seen=new Set(),ids=new Set();
 function block(b,depth=0){
  if(!b||typeof b!=='object'||seen.has(b)||depth>500||++count>2000)throw new Error('ブロック構造が複雑すぎるか、循環しています。');seen.add(b);
  if(!BLOCK_TYPES.includes(b.type))throw new Error(`未対応ブロック「${String(b.type).slice(0,60)}」。元のファイルは保持されています。`);
  const schema=BLOCK_SCHEMA[b.type],args=schema.args0||[];
  for(const [key,value] of Object.entries(b.fields||{})){
   const arg=args.find(a=>a.name===key&&a.type.startsWith('field_'));
   if(!arg)throw new Error('未対応の入力フィールドです。');
   if(arg.type==='field_dropdown'&&!arg.options.some(o=>o[1]===value))throw new Error('選択値が不正です。自動補正せず元のデータを保持します。');
   if(arg.type==='field_number'&&(typeof value!=='number'||!Number.isFinite(value)))throw new Error('数値が不正です。');
   if(arg.type==='field_input'&&typeof value!=='string')throw new Error('名前の形式が不正です。');
  }
  if(b.id){if(typeof b.id!=='string'||ids.has(b.id))throw new Error('ブロックIDが重複しています。');ids.add(b.id);}
  if(b.fields){if(typeof b.fields!=='object'||Array.isArray(b.fields))throw new Error('入力値の形式が不正です。');for(const v of Object.values(b.fields))if(!['string','number','boolean'].includes(typeof v)||String(v).length>200)throw new Error('入力値が不正または長すぎます。');}
  if(b.inputs){if(typeof b.inputs!=='object'||Array.isArray(b.inputs))throw new Error('接続情報が不正です。');for(const [key,v] of Object.entries(b.inputs)){
   const arg=args.find(a=>a.name===key&&a.type.startsWith('input_'));
   if(!arg||!v||typeof v!=='object')throw new Error('接続情報が不正です。');
   for(const child of [v.block,v.shadow].filter(Boolean)){
    const childSchema=BLOCK_SCHEMA[child.type];
    if(!childSchema)throw new Error('未対応ブロックが含まれています。');
    const output=Object.hasOwn(childSchema,'output');
    if((arg.type==='input_value'&&!output)||(arg.type==='input_statement'&&!Object.hasOwn(childSchema,'previousStatement')))throw new Error('値と処理の接続が不正です。');
    if(arg.check&&output&&childSchema.output&&arg.check!==childSchema.output)throw new Error('接続する値の型が不正です。');
    block(child,depth+1);
   }
  }}
  if(b.next?.block){if(!Object.hasOwn(schema,'nextStatement')||!Object.hasOwn(BLOCK_SCHEMA[b.next.block.type]||{},'previousStatement'))throw new Error('処理の順序接続が不正です。');block(b.next.block,depth+1);}
 }
 tops.forEach(b=>block(b));return p;
}
export function listLocal(storage){
 const raw=storage.getItem(KEY);if(!raw)return [];
 const data=JSON.parse(raw);if(data.schemaVersion)return [validateProject(data)];
 if(data.libraryVersion!==1||!Array.isArray(data.projects))throw new Error('保存ライブラリーの形式が不正です。');
 return data.projects.map(validateProject);
}
export function saveLocal(storage,project,replaceInvalid=false){
 validateProject(project);let projects;
 try{projects=listLocal(storage);}catch(error){if(!replaceInvalid)throw error;projects=[];}
 const index=projects.findIndex(p=>p.projectId===project.projectId);
 if(index<0)projects.push(project);else projects[index]=project;
 storage.setItem(KEY,JSON.stringify({libraryVersion:1,currentId:project.projectId,projects}));
}
export function loadLocal(storage){
 const raw=storage.getItem(KEY);if(!raw)return null;const data=JSON.parse(raw);
 const projects=listLocal(storage);return projects.find(p=>p.projectId===data.currentId)||projects[0]||null;
}
