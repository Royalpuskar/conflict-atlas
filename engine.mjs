
function obj(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected an object');return v;}
function arr(v,label='array'){if(!Array.isArray(v)||v.length>500)throw Error(label+' must be an array with at most 500 items');return v;}
function str(v){if(typeof v!=='string'||!v.trim()||v.length>100000)throw Error('Expected nonempty text (max 100000 characters)');return v;}
function num(v,label='number',min=-1e12){if(typeof v!=='number'||!Number.isFinite(v)||v<min||Math.abs(v)>1e12)throw Error(label+' must be a finite number in range');return v;}
function bool(v){if(typeof v!=='boolean')throw Error('Expected a boolean');return v;}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Expected YYYY-MM-DD');const t=Date.parse(v+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return t;}
export function run(x){obj(x);if(JSON.stringify(x).length>200000)throw Error('Input exceeds 200 KB limit');

for(const k of ['base','left','right']){obj(x[k]);for(const v of Object.values(x[k]))if(v!==null&&typeof v==='object')throw Error('Flat records only');}const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);const rows=[...new Set([...Object.keys(x.base),...Object.keys(x.left),...Object.keys(x.right)])].sort().map(key=>{const b=x.base[key],l=x.left[key],r=x.right[key];const conflict=!same(l,r)&&!same(l,b)&&!same(r,b);const value=same(l,b)?r:l;return {key,status:conflict?'conflict':'merged',base:b===undefined?'[absent]':b,left:l===undefined?'[absent]':l,right:r===undefined?'[absent]':r,resolved:conflict?'[review required]':value===undefined?'[deleted]':value};});return {metrics:{fields:rows.length,conflicts:rows.filter(r=>r.status==='conflict').length},rows};

}
