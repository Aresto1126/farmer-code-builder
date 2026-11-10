export const BUILD = '26462009';
export const FEATURES = {
  Loops:['繰り返し（while）','language'], For:['回数指定（for / range）','language'],
  Conditions:['条件分岐（if / else）','language'], Operators:['演算・比較','language'],
  Variables:['変数','language'], Functions:['関数','language'],
  Expand:['移動・農場サイズ','game'], Plant:['植え付け','game'], Carrots:['ニンジン・耕作','game'],
  Trees:['木','game'], Pumpkins:['カボチャ','game'], Sunflowers:['ヒマワリ','game'],
  Senses:['センサー・所持数','game'], Watering:['水やり','game'], Fertilizer:['肥料','game'], Debug:['デバッグ出力','game'],
};
export const DIRECTIONS = {North:'北 ↑',East:'東 →',South:'南 ↓',West:'西 ←'};
export const ENTITIES={Grass:['草',null],Bush:['低木','Plant'],Carrot:['ニンジン','Carrots'],Tree:['木','Trees'],Pumpkin:['カボチャ','Pumpkins'],Sunflower:['ヒマワリ','Sunflowers']};
export const ITEMS={Hay:['干し草',null],Wood:['木材',null],Carrot:['ニンジン','Carrots'],Pumpkin:['カボチャ','Pumpkins'],Power:['電力','Sunflowers'],Water:['水','Watering'],Fertilizer:['肥料','Fertilizer']};
export const GROUNDS={Grassland:['草地',null],Soil:['土壌','Carrots']};
export const API={
 harvest:{code:'harvest',label:'収穫する',type:null,requires:[],description:'足元を収穫します。未成熟の作物は壊してしまうため、収穫可能かの判定と組み合わせましょう。'},
 can_harvest:{code:'can_harvest',label:'収穫できる？',type:'Boolean',requires:[],description:'足元の作物が収穫できる状態なら True を返します。'},
 move:{code:'move',label:'移動する',type:null,requires:['Expand'],description:'指定方向に1マス移動します。通常は端を越えると反対側へ戻ります。迷路の壁や特殊な帽子では挙動が異なります。'},
 plant:{code:'plant',label:'植える',type:null,requires:['Plant'],description:'資源を消費して植えます。地面が不適切、作物が残っている、資源不足の場合は失敗します。'},
 till:{code:'till',label:'耕す',type:null,requires:['Carrots'],description:'草地を土壌に、土壌を草地に切り替えます。無条件に繰り返すと地面が元に戻ります。'},
 use_item:{code:'use_item',label:'アイテムを使う',type:null,requires:[],description:'水または肥料を使用します。所持していない場合は失敗します。'},
 get_pos_x:{code:'get_pos_x',label:'X座標',type:'Number',requires:['Senses'],description:'東へ進むと増えるX座標を返します。'},
 get_pos_y:{code:'get_pos_y',label:'Y座標',type:'Number',requires:['Senses'],description:'北へ進むと増えるY座標を返します。'},
 get_world_size:{code:'get_world_size',label:'農場サイズ',type:'Number',requires:['Expand'],description:'南北方向の辺の長さを返します。基本ゲームの通常の農場走査に使います。'},
 get_entity_type:{code:'get_entity_type',label:'足元の作物',type:'Entity',requires:['Senses'],description:'足元の作物を返します。作物定数との比較に使えます。'},
 get_ground_type:{code:'get_ground_type',label:'足元の地面',type:'Ground',requires:['Senses'],description:'足元の地面を返します。耕す前に土壌かどうかを確認できます。'},
 get_water:{code:'get_water',label:'足元の水分',type:'Number',requires:['Watering'],description:'水分を0〜1の数値で返します。'},
 num_items:{code:'num_items',label:'アイテムの所持数',type:'Number',requires:['Senses'],description:'指定したアイテムの所持数を返します。'},
 print:{code:'quick_print',label:'値を出力',type:null,requires:['Debug'],description:'ゲームの出力ウィンドウに値を表示します。アプリ内では実行しません。'},
};
export const BLOCK_TYPES=['start','forever','repeat','while','if','if_else','number','boolean','math','compare','logic','not','entity','ground','variable','set','function','call','call_value','return',...Object.keys(API)];
export const RESERVED = new Set(('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield range North South East West Entities Grounds Items Unlocks print quick_print '+Object.values(API).map(a=>a.code).join(' ')).split(' '));
export const validName = n => typeof n==='string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) && !RESERVED.has(n) && !n.startsWith('__fcb_');
export function defaultProfile(){return {version:BUILD,allLanguage:false,unlocks:{}};}
