import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
 renderRunChartWorkspace,updateRunDraft,resetRunDraft,computeRunChart,
 filledRunDraft,clearRunDraft,addRunDraftRows
} from '../run-chart.js';
import {parseTypedValue,suggestColumnType,openBuilder,handleBuilderAction} from '../data-library.js';
import {isSPC,computeSPC,methodPolicy,methodPanel} from '../statistical-methods.js';

// Exercise the real app command handlers against a test-only in-memory Supabase
// adapter. No real Supabase account or production data is changed.
let source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,'');
source=source.slice(0,source.lastIndexOf('start();'));
let store=[],record={id:'tool1',project_id:'p1',phase:'Measure',method_key:'run',
 title:'Run Chart',content:{dataset_id:'ds1',order:'time',y:'measurement'},result:{},status:'draft'};
const fakeDb={
 from(table){return {
  insert(rows){
   const rowsToSave=Array.isArray(rows)?rows:[rows];
   const base=store.length;store.push(...rowsToSave.map((r,i)=>({...r,id:'r'+(base+i+1),sequence_no:base+i+1})));
   return Promise.resolve({error:null,data:rowsToSave});
  }
 }},
 auth:{onAuthStateChange(){}}
};
const context={
 console,crypto,structuredClone,setTimeout,
 document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return []}},
 createClient(){return fakeDb},
 renderRunChartWorkspace,updateRunDraft,resetRunDraft,clearRunDraft,addRunDraftRows,
 computeRunChart,filledRunDraft,parseTypedValue,suggestColumnType,openBuilder,handleBuilderAction,
 isSPC,computeSPC,methodPolicy,methodPanel
};
vm.createContext(context);vm.runInContext(source,context);
const S=vm.runInContext('S',context);
S.user={id:'user1'};S.project={id:'p1',name:'Example Project'};S.projects=[S.project];S.page='Measure';
S.datasets=[{id:'ds1',name:'Run Chart · Data',project_id:'p1',columns:[
 {key:'time',label:'Observed at',type:'datetime'},
 {key:'measurement',label:'Measurement',type:'number'},
 {key:'operator',label:'Operator',type:'category'}
]}];
S.rows=[];S.tools=[record];S.tool=record;S.editor=structuredClone(record.content);
context.request=async(table,op,args)=>{
 if(table==='tools'&&op==='update'){record={...record,...args.data};return record}
 throw Error('Unexpected request '+table+' '+op)
};
context.loadRows=async()=>{S.rows=[...store]};
context.render=()=>{};context.note=()=>{};

resetRunDraft();
const tools={
 btn:(label,key)=>'<button data-act="'+key+'">'+label+'</button>',
 select:(label,key,options,current)=>'<select name="'+key+'">'+options.map(x=>'<option>'+x[1]+'</option>').join('')+'</select>'
};
let html=renderRunChartWorkspace({S,...tools});
assert(html.includes('Save entered observations'));
assert(html.includes('Generate Run Chart'));
assert(html.includes('Import CSV to this table'));

const manualRows=[
 ['2026-10-27T09:00','23.5'],
 ['2026-10-27T10:00','24.1'],
 ['2026-10-27T11:00','24.8']
];
manualRows.forEach(([when,value],i)=>{
 updateRunDraft({dataset:{runCell:'time',runRow:String(i)},value:when});
 updateRunDraft({dataset:{runCell:'measurement',runRow:String(i)},value});
});
await vm.runInContext("command('run-save-observations')",context);
assert.equal(store.length,3);
assert.equal(S.rows.length,3);
assert.equal(record.content.dataset_id,'ds1');
assert.equal(store[0].values.operator,null); // no operator is required

await vm.runInContext("command('calculate')",context);
assert.equal(record.result.metrics.observations,3);
assert(record.result.svg.includes('Median'));

await vm.runInContext("command('close-tool')",context);
await vm.runInContext("command('tool:tool1')",context);
assert.equal(S.editor.dataset_id,'ds1');
assert.equal(S.tool.result.metrics.observations,3);
html=renderRunChartWorkspace({S,...tools});
assert(html.includes('23.5'));
assert(html.includes('24.8'));
assert(html.includes('2026-10-27T09:00'));
console.log('PASS: manual entry → database adapter insert → chart → close/reopen → saved data + result');

const csv=vm.runInContext('parseCSV('+JSON.stringify('Observed at;Measurement;Operator\n27.10.2026 09:00;23,5;A\n27.10.2026 10:00;24,1;B\n')+')',context);
assert.equal(csv[0].length,3);
assert.equal(csv[1][1],'23,5');
assert.equal(suggestColumnType(['27.10.2026 09:00','27.10.2026 10:00']),'datetime');
assert.equal(suggestColumnType(['23,5','24,1']),'number');
assert.equal(parseTypedValue('23,5',{type:'number',label:'Measurement'}),23.5);
console.log('PASS: German Excel semicolon CSV and comma decimal typing');
