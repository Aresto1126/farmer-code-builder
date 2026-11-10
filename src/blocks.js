import {Blockly} from './blockly.js';
import * as Ja from 'blockly/msg/ja';
import {API,DIRECTIONS,ENTITIES,ITEMS,GROUNDS} from './catalog.js';
export const COLORS={control:'#8b7052',farm:'#56856a',move:'#558bb0',sense:'#577f87',math:'#8c78a4',variable:'#bb8552',function:'#b07285'};
export const BLOCK_SCHEMA={};
const val=(name,check)=>({type:'input_value',name,...(check?{check}: {})});
const body=name=>({type:'input_statement',name});
const text=(name,value)=>({type:'field_input',name,text:value});
const drop=(name,table)=>({type:'field_dropdown',name,options:Object.entries(table).map(([k,v])=>[Array.isArray(v)?v[0]:v,k])});
const operators=(name,values)=>({type:'field_dropdown',name,options:values.map(v=>[v,v])});
export function registerBlocks(){
 if(Blockly.Blocks.start)return;Blockly.setLocale(Ja);
 const defs=[];
 function statement(type,message,args,colour,tooltip){defs.push({type,message0:message,args0:args,previousStatement:null,nextStatement:null,colour,tooltip,inputsInline:true});}
 function expression(type,message,args,output,colour,tooltip){defs.push({type,message0:message,args0:args,output,colour,tooltip,inputsInline:true});}
 defs.push({type:'start',message0:'▶ プログラムを開始 %1 %2',args0:[{type:'input_dummy'},body('BODY')],colour:COLORS.control,tooltip:'この中のブロックが上から順に実行されます。開始ブロックは1つだけ配置してください。'});
 statement('forever','ずっと繰り返す %1 %2',[{type:'input_dummy'},body('BODY')],COLORS.control,'while True: 中の処理を繰り返します。停止はゲーム側で行います。');
 statement('repeat','%1 回繰り返す　カウンター %2 %3 %4',[val('COUNT','Number'),text('VAR','i'),{type:'input_dummy'},body('BODY')],COLORS.control,'for 変数 in range(回数): 回数分繰り返します。カウンターの初期値は0です。');
 statement('while','%1 の間繰り返す %2 %3',[val('COND','Boolean'),{type:'input_dummy'},body('BODY')],COLORS.control,'条件が True の間、処理を繰り返します。');
 statement('if','もし %1 なら %2 %3',[val('COND','Boolean'),{type:'input_dummy'},body('THEN')],COLORS.control,'条件が True のときだけ実行します。');
 statement('if_else','もし %1 なら %2 %3 でなければ %4 %5',[val('COND','Boolean'),{type:'input_dummy'},body('THEN'),{type:'input_dummy'},body('ELSE')],COLORS.control,'条件に応じてどちらかの処理を実行します。');
 for(const [type,a] of Object.entries(API)){
  let message=a.label,args=[],colour=a.type?COLORS.sense:COLORS.farm;
  if(type==='move'){message='%1 へ移動する';args=[drop('DIR',DIRECTIONS)];colour=COLORS.move;}
  if(type==='plant'){message='%1 を植える';args=[drop('ENTITY',ENTITIES)];}
  if(type==='use_item'){message='%1 を使う';args=[drop('ITEM',{Water:['水'],Fertilizer:['肥料']})];}
  if(type==='num_items'){message='%1 の所持数';args=[drop('ITEM',ITEMS)];}
  if(type==='print'){message='%1 を出力する';args=[val('VALUE')];}
  (a.type?expression:statement)(type,message,args,...(a.type?[a.type,colour,a.description]:[colour,a.description]));
 }
 expression('number','%1',[{type:'field_number',name:'NUM',value:1}], 'Number',COLORS.math,'数値。負数や小数も使えます。');
 expression('boolean','%1',[{type:'field_dropdown',name:'BOOL',options:[['はい / True','TRUE'],['いいえ / False','FALSE']]}],'Boolean',COLORS.math,'真偽値。条件の入力欄に接続します。');
 expression('math','%1 %2 %3',[val('A','Number'),operators('OP',['+','-','*','/','//','%']),val('B','Number')],'Number',COLORS.math,'数値の演算。% は余り、// は切り捨て除算です。');
 expression('compare','%1 %2 %3',[val('A'),operators('OP',['==','!=','<','<=','>','>=']),val('B')],'Boolean',COLORS.math,'2つの値を比べます。等しいは ==、異なるは != です。');
 expression('logic','%1 %2 %3',[val('A','Boolean'),{type:'field_dropdown',name:'OP',options:[['かつ','and'],['または','or']]},val('B','Boolean')],'Boolean',COLORS.math,'2つの条件を組み合わせます。');
 expression('not','ではない %1',[val('VALUE','Boolean')],'Boolean',COLORS.math,'条件を反転します。');
 expression('entity','作物 %1',[drop('ENTITY',ENTITIES)],'Entity',COLORS.sense,'作物の種類。足元の作物と比較します。');
 expression('ground','地面 %1',[drop('GROUND',GROUNDS)],'Ground',COLORS.sense,'地面の種類。足元の地面と比較します。');
 expression('variable','変数 %1',[text('NAME','stock')],null,COLORS.variable,'設定済み変数の値を使います。');
 statement('set','変数 %1 を %2 にする',[text('NAME','stock'),val('VALUE')],COLORS.variable,'変数に値を設定します。名前は英数字と _ を使用してください。');
 defs.push({type:'function',message0:'関数 %1　引数 %2 %3 %4',args0:[text('NAME','work'),text('PARAM',''),{type:'input_dummy'},body('BODY')],colour:COLORS.function,tooltip:'独自の処理を定義します。初期版は引数0個または1個。引数なしは空欄にします。'});
 statement('call','関数 %1 を呼ぶ　引数 %2',[text('NAME','work'),val('ARG')],COLORS.function,'名前が一致する関数を呼びます。引数のない関数は値の入力を空にしてください。');
 expression('call_value','関数 %1 の結果　引数 %2',[text('NAME','work'),val('ARG')],null,COLORS.function,'関数の戻り値を使います。');
 statement('return','%1 を返す',[val('VALUE')],COLORS.function,'関数の処理を終えて値を返します。関数の中で使います。');
 for(const def of defs)BLOCK_SCHEMA[def.type]=def;
 Blockly.defineBlocksWithJsonArray(defs);
}
const shadow=(type,fields={})=>({shadow:{type,fields}});
const toolBlock=type=>({kind:'block',type,...(type==='repeat'?{inputs:{COUNT:shadow('number',{NUM:4})}}:['math','compare'].includes(type)?{inputs:{A:shadow('number',{NUM:1}),B:shadow('number',{NUM:2})}}:type==='set'?{inputs:{VALUE:shadow('number',{NUM:0})}}:{})});
export const CATEGORIES=[
 {name:'制御',icon:'repeat-2',color:COLORS.control,types:['start','forever','repeat','while','if','if_else']},
 {name:'農作業',icon:'sprout',color:COLORS.farm,types:['harvest','can_harvest','plant','till','use_item']},
 {name:'移動',icon:'move',color:COLORS.move,types:['move']},
 {name:'センサー',icon:'scan-eye',color:COLORS.sense,types:['get_pos_x','get_pos_y','get_world_size','get_entity_type','get_ground_type','get_water','num_items','entity','ground']},
 {name:'値と計算',icon:'calculator',color:COLORS.math,types:['number','boolean','math','compare','logic','not']},
 {name:'変数',icon:'variable',color:COLORS.variable,types:['set','variable']},
 {name:'関数',icon:'braces',color:COLORS.function,types:['function','call','call_value','return','print']},
];
export function toolbox(types){return {kind:'flyoutToolbox',contents:types.map(toolBlock)};}
