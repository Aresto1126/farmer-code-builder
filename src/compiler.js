import {API,BUILD,FEATURES,DIRECTIONS,ENTITIES,ITEMS,GROUNDS,validName} from './catalog.js';

// Compile only our restricted block vocabulary. Never evaluate user data.
export function compile(state,profile={}){
 const issues=[],lines=[],lineMap={},seen=new Set(),functions=new Map(),usedFeatures=new Set();
 const tops=state?.blocks?.blocks||[];
 const add=(severity,code,message,b,extra={})=>issues.push({severity,code,message,blockId:b?.id,...extra});
 const emit=(text,b,depth=0)=>{lines.push('    '.repeat(depth)+text);if(b?.id)lineMap[lines.length]=b.id;};
 const field=(b,k)=>String(b?.fields?.[k]??'');
 const input=(b,k)=>b?.inputs?.[k]?.block||b?.inputs?.[k]?.shadow;
 function need(key,b){
  if(!key)return;usedFeatures.add(key);
  if(profile.allLanguage&&FEATURES[key]?.[1]==='language')return;
  const status=profile.unlocks?.[key];
  if(status!=='yes'&&!issues.some(i=>i.blockId===b.id&&i.feature===key))
   add(status==='no'?'error':'warning','unlock',`${FEATURES[key]?.[0]||key} が${status==='no'?'未解放です':'使えるか未確認です'}`,b,{feature:key});
 }
 function name(b,k){const n=field(b,k);if(!validName(n))add('error','name','名前は英数字と _ を使い、先頭は英字か _ にしてください。予約語は使えません。',b);return validName(n)?n:'invalid_name';}
 function enumValue(table,b,k,prefix){const v=field(b,k);if(!Object.hasOwn(table,v)){add('error','enum','対応していない選択値です。',b);return 'None';}if(Array.isArray(table[v]))need(table[v][1],b);return prefix?`${prefix}.${v}`:v;}
 function required(b,k,scope,expected){const child=input(b,k);if(!child){add('error','input',`「${k}」に値ブロックを接続してください。`,b);return {text:'None',type:'Unknown'};}const value=expr(child,scope);if(expected&&value.type!=='Unknown'&&!expected.includes(value.type))add('error','type','値ブロックの種類が入力欄に合いません。',child);return value;}
 function call(b,scope){need('Functions',b);const n=name(b,'NAME'),f=functions.get(n);if(!f){add('error','function',`関数「${n}」が定義されていません。`,b);return `${n}()`;}const arg=input(b,'ARG');if(f.param){return `${n}(${required(b,'ARG',scope).text})`;}if(arg)add('error','arity',`関数「${n}」は引数を受け取りません。接続した値を外してください。`,b);return `${n}()`;}
 function expr(b,scope){
  if(!b)return {text:'None',type:'Unknown'};
  const f=k=>field(b,k),v=(k,t)=>required(b,k,scope,t),out=(text,type)=>({text,type});
  if(API[b.type]?.type){const a=API[b.type];a.requires.forEach(k=>need(k,b));let arg='';if(b.type==='num_items')arg=enumValue(ITEMS,b,'ITEM','Items');return out(`${a.code}(${arg})`,a.type);}
  switch(b.type){
   case 'number': {const n=Number(f('NUM'));if(!Number.isFinite(n)||f('NUM').trim()===''){add('error','number','有限の数値を入力してください。',b);return out('0','Number');}return out(String(n),'Number');}
   case 'boolean':if(!['TRUE','FALSE'].includes(f('BOOL')))add('error','boolean','真偽値が不正です。',b);return out(f('BOOL')==='TRUE'?'True':'False','Boolean');
   case 'entity':return out(enumValue(ENTITIES,b,'ENTITY','Entities'),'Entity');
   case 'ground':return out(enumValue(GROUNDS,b,'GROUND','Grounds'),'Ground');
   case 'variable':{need('Variables',b);const n=name(b,'NAME');if(!scope.has(n))add('error','undefined-variable',`変数「${n}」は、この場所より前で値を設定してください。`,b);return out(n,scope.get(n)||'Unknown');}
   case 'math':case 'compare':case 'logic':{
    need('Operators',b);const operators=b.type==='math'?['+','-','*','/','//','%']:b.type==='compare'?['==','!=','<','<=','>','>=']:['and','or'];
    const op=f('OP');if(!operators.includes(op))add('error','operator','未対応の演算子です。',b);
    const expected=b.type==='math'?['Number']:b.type==='logic'?['Boolean']:null;
    const a=v('A',expected),c=v('B',expected);
    if(b.type==='compare'&&a.type!=='Unknown'&&c.type!=='Unknown'&&a.type!==c.type)add('error','type','比較する値の種類が異なります。',b);
    if(b.type==='compare'&&!['==','!='].includes(op)&&![a.type,c.type].every(t=>['Number','Unknown'].includes(t)))add('error','type','大小比較には数値を接続してください。',b);
    if(b.type==='math'&&['/','//','%'].includes(op)&&c.text==='0')add('error','division','0で割ることはできません。',b);
    return out(`(${a.text} ${operators.includes(op)?op:operators[0]} ${c.text})`,b.type==='math'?'Number':'Boolean');
   }
   case 'not':need('Operators',b);return out(`(not ${v('VALUE',['Boolean']).text})`,'Boolean');
   case 'call_value':return out(call(b,scope),'Unknown');
   default:add('error','expression','値として使えないブロックです。',b);return out('None','Unknown');
  }
 }
 function body(parent,k,scope,depth,inFunction){const first=input(parent,k);if(!first){add('error','body','処理の中にブロックを接続してください。',parent);return;}chain(first,scope,depth,inFunction);}
 function chain(first,scope,depth,inFunction){
  let b=first;
  while(b){
   if(seen.has(b)){add('error','cycle','接続が循環しています。',b);return;}seen.add(b);
   const f=k=>field(b,k),value=(k,t)=>required(b,k,scope,t).text;
   if(API[b.type]&&!API[b.type].type){
    const a=API[b.type];a.requires.forEach(k=>need(k,b));let args='';
    if(b.type==='move')args=enumValue(DIRECTIONS,b,'DIR');
    if(b.type==='plant'){args=enumValue(ENTITIES,b,'ENTITY','Entities');add('warning','plant','植え付けには適した地面・空きマス・資源が必要です。',b);}
    if(b.type==='use_item'){args=enumValue(ITEMS,b,'ITEM','Items');if(!['Water','Fertilizer'].includes(f('ITEM')))add('error','item','使えるアイテムは水と肥料です。',b);}
    if(b.type==='print')args=value('VALUE');
    if(b.type==='till')add('warning','till','耕す操作は草地と土壌を切り替えます。現在の地面を確認してください。',b);
    emit(`${a.code}(${args})`,b,depth);
   }else switch(b.type){
    case 'forever':need('Loops',b);emit('while True:',b,depth);body(b,'BODY',new Map(scope),depth+1,inFunction);break;
    case 'while':need('Loops',b);emit(`while ${value('COND',['Boolean'])}:`,b,depth);body(b,'BODY',new Map(scope),depth+1,inFunction);break;
    case 'repeat':{need('For',b);const n=name(b,'VAR');if(functions.has(n))add('error','name','ループ変数と関数の名前が重複しています。',b);emit(`for ${n} in range(${value('COUNT',['Number'])}):`,b,depth);const local=new Map(scope);local.set(n,'Number');body(b,'BODY',local,depth+1,inFunction);break;}
    case 'if':case 'if_else':{
     need('Conditions',b);emit(`if ${value('COND',['Boolean'])}:`,b,depth);
     const a=new Map(scope),c=new Map(scope);body(b,'THEN',a,depth+1,inFunction);
     if(b.type==='if_else'){emit('else:',b,depth);body(b,'ELSE',c,depth+1,inFunction);}
     for(const [n,t] of a)if(c.has(n))scope.set(n,t===c.get(n)?t:'Unknown');break;
    }
    case 'set':{need('Variables',b);const n=name(b,'NAME');if(functions.has(n))add('error','name','変数と関数の名前が重複しています。',b);const val=required(b,'VALUE',scope);emit(`${n} = ${val.text}`,b,depth);scope.set(n,val.type);break;}
    case 'call':emit(call(b,scope),b,depth);break;
    case 'return':need('Functions',b);if(!inFunction)add('error','return','戻り値は関数の中だけで使えます。',b);emit(`return ${value('VALUE')}`,b,depth);break;
    default:add('error','statement','実行順に置けないブロックです。',b);
   }
   b=b.next?.block;
  }
 }
 if(profile.version!==BUILD)add('error','version','対応する資料のビルドを設定で選んでください。');
 const entries=tops.filter(b=>b.type==='start');
 if(entries.length!==1)add('error','entry','「プログラムを開始」は1つだけ配置してください。');
 for(const def of tops.filter(b=>b.type==='function')){need('Functions',def);const n=name(def,'NAME');const param=field(def,'PARAM').trim();if(param)name({...def,fields:{...def.fields,PARAM:param}},'PARAM');if(functions.has(n))add('error','duplicate','関数名が重複しています。',def);functions.set(n,{block:def,param});}
 for(const [n,{block:def,param}] of functions){
  if(param&&functions.has(param))add('error','name','引数と関数の名前が重複しています。',def);
  emit(`def ${n}(${param}):`,def);body(def,'BODY',new Map(param?[[param,'Unknown']]:[]),1,true);emit('');
 }
 if(entries.length===1)body(entries[0],'BODY',new Map(),0,false);
 for(const b of tops)if(!['start','function'].includes(b.type))add('warning','detached','開始ブロックにつながっていない下書きは、コードに含まれません。',b);
 return {code:lines.length?lines.join('\n')+'\n':'',issues,lineMap,usedFeatures:[...usedFeatures]};
}
