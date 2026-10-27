import {parseTypedValue} from './data-library.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let draftKey='',draft=[];
function initDraft(key,cols){if(draftKey!==key){draftKey=key;draft=Array.from({length:5},()=>Object.fromEntries(cols.map(c=>[c.key,''])))}}
export function resetRunDraft(){draftKey='';draft=[]}
export function updateRunDraft(el){if(!el.dataset.runCell)return false;let n=Number(el.dataset.runRow);if(!draft[n])return false;draft[n][el.dataset.runCell]=el.value;return true}
export function filledRunDraft(ds){const result=[];for(let i=0;i<draft.length;i++){const obj=draft[i],hasAny=ds.columns.some(c=>String(obj[c.key]??'').trim()!=='');if(!hasAny)continue;const values={};for(const col of ds.columns)try{values[col.key]=parseTypedValue(obj[col.key],col)}catch(e){throw Error('Manual row '+(i+1)+': '+e.message)}result.push(values)}return result}
export function clearRunDraft(ds){draft=Array.from({length:5},()=>Object.fromEntries(ds.columns.map(c=>[c.key,''])))}
export function addRunDraftRows(cols){draft.push(...Array.from({length:5},()=>Object.fromEntries(cols.map(c=>[c.key,'']))))}
function fieldInput(col,value,attr){let type=col.type==='date'?'date':col.type==='datetime'?'datetime-local':['number','integer','percent'].includes(col.type)?'number':'text';
 if(col.type==='boolean')return '<select '+attr+'><option value="">—</option><option value="true" '+(String(value)==='true'?'selected':'')+'>Yes</option><option value="false" '+(String(value)==='false'?'selected':'')+'>No</option></select>';
 return '<input '+attr+' type="'+type+'" '+(['number','integer','percent'].includes(col.type)?'step="'+(col.type==='integer'?'1':'any')+'" ':'')+'value="'+esc(value??'')+'" aria-label="'+esc(col.label)+'" placeholder="'+esc(col.label)+'">';
}
export function renderRunChartWorkspace(ctx){
 const {S,btn,select}=ctx,editor=S.editor||{},ds=S.datasets.find(d=>d.id===editor.dataset_id);
 const cols=ds?.columns||[],numeric=cols.filter(c=>['number','integer','percent'].includes(c.type)),times=cols.filter(c=>['datetime','date','integer','number'].includes(c.type));
 const rows=ds?S.rows.filter(r=>r.dataset_id===ds.id):[],pageName='Run Chart · Project '+S.project.name;
 let content='<div class="card pad section"><div class="caps">Measure · Working Run Chart</div><h2>'+esc(pageName)+'</h2><p class="muted">A run chart shows measurements in chronological order, with a median reference line. Create a table, enter observations, save, select which fields to plot, and reopen this method later. No file import is required.</p>'+
 '<div class="row section"><h3>1. Choose a saved project table</h3>'+btn('+ Create Run Chart data table','template-dataset:run','primary small')+'</div>'+
 select('Saved table','dataset_id',[['','Select a project table'],...S.datasets.map(d=>[d.id,d.name+' · '+d.columns.length+' fields'])],editor.dataset_id||'')+
 (ds?'<div class="notice section">Selected: <b>'+esc(ds.name)+'</b> · <b>'+rows.length+'</b> saved observations. Columns: '+cols.map(c=>esc(c.label)+' ('+esc(c.type)+')').join(', ')+'</div>':'<div class="notice warn section">Choose or create a table to enter and chart observations.</div>')+'</div>';
 if(!ds)return content;
 initDraft(S.tool.id+':'+ds.id,cols);
 content+='<div class="card pad section"><div class="row"><div><h3>2. Enter observations manually</h3><p class="small muted">Every row has its own values. Save all filled rows at once; blanks are ignored unless a column is marked required.</p></div><div class="buttons">'+btn('Import CSV to this table','run-import-csv')+btn('Edit table columns','run-edit-schema')+'</div></div>'+
 '<div class="tablewrap section"><table class="table"><thead><tr><th>#</th>'+cols.map(c=>'<th>'+esc(c.label)+'<div class="tiny muted">'+esc(c.type)+(c.unit?' · '+esc(c.unit):'')+'</div></th>').join('')+'</tr></thead><tbody>'+
 draft.map((row,i)=>'<tr><td>New '+(i+1)+'</td>'+cols.map(c=>'<td>'+fieldInput(c,row[c.key],'data-run-cell="'+esc(c.key)+'" data-run-row="'+i+'"')+'</td>').join('')+'</tr>').join('')+
 '</tbody></table></div><div class="buttons">'+btn('Save entered observations','run-save-observations','primary')+btn('+ 5 more entry rows','run-add-draft-rows')+'</div></div>';
 content+='<div class="card pad section"><div class="row"><h3>3. Reopen, inspect, and edit saved data</h3>'+btn('Export CSV','run-export-csv')+'</div>'+
 (rows.length?'<div class="tablewrap"><table class="table"><thead><tr><th>#</th>'+cols.map(c=>'<th>'+esc(c.label)+'</th>').join('')+'<th></th></tr></thead><tbody>'+rows.slice(0,150).map((r,i)=>'<tr><td>'+(i+1)+'</td>'+cols.map(c=>'<td>'+fieldInput(c,r.values[c.key],'data-dataset-cell="'+esc(r.id)+'" data-col="'+esc(c.key)+'"')+'</td>').join('')+'<td>'+btn('Delete','delete-data-row:'+r.id,'danger small')+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>150?'<p class="small muted">Showing first 150 records. All loaded observations are used in the chart.</p>':''):'<div class="empty">No observations saved in this table. Enter your first measurements above.</div>')+'</div>';
 content+='<div class="card pad section"><h3>4. Generate the Run Chart</h3><p class="small muted">The chart uses the saved observations above. Choose a numeric measurement and an optional date/time or sequence field.</p><div class="formgrid">'+
 select('Y-axis: measurement column','y',[['','Choose measurement'],...numeric.map(c=>[c.key,c.label+' · '+c.type])],editor.y||'')+
 select('X-axis: date/time or row sequence','order',[['','Saved entry order'],...times.map(c=>[c.key,c.label+' · '+c.type])],editor.order||'')+
 '</div><div class="buttons section">'+btn('Generate Run Chart','calculate','primary')+btn('Save method settings','save-tool')+'</div>'+
 (numeric.length?'':'<div class="notice warn section">This table contains no numerical measurement field. Edit table columns to add a numerical measurement.</div>')+
 '</div>';
 return content;
}

