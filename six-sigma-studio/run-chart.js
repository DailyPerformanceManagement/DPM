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
