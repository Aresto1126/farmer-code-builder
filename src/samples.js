const b=(type,fields={},inputs={},next)=>({type,fields,inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,{block:v}])),...(next?{next:{block:next}}:{})});
const start=body=>({...b('start',{}, {BODY:body}),x:80,y:60});
const world=()=>b('get_world_size');
const harvest=()=>b('if',{}, {COND:b('can_harvest'),THEN:b('harvest')});
export const samples=[
 {id:'patrol',name:'はじめての収穫',description:'成熟した作物だけを収穫して、北へ巡回。通常の農場・特別な帽子なしを想定。',features:['Loops','Conditions','Expand'],workspace:{blocks:{languageVersion:0,blocks:[start(b('forever',{}, {BODY:{...harvest(),next:{block:b('move',{DIR:'North'})}}}))]}}},
 {id:'grid',name:'農場をまるごと巡回',description:'辺の長さを使って全マスを巡回。基本ゲームの通常の正方形農場向け。',features:['Loops','For','Conditions','Expand'],workspace:{blocks:{languageVersion:0,blocks:[start(b('forever',{}, {BODY:b('repeat',{VAR:'column'}, {COUNT:world(),BODY:b('repeat',{VAR:'row'}, {COUNT:world(),BODY:{...harvest(),next:{block:b('move',{DIR:'North'})}}},b('move',{DIR:'East'}))})}))]}}},
 {id:'carrot',name:'ニンジンを育てる',description:'成熟を確認し、草地だけを耕して植え直します。植え付け資源が必要。移動はしません。',features:['Loops','Conditions','Operators','Plant','Carrots','Senses'],workspace:{blocks:{languageVersion:0,blocks:[start(b('forever',{}, {BODY:harvestThenCarrot()}))]}}},
 {id:'function',name:'関数で処理をまとめる',description:'収穫判定を関数にまとめ、巡回から呼び出します。引数なし関数の例。',features:['Functions','Loops','Conditions','Expand'],workspace:{blocks:{languageVersion:0,blocks:[start(b('forever',{}, {BODY:b('call',{NAME:'harvest_ready'}, {},b('move',{DIR:'North'}))})),{...b('function',{NAME:'harvest_ready',PARAM:''},{BODY:harvest()}),x:80,y:340}]}}},
];
function harvestThenCarrot(){return {...harvest(),next:{block:b('if',{}, {COND:b('compare',{OP:'!='},{A:b('get_ground_type'),B:b('ground',{GROUND:'Soil'})}),THEN:b('till')},b('plant',{ENTITY:'Carrot'}))}};}
