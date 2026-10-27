/**
 * Statistical method adapters: each calculator declares what its data must look like.
 * SPC control charts are implemented separately from document workbooks and generic tests.
 */
const numTypes=new Set(['number','integer','percent']);
const categoryTypes=new Set(['text','category','boolean','date','datetime']);
const timeTypes=new Set(['date','datetime','integer','number']);
const SPC=new Set(['imr_m','imr_c','xbar','pchart','npchart','cchart','uchart']);
const policies={
 imr_m:{title:'I–MR · Individual measurements',question:'Does the sequence of individual measurements remain statistically stable?',needs:'At least three chronological, continuous individual measurements.',roles:[['y','Individual measurement','numeric'],['order','Date / time / sequence (optional)','time?']],hint:'Subgroups are not required. Each row represents one individual process measurement. A moving range compares adjacent observations.'},
 imr_c:{title:'I–MR · Control monitoring',question:'Is the improved process behaving consistently after implementation?',needs:'At least three chronological, continuous measurements.',roles:[['y','Individual measurement','numeric'],['order','Date / time / sequence (optional)','time?']],hint:'Save a fresh Control-phase tool instance to maintain a separate control plan or baseline.'},
 xbar:{title:'X-bar / R · Subgroup measurements',question:'Are subgroup averages and within-subgroup ranges in statistical control?',needs:'At least two rational subgroups, 2–10 measurements in each. All subgroups must have the same size.',roles:[['x','Subgroup ID / sample number','category'],['y','Measurement within subgroup','numeric'],['order','Subgroup collection date / time (optional)','time?']],hint:'Each row is one measured item. Repeat the same subgroup ID for all items collected together; do not average observations before importing.'},
 pchart:{title:'p Chart · Proportion defective',question:'Is the proportion of defective units stable across inspection subgroups?',needs:'For each subgroup: defective units and number inspected. Sample sizes may vary.',roles:[['x','Units inspected (denominator)','count'],['y','Defective units (numerator)','count'],['order','Date / time / batch order (optional)','time?']],hint:'Counts here are defective units, NOT number of defects. p_i = defective units / units inspected. Limits adjust to each sample size.'},
 npchart:{title:'np Chart · Number of defective units',question:'Is the count of defective units stable with a constant sample size?',needs:'Integer defective units and a constant inspected quantity for all subgroups.',roles:[['x','Units inspected (must be constant)','count'],['y','Defective units','count'],['order','Date / time / batch order (optional)','time?']],hint:'If the subgroup size changes, use the p chart, not np.'},
 cchart:{title:'c Chart · Defects per constant opportunity',question:'Is the count of defects stable when inspection opportunity is constant?',needs:'Integer count of defects for each equal-sized inspection unit.',roles:[['y','Defect count per inspection unit','count'],['order','Date / time / batch order (optional)','time?']],hint:'Only appropriate when inspection unit and opportunities remain constant. One unit can have multiple defects.'},
 uchart:{title:'u Chart · Defects per varying opportunity',question:'Is the number of defects per unit of exposure stable across varying sample sizes?',needs:'Integer defect count plus a positive numeric opportunity/exposure size per subgroup.',roles:[['x','Inspection opportunity / exposure','positive'],['y','Defect count','count'],['order','Date / time / batch order (optional)','time?']],hint:'u_i = defect count / opportunity. Control limits vary with the exposure size.'},
 pareto:{title:'Pareto · Ranked defect categories',question:'Which categories contribute most to the problem?',needs:'A category column and optional nonnegative count / cost column.',roles:[['x','Defect / cause category','category'],['y','Frequency, loss or cost (optional)','numeric?']],hint:'If frequency is not mapped, every row counts as one occurrence. Missing categories are not counted.'},
 baseline:{title:'Descriptive statistics · Baseline',question:'What is the measured baseline and natural variation?',needs:'At least two numerical observations.',roles:[['y','Measured value','numeric']],hint:'Compute a sample mean and sample standard deviation; verify missing values and the measurement system.'},
 hist:{title:'Histogram · Distribution',question:'How is the continuous measurement distributed?',needs:'A numerical measurement column.',roles:[['y','Measured value','numeric']],hint:'Check for mixture distributions, outliers and stratification before modeling normality.'},
 run:{title:'Run Chart · Chronological observations',question:'Is there a trend or shift in the measurement over time?',needs:'Numerical values in meaningful observation order.',roles:[['y','Measured value','numeric'],['order','Date / time / sequence (optional)','time?']],hint:'When time is not selected, rows use their persisted insertion order.'},
 normal:{title:'Jarque–Bera normality screening',question:'Does the distribution show strong evidence of non-normal skew or kurtosis?',needs:'At least eight numerical observations.',roles:[['y','Measured value','numeric']],hint:'This asymptotic screen is not a substitute for graphical inspection or process understanding.'},
 capability:{title:'Overall-sigma Pp / Ppk',question:'Does the process fit the specification limits?',needs:'Continuous numerical values and valid LSL / USL.',roles:[['y','Measured value','numeric']],hint:'Capability interpretation requires a stable process, a good measurement system and a suitable distribution.'},
 dpmo:{title:'DPMO · Defects per million opportunities',question:'How many defects occur for each million defined opportunities?',needs:'Produced-unit counts, defect counts and opportunity count per unit.',roles:[['x','Units inspected / produced','count'],['y','Total defect occurrences','count']],hint:'Defect counts are not the same as defective-unit counts.'},
 scatter:{title:'Simple Regression · Predictor / response',question:'How is a numerical response associated with a numerical predictor?',needs:'At least three paired observations.',roles:[['x','Predictor X','numeric'],['y','Response Y','numeric']],hint:'Use independent observations and review residuals; association does not establish causality.'},
 ttest:{title:'Welch t-test · Two groups',question:'Are two independent group means different?',needs:'Exactly two group levels, each with two or more numerical observations.',roles:[['x','Group / machine / shift','category'],['y','Measured response','numeric']],hint:'This is an independent Welch test, not a paired t-test.'},
 anova:{title:'One-way ANOVA · Multiple groups',question:'Are group means different across two or more groups?',needs:'Numerical response and category column, with at least two observations per group.',roles:[['x','Group / factor','category'],['y','Measured response','numeric']],hint:'Check independence, group variances and residual behavior.'}
};
export function isSPC(key){return SPC.has(key)}
export function methodPolicy(key){return policies[key]||null}
function e(x){return String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function validColumn(c,kind){let t=c.type||'text';if(kind==='numeric'||kind==='numeric?')return numTypes.has(t);if(kind==='count')return numTypes.has(t);if(kind==='positive')return numTypes.has(t);if(kind==='category')return categoryTypes.has(t);if(kind==='time?')return timeTypes.has(t);return true}
function roleList(cols,kind,cur){const optional=kind.endsWith('?');let opts=[['',optional?'Optional / row order':'Select column']];opts.push(...cols.filter(c=>validColumn(c,kind)).map(c=>[c.key,c.label+' · '+(c.type||'text')]));
 return '<select name="'+e(cur.bind)+'" data-method-role="'+e(cur.bind)+'">'+opts.map(([key,title])=>'<option value="'+e(key)+'" '+(cur.value===key?'selected':'')+'>'+e(title)+'</option>').join('')+'</select>'
}
function datasetSupported(policy,ds){return policy.roles.filter(x=>!x[2].endsWith('?')).every(([k,label,kind])=>ds.columns.some(c=>validColumn(c,kind)))}
export function methodPanel(method,ctx){
 const {S,select,input,btn}=ctx,p=methodPolicy(method.key);if(!p)return '<div class="notice warn">This method uses a structured workbook rather than numerical computation.</div>';
 const c=S.editor||S.tool?.content||{},ds=S.datasets.find(d=>d.id===c.dataset_id),rows=ds?S.rows.filter(r=>r.dataset_id===ds.id):[];
 const datasetOptions=[['','Choose a saved project table'],...S.datasets.map(x=>[x.id,(datasetSupported(p,x)?'✓ ':'Needs columns · ')+x.name])];
 let html='<div class="card pad section"><div class="caps">Method-specific data requirements</div><h3>'+e(p.title)+'</h3><p>'+e(p.question)+'</p><div class="notice">'+e(p.needs)+'</div><p class="small muted">'+e(p.hint)+'</p></div>';
 html+='<div class="card pad section"><div class="row"><h3>1. Select a saved data table</h3>'+btn('Create compatible table','template-dataset:'+method.key,'primary small')+'</div>'+
 select('Saved table','dataset_id',datasetOptions,c.dataset_id||'')+
 (ds?'<div class="row section"><p class="small muted">'+rows.length+' saved rows · '+ds.columns.map(x=>e(x.label)+' ('+e(x.type)+')').join(', ')+'</p>'+btn('Enter or edit observations','open-data-from-tool','small')+'</div>':'<p class="muted small">Build a reusable table first, or select one previously saved in your project’s Data Library.</p>')+'</div>';
 if(ds){html+='<div class="card pad section"><h3>2. Map the exact method inputs</h3><p class="small muted">These mappings belong to this instance of '+e(method.title)+'. Another method can reuse the same table with different input mappings.</p><div class="formgrid">'+
 p.roles.map(([bind,label,kind])=>'<div class="field"><label>'+e(label)+'</label>'+roleList(ds.columns,kind,{bind,value:c[bind]||''})+'</div>').join('')+
 (method.key==='capability'?input('LSL (lower specification limit)','lsl',c.lsl??'','number')+input('USL (upper specification limit)','usl',c.usl??'','number'):'')+
 (method.key==='dpmo'?input('Defect opportunities per unit','opportunities',c.opportunities??1,'number'):'')+'</div></div>';
 let required=p.roles.filter(x=>!x[2].endsWith('?')).map(x=>x[0]);let missing=required.filter(x=>!c[x]);if(missing.length)html+='<div class="notice warn section">Required column mappings are missing. Select the roles above, then click Calculate. Nothing will be estimated from a different column.</div>';
 else html+='<div class="notice section">Ready for data validation. Press Calculate; the tool checks sample sizes, numeric counts, denominators and chart-specific restrictions before saving a result.</div>';
 }
 html+='<div class="buttons section">'+btn('Calculate from saved observations','calculate','primary')+'</div>';
 return html;
}
function numeric(v,name){if(v===null||v===undefined||String(v).trim()==='')throw Error(name+' has a blank value.');let n=Number(v);if(!Number.isFinite(n))throw Error(name+' must contain finite numerical values.');return n}
function integer(v,name){let n=numeric(v,name);if(!Number.isSafeInteger(n)||n<0)throw Error(name+' requires a nonnegative integer.');return n}
function positive(v,name){let n=numeric(v,name);if(n<=0)throw Error(name+' must be positive.');return n}
function fmt(n){return Number(n).toLocaleString(undefined,{maximumFractionDigits:4})}
function avg(a){return a.reduce((p,n)=>p+n,0)/a.length}
function totals(a){return a.reduce((p,n)=>p+n,0)}
function ordered(rows,order){
 const result=[...rows].sort((a,b)=>(Number(a.sequence_no)||0)-(Number(b.sequence_no)||0));
 if(!order)return result;
 return result.sort((a,b)=>{const x=a.values[order],y=b.values[order];let n1=new Date(x).getTime(),n2=new Date(y).getTime();if(Number.isFinite(n1)&&Number.isFinite(n2))return n1-n2;let c=Number(x)-Number(y);if(Number.isFinite(c))return c;return String(x).localeCompare(String(y))});
}
function chart(title,values,center,upper,lower,labels=[]){
 const width=780,height=295,left=55,right=15,top=23,bottom=58,w=width-left-right,h=height-top-bottom,n=values.length;
 const U=Array.isArray(upper)?upper:values.map(()=>upper),L=Array.isArray(lower)?lower:values.map(()=>lower),C=Array.isArray(center)?center:values.map(()=>center);
 const all=[...values,...U,...L,...C].filter(Number.isFinite),minimum=Math.min(...all),maximum=Math.max(...all),pad=(maximum-minimum||1)*.12,lo=minimum-pad,hi=maximum+pad;
 const px=i=>left+w*(n===1?.5:i/(n-1)),py=v=>top+h*(hi-v)/(hi-lo),line=(a,color,width=2,dashed=false)=>'<polyline fill="none" stroke="'+color+'" stroke-width="'+width+'" '+(dashed?'stroke-dasharray="6 5"':'')+' points="'+a.map((v,i)=>px(i).toFixed(1)+','+py(v).toFixed(1)).join(' ')+'"/>';
 const tick=Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4);
 return '<div class="section"><h3>'+e(title)+'</h3><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+e(title)+'; values and variable control limits"><rect x="0" y="0" width="'+width+'" height="'+height+'" fill="#fff"/>'+
 tick.map(v=>'<line x1="'+left+'" x2="'+(width-right)+'" y1="'+py(v)+'" y2="'+py(v)+'" stroke="#e9edf3"/><text x="'+(left-8)+'" y="'+(py(v)+4)+'" text-anchor="end" font-size="10" fill="#64748b">'+e(fmt(v))+'</text>').join('')+
 line(U,'#c15656',1.4,true)+line(L,'#c15656',1.4,true)+line(C,'#188c76',1.6,true)+line(values,'#2f66b7',2.8)+
 values.map((v,i)=>'<circle cx="'+px(i)+'" cy="'+py(v)+'" r="'+(v>U[i]||v<L[i]?5:3)+'" fill="'+(v>U[i]||v<L[i]?'#cc374b':'#2f66b7')+'"><title>'+e(labels[i]??('#'+(i+1)))+': '+e(fmt(v))+' · LCL '+e(fmt(L[i]))+' · CL '+e(fmt(C[i]))+' · UCL '+e(fmt(U[i]))+'</title></circle>').join('')+
 '<text x="'+(width/2)+'" y="'+(height-10)+'" text-anchor="middle" font-size="11" fill="#60738e">Observation / subgroup sequence (hover over points for limits)</text></svg></div>';
}
function calcResult(title,metrics,charts,warning){return {summary:title,metrics,svg:charts,warning,at:new Date().toISOString()}}
export function computeSPC(key,rawRows,c){
 if(!isSPC(key))throw Error('Not an SPC method.');
 const rows=ordered(rawRows,c.order),n=rows.length;if(n<2)throw Error('At least two observations/subgroups are required. Use the Data Library to enter observations first.');
 const need=code=>{if(!c[code])throw Error('Choose the '+code+' column for this method.')};
 need('y');
 const label=rows.map((r,i)=>String(c.order?r.values[c.order]??i+1:i+1));
 if(key==='imr_m'||key==='imr_c'){
  if(n<3)throw Error('I–MR needs at least three chronological individual measurements.');
  const x=rows.map((r,i)=>numeric(r.values[c.y],'Individual measurement, row '+(i+1)));
  const mr=x.slice(1).map((v,i)=>Math.abs(v-x[i])),mrbar=avg(mr),center=avg(x),ucl=center+2.66*mrbar,lcl=center-2.66*mrbar;
  const uclMR=3.267*mrbar;let signal=x.filter(v=>v>ucl||v<lcl).length,signalMr=mr.filter(v=>v>uclMR).length;
  return calcResult('I–MR chart from sequential individual measurements',{observations:n,individuals_center:center,individuals_UCL:ucl,individuals_LCL:lcl,moving_range_center:mrbar,moving_range_UCL:uclMR,moving_range_LCL:0,individuals_beyond_limits:signal,moving_ranges_beyond_limits:signalMr},
  chart('Individuals (X)',x,center,ucl,lcl,label)+chart('Moving range (MR)',mr,mrbar,uclMR,0,label.slice(1)),
  '3-sigma I–MR estimates assume stable sequential data. Review rational time order, special-cause run rules, independence and distribution before interpretation.');
 }
 if(key==='xbar'){
  need('x');let groups=new Map;
  for(let i=0;i<n;i++){let name=String(rows[i].values[c.x]??'').trim();if(!name)throw Error('Missing subgroup ID at row '+(i+1));let a=groups.get(name)||[];a.push(numeric(rows[i].values[c.y],'Measurement at row '+(i+1)));groups.set(name,a)}
  let keys=[...groups.keys()],a=[...groups.values()],m=a[0].length;
  if(a.length<2||m<2||m>10||a.some(g=>g.length!==m))throw Error('X-bar/R requires at least two rational subgroups, all with exactly 2–10 individual measurements.');
  const A2={2:1.88,3:1.023,4:.729,5:.577,6:.483,7:.419,8:.373,9:.337,10:.308},D3={2:0,3:0,4:0,5:0,6:0,7:.076,8:.136,9:.184,10:.223},D4={2:3.267,3:2.574,4:2.282,5:2.114,6:2.004,7:1.924,8:1.864,9:1.816,10:1.777};
  const means=a.map(avg),ranges=a.map(v=>Math.max(...v)-Math.min(...v)),mubar=avg(means),rbar=avg(ranges),ux=mubar+A2[m]*rbar,lx=mubar-A2[m]*rbar,ur=D4[m]*rbar,lr=D3[m]*rbar;
  return calcResult('X-bar and R control charts for rational subgroups',{subgroups:a.length,n_per_subgroup:m,Xbar_center:mubar,Xbar_UCL:ux,Xbar_LCL:lx,R_center:rbar,R_UCL:ur,R_LCL:lr,Xbar_beyond_limits:means.filter(v=>v>ux||v<lx).length,R_beyond_limits:ranges.filter(v=>v>ur||v<lr).length},
  chart('Subgroup means (X-bar)',means,mubar,ux,lx,keys)+chart('Within-subgroup range (R)',ranges,rbar,ur,lr,keys),
  'Use meaningful process subgroups; review the R chart before interpreting mean-chart signals. These are chart limits, not product specifications.');
 }
 if(key==='pchart'||key==='npchart'){
  need('x');const d=rows.map((r,i)=>integer(r.values[c.y],'Defective units, row '+(i+1))),units=rows.map((r,i)=>integer(r.values[c.x],'Inspected units, row '+(i+1)));
  if(units.some(a=>a<1))throw Error('Every subgroup must have at least one inspected unit.');
  if(d.some((v,i)=>v>units[i]))throw Error('Defective units may not exceed inspected units. This tool counts defective units, not defects.');
  const p=totals(d)/totals(units);
  if(key==='npchart'&&new Set(units).size!==1)throw Error('np chart needs constant subgroup size. Use a p chart for varying sample sizes.');
  if(key==='pchart'){
   let point=d.map((v,i)=>v/units[i]),u=units.map(v=>Math.min(1,p+3*Math.sqrt(p*(1-p)/v))),l=units.map(v=>Math.max(0,p-3*Math.sqrt(p*(1-p)/v)));
   return calcResult('p chart with subgroup-specific control limits',{subgroups:n,total_units:totals(units),total_defective:totals(d),center_proportion:p,UCL_by_subgroup:u,LCL_by_subgroup:l,outside_limits:point.filter((v,i)=>v>u[i]||v<l[i]).length},
   chart('Proportion defective · variable subgroup limits',point,p,u,l,label),
   'Use defective UNIT counts. Control limits vary with subgroup sample size and are not specification limits.');
  }
  let np=p*units[0],sd=Math.sqrt(units[0]*p*(1-p)),u=Math.min(units[0],np+3*sd),l=Math.max(0,np-3*sd);
  return calcResult('np chart for constant-size subgroups',{subgroups:n,inspected_per_subgroup:units[0],center_defective_count:np,UCL:u,LCL:l,outside_limits:d.filter(v=>v>u||v<l).length},
  chart('Count of defective units · np',d,np,u,l,label),'All inspected subgroup sizes must remain equal.');
 }
 if(key==='cchart'){
  let d=rows.map((r,i)=>integer(r.values[c.y],'Defect count, row '+(i+1))),cbar=avg(d),u=cbar+3*Math.sqrt(cbar),l=Math.max(0,cbar-3*Math.sqrt(cbar));
  return calcResult('c chart for constant inspection opportunity',{subgroups:n,average_defects:cbar,UCL:u,LCL:l,outside_limits:d.filter(v=>v>u||v<l).length},
  chart('Defect count · constant opportunity',d,cbar,u,l,label),
  'Requires equal inspection opportunity per subgroup. If exposure sizes differ, use a u chart.');
 }
 if(key==='uchart'){
  need('x');let d=rows.map((r,i)=>integer(r.values[c.y],'Defect count, row '+(i+1))),exposure=rows.map((r,i)=>positive(r.values[c.x],'Opportunity/exposure, row '+(i+1))),ubar=totals(d)/totals(exposure),rate=d.map((v,i)=>v/exposure[i]),u=exposure.map(v=>ubar+3*Math.sqrt(ubar/v)),l=exposure.map(v=>Math.max(0,ubar-3*Math.sqrt(ubar/v)));
  return calcResult('u chart for defects per opportunity',{subgroups:n,total_defects:totals(d),total_exposure:totals(exposure),center_defects_per_unit:ubar,UCL_by_subgroup:u,LCL_by_subgroup:l,outside_limits:rate.filter((v,i)=>v>u[i]||v<l[i]).length},
  chart('Defect rate · variable exposure',rate,ubar,u,l,label),
  'Counts defects, not defective units. Uses a Poisson-type count assumption and variable limits.');
 }
 throw Error('No calculator configured for '+key);
}
