const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
function record(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error('Expected a plain record.');
 for(const key of Reflect.ownKeys(value)){
  const d=Object.getOwnPropertyDescriptor(value,key);
  if(typeof key!=='string'||!d.enumerable||!own(d,'value'))throw Error('Records require enumerable string data fields.');
 }
 return value;
}
function scalar(value){return value===null||typeof value==='string'||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value));}
const state=(object,key)=>own(object,key)?{kind:'value',value:object[key]}:{kind:'absent'};
const equal=(a,b)=>a.kind===b.kind&&(a.kind==='absent'||a.value===b.value);
const display=s=>s.kind==='absent'?'[absent]':s.value;
export function run(input){
 record(input);
 for(const name of ['base','left','right']){
  if(!own(input,name))throw Error('Expected base, left and right records.');
  record(input[name]);
  if(!Object.values(input[name]).every(scalar))throw Error('Flat JSON scalar values only: null, strings, booleans and finite numbers.');
 }
 if(JSON.stringify(input).length>200000)throw Error('Input exceeds 200000 serialized characters.');
 const keys=[...new Set(['base','left','right'].flatMap(name=>Object.keys(input[name])))].sort();
 const rows=[],fieldStates=[],merged={};let conflicts=0;
 for(const key of keys){
  const base=state(input.base,key),left=state(input.left,key),right=state(input.right,key);
  const conflict=!equal(left,right)&&!equal(left,base)&&!equal(right,base);
  const resolution=conflict?{kind:'conflict'}:equal(left,base)?right:left;
  if(conflict)conflicts++;
  else if(resolution.kind==='value')Object.defineProperty(merged,key,{value:resolution.value,enumerable:true,writable:true,configurable:true});
  fieldStates.push({key,base,left,right,resolution});
  rows.push({key,status:conflict?'conflict':'merged',base:display(base),left:display(left),right:display(right),resolved:conflict?'[review required]':resolution.kind==='absent'?'[deleted]':resolution.value});
 }
 // Never present a partial record as a complete merge.
 return {metrics:{fields:rows.length,conflicts},rows,complete:conflicts===0,mergedRecord:conflicts===0?merged:null,fieldStates};
}