export function computeRunChart(source,selection){
 if(!selection.y)throw Error('Choose the numerical measurement column.');
 let sorted=[...source].sort((a,b)=>(a.sequence_no||0)-(b.sequence_no||0));
 if(selection.order){
  for(let i=0;i<sorted.length;i++){let v=sorted[i].values[selection.order];if(v==null||String(v).trim()==='')throw Error('Timestamp or sequence value is missing at observation '+(i+1))}
  sorted.sort((a,b)=>{
   let x=a.values[selection.order],y=b.values[selection.order];
   if(Number.isFinite(Number(x))&&Number.isFinite(Number(y)))return Number(x)-Number(y);
   const dx=Date.parse(x),dy=Date.parse(y);if(Number.isFinite(dx)&&Number.isFinite(dy))return dx-dy;
   return String(x).localeCompare(String(y),undefined,{numeric:true});
  });
 }
 let clean=[];
 sorted.forEach((r,i)=>{let v=r.values[selection.y];if(v==null||String(v).trim()==='')return;let y=Number(v);if(!Number.isFinite(y))throw Error('Non-numeric measurement at observation '+(i+1));clean.push({y,label:selection.order?String(r.values[selection.order]):String(i+1)})});
 if(clean.length<2)throw Error('At least two saved numerical measurements are required to produce a Run Chart.');
 const values=clean.map(p=>p.y),ordered=[...values].sort((a,b)=>a-b),median=ordered.length%2?ordered[(ordered.length-1)/2]:(ordered[ordered.length/2-1]+ordered[ordered.length/2])/2;
 const avg=values.reduce((a,b)=>a+b,0)/values.length;
 let runs=0,last=0,maxShift=0,shift=0;
 for(const y of values){const sign=Math.sign(y-median);if(!sign)continue;if(sign!==last){runs++;shift=1}else shift++;maxShift=Math.max(maxShift,shift);last=sign;}
 const w=850,h=350,L=74,R=28,T=28,B=75,dy=h-T-B;
 const vmin=Math.min(median,...values),vmax=Math.max(median,...values),span=vmax-vmin||1,lo=vmin-span*.16,hi=vmax+span*.16;
 const px=i=>L+i*(w-L-R)/Math.max(1,clean.length-1),py=y=>T+(hi-y)*dy/(hi-lo);
 const xTicks=[...new Set([0,Math.round((clean.length-1)/4),Math.round((clean.length-1)/2),Math.round((clean.length-1)*.75),clean.length-1])];
 const ticks=Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4);
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Run chart: measured values by time or sequence; blue measurement line and green median reference line" style="width:100%;max-width:900px">';
 svg+=ticks.map(t=>'<line x1="'+L+'" x2="'+(w-R)+'" y1="'+py(t)+'" y2="'+py(t)+'" stroke="#e5ecf4"/><text x="'+(L-12)+'" y="'+(py(t)+4)+'" font-size="12" fill="#708099" text-anchor="end">'+esc(Number(t.toPrecision(4)))+'</text>').join('');
 svg+='<line x1="'+L+'" x2="'+(w-R)+'" y1="'+py(median)+'" y2="'+py(median)+'" stroke="#168d75" stroke-width="2" stroke-dasharray="7 6"/><text x="'+(w-R)+'" y="'+(py(median)-7)+'" font-size="12" text-anchor="end" fill="#168d75">Median '+esc(median.toFixed(3))+'</text>';
 svg+='<polyline fill="none" stroke="#3266ad" stroke-width="3" points="'+values.map((v,i)=>px(i)+','+py(v)).join(' ')+'"/>';
 svg+=clean.map((p,i)=>'<circle cx="'+px(i)+'" cy="'+py(p.y)+'" r="4" fill="#3266ad"><title>'+esc(p.label)+': '+esc(p.y)+'</title></circle>').join('');
 svg+=xTicks.map(i=>'<text x="'+px(i)+'" y="'+(h-43)+'" text-anchor="middle" fill="#687d99" font-size="10">'+esc(clean[i].label.slice(0,18))+'</text>').join('');
 svg+='<text x="'+(w/2)+'" y="'+(h-12)+'" font-size="12" text-anchor="middle" fill="#506982">'+(selection.order?'Selected observation time / order':'Saved observation sequence')+'</text></svg>';
 return {summary:'Run Chart: saved observations in process order',metrics:{observations:values.length,median,mean:avg,minimum:Math.min(...values),maximum:Math.max(...values),runs_ignoring_median_ties:runs,longest_same_side_sequence:maxShift},svg,at:new Date().toISOString(),warning:'Run charts use a median reference line; this is NOT a Shewhart control chart. Consecutive sequences and run counts are descriptive screening information. Validate time order, sampling and special-cause patterns before concluding that the process changed.'}
}
