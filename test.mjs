import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './engine.mjs';
import {sample} from './sample.mjs';
test('domain behavior and boundary cases',()=>{assert.equal(run(sample).metrics.conflicts,1);assert.equal(run(sample).rows.find(r=>r.key==='owner').resolved,'B');assert.equal(run({base:{a:1},left:{},right:{a:1}}).rows[0].resolved,'[deleted]');});
test('deterministic result and input preservation',()=>{const copy=JSON.stringify(sample);assert.deepEqual(run(sample),run(sample));assert.equal(JSON.stringify(sample),copy);});
test('reject malformed root and oversized input',()=>{assert.throws(()=>run(null));assert.throws(()=>run([]));assert.throws(()=>run({...sample,oversized:'x'.repeat(200001)}));});

test('prototype-named own keys can be deleted without reading inherited values',()=>{
 for(const key of ['__proto__','constructor','toString','hasOwnProperty']){
  const base=JSON.parse(`{"${key}":"old"}`);const r=run({base,left:{},right:base});
  assert.equal(r.rows[0].resolved,'[deleted]');assert.deepEqual(r.fieldStates[0].left,{kind:'absent'});assert.deepEqual(r.mergedRecord,{});
 }
});
test('prototype-named values are preserved as own data and round-trip through JSON',()=>{
 const side=JSON.parse('{"__proto__":"literal","constructor":7,"toString":false}');const r=run({base:{},left:side,right:{}});
 assert.equal(Object.getPrototypeOf(r.mergedRecord),Object.prototype);assert.deepEqual(JSON.parse(JSON.stringify(r.mergedRecord)),side);assert.equal(Object.hasOwn(r.mergedRecord,'__proto__'),true);
});
test('display marker strings remain distinguishable from absence and conflict',()=>{
 const r=run({base:{gone:1},left:{literal:'[deleted]',absent:'[absent]',review:'[review required]'},right:{gone:1}});
 assert.equal(r.complete,true);assert.deepEqual(r.mergedRecord,{literal:'[deleted]',absent:'[absent]',review:'[review required]'});
 assert.deepEqual(r.fieldStates.find(f=>f.key==='literal').resolution,{kind:'value',value:'[deleted]'});
 assert.deepEqual(r.fieldStates.find(f=>f.key==='gone').resolution,{kind:'absent'});
});
test('conflict prevents a partial merge record from being exposed as complete',()=>{
 const r=run({base:{a:1,b:1},left:{a:2,b:2},right:{a:3,b:1}});assert.equal(r.complete,false);assert.equal(r.mergedRecord,null);assert.deepEqual(r.fieldStates.find(f=>f.key==='a').resolution,{kind:'conflict'});assert.equal(r.rows.find(f=>f.key==='b').resolved,2);
});
test('null, false, zero, empty string and missing are distinct states',()=>{
 const values=[null,false,0,'',undefined];for(const a of values)for(const b of values){const left=a===undefined?{}:{x:a},right=b===undefined?{}:{x:b};const r=run({base:{x:'base'},left,right});assert.equal(r.complete,a===b);if(a===b&&a!==undefined)assert.equal(r.mergedRecord.x,a);}
});
test('rejects unsupported direct-module values and accessors without invoking them',()=>{
 for(const value of [undefined,NaN,Infinity,()=>1,Symbol('x'),1n,{},[]])assert.throws(()=>run({base:{},left:{x:value},right:{}}));
 let invoked=false;const bad={};Object.defineProperty(bad,'x',{enumerable:true,get(){invoked=true;return 1;}});assert.throws(()=>run({base:{},left:bad,right:{}}));assert.equal(invoked,false);
 assert.throws(()=>run({base:{},left:Object.create({inherited:1}),right:{}}));
});
test('all 125 scalar/absence triples obey a separate three-way decision oracle',()=>{
 const choices=[{kind:'absent'},{kind:'value',value:null},{kind:'value',value:0},{kind:'value',value:false},{kind:'value',value:'x'}];
 const object=s=>s.kind==='absent'?{}:{k:s.value};const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const b of choices)for(const l of choices)for(const r of choices){const expected=eq(l,r)?l:eq(l,b)?r:eq(r,b)?l:{kind:'conflict'};const result=run({base:object(b),left:object(l),right:object(r)});const actual=result.fieldStates[0]?.resolution||{kind:'absent'};assert.deepEqual(actual,expected);}
});
