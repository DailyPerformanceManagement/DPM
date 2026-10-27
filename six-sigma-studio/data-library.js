/**
 * Six Sigma Studio — reusable project data library.
 * A saved dataset belongs to a project, not to a specific method.
 * Columns are typed and validated on manual entry, edit and CSV import.
 */
const validTypes=['text','category','number','integer','percent','date','datetime','boolean'];
let draft=null;
const eid=()=>('c'+crypto.randomUUID().replaceAll('-','').slice(0,13));
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function empty(v){return v==null||String(v).trim()===''}
export function parseTypedValue(raw,col){
  const type=col.type||'text';
  if(empty(raw)){if(col.required)throw Error(col.label+' is required.');return null}
  let value=String(raw).trim();
  if((type==='number'||type==='percent')&&/^-?\d+,\d+$/.test(value))value=value.replace(',','.');
  if(type==='date'||type==='datetime'){
   const eu=value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
   if(eu)value=eu[3]+'-'+eu[2].padStart(2,'0')+'-'+eu[1].padStart(2,'0')+(type==='datetime'?'T'+(eu[4]||'00').padStart(2,'0')+':'+(eu[5]||'00'):'');
  }
  if(type==='integer'){if(!/^-?\d+$/.test(value)||!Number.isSafeInteger(Number(value)))throw Error(col.label+': enter a whole number.');return Number(value)}
  if(type==='number'||type==='percent'){const n=Number(value);if(!Number.isFinite(n))throw Error(col.label+': enter a finite number.');if(type==='percent'&&(n<0||n>100))throw Error(col.label+': percentage must be between 0 and 100.');return n}
  if(type==='date'){const d=new Date(value);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw Error(col.label+': enter a valid date.');return value}
  if(type==='datetime'){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw Error(col.label+': enter a valid date and time.');return value}
  if(type==='boolean'){if(['true','yes','1','ja'].includes(value.toLowerCase()))return true;if(['false','no','0','nein'].includes(value.toLowerCase()))return false;throw Error(col.label+': use true or false.')}
  return value;
}
export function rowFromInputs(ds,selector,scope=document){
 const values={},cells=[...scope.querySelectorAll(selector)];for(const col of ds.columns){const cell=cells.find(e=>(e.dataset.newCell||e.dataset.col)===col.key);if(cell)values[col.key]=parseTypedValue(cell.type==='checkbox'?String(cell.checked):cell.value,col)}return values
}
export function suggestColumnType(samples){
 const vals=samples.map(x=>String(x??'').trim()).filter(Boolean);if(!vals.length)return 'text';
 if(vals.every(v=>/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v)||/^\d{1,2}\.\d{1,2}\.\d{4}[ T]\d{1,2}:\d{2}/.test(v)))return 'datetime';
 if(vals.every(v=>/^\d{4}-\d{2}-\d{2}$/.test(v)||/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(v)))return 'date';
 if(vals.every(v=>!/^0\d+$/.test(v)&&/^-?\d+$/.test(v)&&Number.isSafeInteger(Number(v))))return 'integer';
 if(vals.every(v=>!/^0\d+$/.test(v)&&Number.isFinite(Number(v.replace(',','.')))))return 'number';
 if(vals.every(v=>/^(true|false|yes|no|ja|nein)$/i.test(v)))return 'boolean';
 return 'category'
}
const types=[['text','Text'],['category','Category / label'],['number','Decimal measurement'],['integer','Whole number / count'],['percent','Percentage (0–100)'],['date','Date'],['datetime','Date + time'],['boolean','Yes / No']];
function opt(list,value){return list.map(([v,label])=>'<option value="'+escapeHTML(v)+'" '+(v===value?'selected':'')+'>'+escapeHTML(label)+'</option>').join('')}
export function inputType(col){const t=col.type||'text';return t==='date'?'date':t==='datetime'?'datetime-local':['number','integer','percent'].includes(t)?'number':'text'}
export function schemaTemplates(key){
 const cols=(items)=>items.map(([label,type,unit])=>({key:eid(),label,type,unit:unit||'',required:false}));
 const templates={
  imr_m:[['Observed at','datetime'],['Measurement','number'],['Machine / shift','category']],
  imr_c:[['Observed at','datetime'],['Measurement','number'],['Machine / shift','category']],
  xbar:[['Subgroup','category'],['Measurement','number'],['Sampled at','datetime']],
  pchart:[['Sampled at','datetime'],['Inspected units','integer'],['Defective units','integer']],
  npchart:[['Sampled at','datetime'],['Inspected units','integer'],['Defective units','integer']],
  cchart:[['Sampled at','datetime'],['Defect count','integer']],
  uchart:[['Sampled at','datetime'],['Opportunity / exposure size','number'],['Defect count','integer']],
  pareto:[['Defect category','category'],['Number of defects','integer'],['Date','date']],
  dpmo:[['Inspected units','integer'],['Number of defects','integer'],['Date','date']],
  ttest:[['Group','category'],['Measurement','number']],
  anova:[['Group','category'],['Measurement','number']],
  scatter:[['X (factor)','number'],['Y (response)','number']],
  capability:[['Observed at','datetime'],['Measurement','number']],
  normal:[['Measurement','number']],
  hist:[['Measurement','number']],
  baseline:[['Measurement','number']],
  run:[['Observed at','datetime'],['Measurement','number']]
 };
 return cols(templates[key]||[['Date','date'],['Value','number']])
}
function storeDraftFromDOM(){
 if(!draft)return;let n=document.querySelector('#dataset-builder-name'),d=document.querySelector('#dataset-builder-description');
 if(n)draft.name=n.value;if(d)draft.description=d.value;
 for(let i=0;i<draft.columns.length;i++){let row=document.querySelector('[data-schema-row="'+i+'"]');if(!row)continue;let col=draft.columns[i];col.label=row.querySelector('[data-schema-label]').value;col.type=row.querySelector('[data-schema-type]').value;col.unit=row.querySelector('[data-schema-unit]').value;col.required=row.querySelector('[data-schema-required]').checked}
}
function viewDraft(ctx){
 if(!draft)return;
 const edit=!!draft.id;let {modal,btn}=ctx;
 modal('<div class="caps">Independent project dataset</div><h2>'+(edit?'Edit saved table schema':'Create a typed data table')+'</h2><p class="muted small">Name this table, choose every column title and its data type, then save it in the project Data Library. All DMAIC methods can reuse the saved table.</p><div class="formgrid">'+
 '<div class="field"><label>Table name</label><input id="dataset-builder-name" value="'+escapeHTML(draft.name)+'" placeholder="e.g. Weekly inspection data"></div>'+
 '<div class="field"><label>Purpose / description</label><input id="dataset-builder-description" value="'+escapeHTML(draft.description)+'" placeholder="What is being measured?"></div></div>'+
 '<div class="row section"><h3>Columns · '+draft.columns.length+'</h3>'+btn('+ Add column','builder-add-column')+'</div>'+
 '<div class="tablewrap"><table class="table" style="min-width:565px"><thead><tr><th>Column title</th><th>Data type</th><th>Unit</th><th>Required</th><th></th></tr></thead><tbody>'+
 draft.columns.map((c,i)=>'<tr data-schema-row="'+i+'"><td><input data-schema-label value="'+escapeHTML(c.label)+'" placeholder="Column name"></td><td><select data-schema-type>'+opt(types,c.type)+'</select></td><td><input data-schema-unit value="'+escapeHTML(c.unit||'')+'" placeholder="mm, °C, pcs"></td><td style="text-align:center"><input data-schema-required type="checkbox" '+(c.required?'checked':'')+' style="width:auto"></td><td>'+btn('Remove','builder-remove:'+i,'small danger')+'</td></tr>').join('')+
 '</tbody></table></div>'+
 '<p class="notice section">A table is saved once, independently of a chart. For SPC, choose an observation timestamp or preserve the saved row order. Numeric counts, measured values, categories, dates and percentages remain distinct data types.</p>'+
 '<div class="buttons section">'+btn('Save table in Data Library','builder-save','primary')+btn('Cancel','builder-cancel')+'</div>')
}
export function openBuilder(ctx,existing=null,templateKey=null){
 if(existing){draft={id:existing.id,name:existing.name,description:existing.description||'',columns:structuredClone(existing.columns),toolId:null}}
 else {let toolId=ctx.S.tool?.id||null;draft={id:null,name:templateKey?(ctx.S.tool?.title||templateKey)+' · Data': '',description:'',columns:schemaTemplates(templateKey),toolId}}
 viewDraft(ctx)
}
export async function handleBuilderAction(action,ctx){
 if(!draft)return;
 if(action==='builder-cancel'){draft=null;ctx.closeModal();return}
 storeDraftFromDOM();
 if(action==='builder-add-column'){draft.columns.push({key:eid(),label:'',type:'number',unit:'',required:false});viewDraft(ctx);return}
 if(action.startsWith('builder-remove:')){
  const i=Number(action.split(':')[1]);if(draft.columns.length===1)throw Error('The table must contain at least one column.');
  let col=draft.columns[i];
  if(draft.id){let hasData=ctx.S.rows.some(r=>r.dataset_id===draft.id&&!empty(r.values[col.key]));if(hasData)throw Error('Cannot remove '+col.label+' while saved observations contain data. Export the table or clear those values first.')}
  draft.columns.splice(i,1);viewDraft(ctx);return;
 }
 if(action!=='builder-save')return;
 if(!draft.name?.trim())throw Error('Give the table a name.');
 if(!draft.columns.length||draft.columns.some(c=>!c.label.trim()))throw Error('Every column needs a title.');
 if(new Set(draft.columns.map(c=>c.label.toLowerCase().trim())).size!==draft.columns.length)throw Error('Column titles must be unique.');
 if(draft.id){
  const old=ctx.S.datasets.find(d=>d.id===draft.id);
  for(const col of draft.columns){const before=old.columns.find(c=>c.key===col.key);
   if(before&&(before.type!==col.type||(!before.required&&col.required))){
    let rows=ctx.S.rows.filter(r=>r.dataset_id===old.id);
    for(const r of rows)try{parseTypedValue(r.values[col.key],col)}catch(e){throw Error('Cannot change '+col.label+' requirements: '+e.message+' (existing observations)')}
   }
  }
  await ctx.request('datasets','update',{id:draft.id,data:{name:draft.name.trim(),description:draft.description,columns:draft.columns}});
  ctx.S.dataset= {...old,name:draft.name.trim(),description:draft.description,columns:draft.columns};
 }else{
  const saved=await ctx.request('datasets','insert',{project_id:ctx.S.project.id,name:draft.name.trim(),description:draft.description,columns:draft.columns,metadata:{origin:draft.toolId?'method_template':'manual',created_by_method:draft.toolId||null}});
  ctx.S.dataset=saved;
  if(draft.toolId){
   let tool=ctx.S.tools.find(t=>t.id===draft.toolId);
   if(tool){let content={...tool.content,dataset_id:saved.id};let updated=await ctx.request('tools','update',{id:tool.id,data:{dataset_id:saved.id,content}});ctx.S.tool=updated;ctx.S.editor=structuredClone(updated.content)}
  }
 }
 const fromMethod=!!draft.toolId;draft=null;ctx.closeModal();await ctx.loadProject();
 ctx.S.page=fromMethod&&ctx.S.tool?.phase?ctx.S.tool.phase:'data';ctx.note('Named typed table saved in Supabase — ready for observations');ctx.render();
}
export function renderDataLibrary(ctx){
 const {S,head,btn}=ctx,ds=S.dataset&&S.datasets.find(d=>d.id===S.dataset.id)||S.datasets[0];
 const rows=ds?S.rows.filter(r=>r.dataset_id===ds.id):[],cols=ds?.columns||[];
 const tag=c=>escapeHTML(c.type||'text')+(c.unit?' · '+escapeHTML(c.unit):'');
 const cell=(column,attr,val,placeholder)=>column.type==='boolean'?
 '<select '+attr+'><option value="">—</option><option value="true" '+(val===true||val==='true'?'selected':'')+'>Yes</option><option value="false" '+(val===false||val==='false'?'selected':'')+'>No</option></select>':
 '<input '+attr+' type="'+inputType(column)+'" '+(['number','integer','percent'].includes(column.type)?'step="'+(column.type==='integer'?'1':'any')+'" ':'')+'value="'+escapeHTML(val??'')+'" placeholder="'+escapeHTML(placeholder||'')+'">';
 return head('Project Data Library','Create a table once, name its columns and their data types, and reuse it across Measure, Analyze and Control.',btn('+ Design new table','new-dataset','primary')+btn('Import CSV','import-new'))+
 '<div class="grid cols3 section"><div class="card stat"><span>Saved datasets</span><strong>'+S.datasets.length+'</strong></div><div class="card stat"><span>Stored observations</span><strong>'+S.rows.length+'</strong></div><div class="card stat"><span>Current project</span><strong style="font-size:15px">'+escapeHTML(S.project.name)+'</strong></div></div>'+
 '<div class="grid cols2 section"><div class="card pad"><div class="row"><h3>My saved tables</h3>'+btn('Create table','new-dataset','small')+'</div>'+S.datasets.map(x=>'<div class="listrow"><div><strong>'+escapeHTML(x.name)+'</strong><div class="tiny muted">'+x.columns.length+' typed columns · '+S.rows.filter(r=>r.dataset_id===x.id).length+' observations · used by '+S.tools.filter(t=>t.dataset_id===x.id||t.content?.dataset_id===x.id).length+' methods</div></div>'+btn('Open','open-dataset:'+x.id,'small')+'</div>').join('')+(S.datasets.length?'':'<p class="muted">Your project has no tables yet. Create one with your own columns or import CSV.</p>')+'</div>'+
 '<div class="card pad"><h3>How this works</h3><p>1. Create a named table, choose each column title, data type and unit.</p><p>2. Type observations manually or import a CSV. Values are saved in Supabase.</p><p>3. Open any suitable method, select this table, map the required fields and calculate.</p><p class="notice">SPC uses chronological numerical observations or rational subgroups. Pareto uses categorical defect counts. The method—not the table—determines which fields and assumptions are required.</p></div></div>'+
 (ds?'<div class="card pad section"><div class="row"><div><div class="caps">Active saved table</div><h2>'+escapeHTML(ds.name)+'</h2><p class="small muted">'+escapeHTML(ds.description||'')+' · '+rows.length+' observations</p></div><div class="buttons">'+btn('Edit table columns','edit-schema')+btn('Import rows','import-rows')+btn('Export CSV','export-dataset')+btn('Delete table','delete-dataset','danger small')+'</div></div>'+
 '<div class="notice section"><b>Type-safe manual entry:</b> Select or type a value in each column, then press <b>Save observation</b>. Existing cells save when you leave the field. Every entry is stored in this project’s independent Data Library.</div>'+
 '<div class="tablewrap section"><table class="table"><thead><tr><th>#</th>'+cols.map(c=>'<th>'+escapeHTML(c.label)+'<div class="tiny muted">'+tag(c)+(c.required?' · required':'')+'</div></th>').join('')+'<th></th></tr></thead><tbody>'+
 rows.slice(0,400).map((r,i)=>'<tr><td class="muted">'+(i+1)+'</td>'+cols.map(c=>'<td>'+cell(c,'data-dataset-cell="'+escapeHTML(r.id)+'" data-col="'+escapeHTML(c.key)+'"',r.values[c.key])+'</td>').join('')+'<td>'+btn('×','delete-data-row:'+r.id,'danger small')+'</td></tr>').join('')+
 '<tr style="background:#eef4ff"><td><strong>New</strong></td>'+cols.map(c=>'<td>'+cell(c,'data-new-cell="'+escapeHTML(c.key)+'"','',c.label)+'</td>').join('')+'<td>'+btn('Save observation','add-data-row','primary small')+'</td></tr>'+
 '</tbody></table></div>'+
 (rows.length>400?'<p class="small muted">First 400 rows displayed; export CSV for the full loaded dataset. For very large tables, pagination will be needed.</p>':'')+
 '</div>':'')
}
