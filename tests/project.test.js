import test from 'node:test';
import assert from 'node:assert/strict';
import {Blockly} from '../src/blockly.js';
import {registerBlocks} from '../src/blocks.js';
import {createProject,validateProject,saveLocal,loadLocal,listLocal} from '../src/project.js';
import {samples} from '../src/samples.js';
import {compile} from '../src/compiler.js';
registerBlocks();
test('project roundtrip preserves workspace and profile',()=>{
 const p=createProject('私の農場',samples[0].workspace);
 const r=validateProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(r,p);
});
test('rejects unsupported versions, unknown blocks, cycles and unsafe nested structure',()=>{
 const p=createProject('test',samples[0].workspace);
 assert.throws(()=>validateProject({...p,schemaVersion:500}));
 assert.throws(()=>validateProject({...p,workspace:{blocks:{blocks:[{type:'execute_arbitrary_code'}]}}}));
 const cyclic={type:'start',inputs:{}};cyclic.next={block:cyclic};
 assert.throws(()=>validateProject({...p,workspace:{blocks:{blocks:[cyclic]}}}));
 assert.throws(()=>validateProject({...p,workspace:{blocks:{blocks:'invalid'}}}));
});
test('failed save leaves previous valid project intact and reports failure',()=>{
 let stored=null,fail=false;
 const storage={getItem:()=>stored,setItem:(k,v)=>{if(fail)throw new Error('QuotaExceeded');stored=v;}};
 const a=createProject('original',samples[0].workspace); saveLocal(storage,a);
 fail=true;assert.throws(()=>saveLocal(storage,{...a,name:'changed'}));
 assert.equal(loadLocal(storage).name,'original');
});
test('invalid stored JSON throws instead of silently replacing work',()=>{
 assert.throws(()=>loadLocal({getItem:()=>'{broken'}));
});
test('saving a duplicate keeps original projects available and restores last selected',()=>{
 let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};
 const first=createProject('original',samples[0].workspace),second=createProject('duplicate',samples[0].workspace);
 saveLocal(storage,first);saveLocal(storage,second);
 assert.equal(loadLocal(storage).name,'duplicate');
 assert.deepEqual(listLocal(storage).map(p=>p.name).sort(),['duplicate','original']);
 saveLocal(storage,{...first,name:'renamed'});
 assert.equal(listLocal(storage).length,2);assert.equal(loadLocal(storage).name,'renamed');
});
test('all sample workspaces restore through real Blockly and compile',()=>{
 for(const sample of samples){
  const w=new Blockly.Workspace();
  Blockly.serialization.workspaces.load(sample.workspace,w);
  const restored=Blockly.serialization.workspaces.save(w);
  const p=createProject(sample.name,restored);p.gameProfile.allLanguage=true;
  const r=compile(p.workspace,p.gameProfile);
  assert.deepEqual(r.issues.filter(i=>i.severity==='error'),[],sample.name);w.dispose();
 }
});
test('numeric blocks cannot connect to boolean condition inputs',()=>{
 const w=new Blockly.Workspace(),cond=w.newBlock('if'),num=w.newBlock('number');
 assert.equal(w.connectionChecker.canConnect(cond.getInput('COND').connection,num.outputConnection,false),false);
 w.dispose();
});
test('rejects invalid enum values instead of allowing Blockly to silently normalize',()=>{
 const p=createProject('bad',{blocks:{blocks:[{type:'start',inputs:{BODY:{block:{type:'move',fields:{DIR:'BAD'}}}}}]}});
 assert.throws(()=>validateProject(p));
});
test('rejects statements and expressions in the wrong connection before loading',()=>{
 for(const b of [{type:'start',inputs:{BODY:{block:{type:'number',fields:{NUM:3}}}}},{type:'if',inputs:{COND:{block:{type:'harvest'}}}}]){
  assert.throws(()=>validateProject(createProject('bad',{blocks:{blocks:[b]}})));
 }
});
test('a 300 statement program can be saved and restored',()=>{
 const first={type:'harvest'};let last=first;for(let i=1;i<300;i++){last.next={block:{type:'harvest'}};last=last.next.block;}
 const p=createProject('large',{blocks:{blocks:[{type:'start',inputs:{BODY:{block:first}}}]}});
 assert.equal(validateProject(p).name,'large');
});
