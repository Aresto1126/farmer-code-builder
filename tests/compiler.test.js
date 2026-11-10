import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '../src/compiler.js';
const b=(type,fields={},inputs={},next)=>({type,id:crypto.randomUUID(),fields,inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,{block:v}])),...(next?{next:{block:next}}:{})});
const state=(body,...defs)=>({blocks:{languageVersion:0,blocks:[b('start',{}, {BODY:body}),...defs]}});
const profile={version:'26462009',allLanguage:true,unlocks:{Expand:'yes',Plant:'yes',Senses:'yes',Carrots:'yes'}};
test('generates nested branches in order and maps lines to their blocks',()=>{
 const harvest=b('harvest');
 const s=state(b('forever',{}, {BODY:b('if',{}, {COND:b('can_harvest'),THEN:harvest}, b('move',{DIR:'North'}))}));
 const r=compile(s,profile);
 assert.equal(r.code,'while True:\n    if can_harvest():\n        harvest()\n    move(North)\n');
 assert.equal(r.lineMap[3],harvest.id); assert.equal(r.issues.filter(i=>i.severity==='error').length,0);
});
test('all language override does not bypass locked movement',()=>{
 const r=compile(state(b('move',{DIR:'East'})),{...profile,unlocks:{Expand:'no'}});
 assert(r.issues.some(i=>i.severity==='error'&&i.feature==='Expand'));
});
test('unknown unlocks warn, unsupported builds block output',()=>{
 assert(compile(state(b('move',{DIR:'East'})),{...profile,unlocks:{}}).issues.some(i=>i.severity==='warning'));
 assert(compile(state(b('harvest')),{...profile,version:'unknown'}).issues.some(i=>i.severity==='error'));
});
test('loose statements stay out of generated code',()=>{
 const r=compile(state(b('harvest'),b('till')),profile);
 assert.equal(r.code,'harvest()\n'); assert(r.issues.some(i=>i.code==='detached'));
});
test('missing inputs and bodies cannot be exported',()=>{
 const r=compile(state(b('if')),profile);
 assert(r.issues.filter(i=>i.severity==='error').length>=2);
});
test('rejects arbitrary identifiers, invalid enum values and undefined variables',()=>{
 for(const block of [b('set',{NAME:'x); clear()'}, {VALUE:b('number',{NUM:1})}),b('move',{DIR:'explode()'}),b('print',{}, {VALUE:b('variable',{NAME:'missing'})})]){
  assert(compile(state(block),profile).issues.some(i=>i.severity==='error'));
 }
});
test('functions with an argument and return generate before entry point',()=>{
 const def=b('function',{NAME:'double',PARAM:'amount'}, {BODY:b('return',{}, {VALUE:b('math',{OP:'*'}, {A:b('variable',{NAME:'amount'}),B:b('number',{NUM:2})})})});
 const r=compile(state(b('set',{NAME:'result'}, {VALUE:b('call_value',{NAME:'double'}, {ARG:b('number',{NUM:3})})}),def),profile);
 assert.equal(r.code,'def double(amount):\n    return (amount * 2)\n\nresult = double(3)\n');
 assert.equal(r.issues.filter(i=>i.severity==='error').length,0);
});
test('undefined function and return outside function are errors',()=>{
 assert(compile(state(b('call',{NAME:'missing'})),profile).issues.some(i=>i.code==='function'));
 assert(compile(state(b('return',{}, {VALUE:b('number',{NUM:1})})),profile).issues.some(i=>i.code==='return'));
});
test('does not infer definitely assigned variables across optional branch',()=>{
 const body=b('if',{}, {COND:b('boolean',{BOOL:'TRUE'}),THEN:b('set',{NAME:'x'}, {VALUE:b('number',{NUM:2})})},b('print',{}, {VALUE:b('variable',{NAME:'x'})}));
 assert(compile(state(body),profile).issues.some(i=>i.code==='undefined-variable'));
});
test('language features remain locked without override',()=>{
 assert(compile(state(b('forever',{}, {BODY:b('harvest')})),{...profile,allLanguage:false,unlocks:{Loops:'no'}}).issues.some(i=>i.feature==='Loops'&&i.severity==='error'));
});
test('known variable types are enforced across assignments and complete branches',()=>{
 const bad=b('set',{NAME:'x'},{VALUE:b('entity',{ENTITY:'Grass'})},b('repeat',{VAR:'i'},{COUNT:b('variable',{NAME:'x'}),BODY:b('harvest')}));
 assert(compile(state(bad),profile).issues.some(i=>i.code==='type'&&i.severity==='error'));
 const branch=b('if_else',{}, {COND:b('boolean',{BOOL:'TRUE'}),THEN:b('set',{NAME:'x'},{VALUE:b('entity',{ENTITY:'Grass'})}),ELSE:b('set',{NAME:'x'},{VALUE:b('entity',{ENTITY:'Bush'})})},b('repeat',{VAR:'i'},{COUNT:b('variable',{NAME:'x'}),BODY:b('harvest')}));
 assert(compile(state(branch),profile).issues.some(i=>i.code==='type'));
});
