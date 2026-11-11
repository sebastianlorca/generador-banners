(function(){
'use strict';
const root=document.getElementById('pcf-banner-mvp'),$=id=>root.querySelector('[id="'+id+'"]');
const section=$('products-heading').closest('section');
const modeLabel=document.createElement('label');modeLabel.textContent='Modo de generación';
const mode=document.createElement('select');mode.id='generationMode';
for(const [value,label] of [['individual','Individual'],['massive','Masivo desde Google Sheets']])mode.add(new Option(label,value));
modeLabel.append(mode);section.querySelector('h3').after(modeLabel);
const settings=document.createElement('div');settings.className='batch-settings';settings.hidden=true;
settings.innerHTML='<label>Enlace o ID de Google Sheets<input id="sheetSource" type="text" value="https://docs.google.com/spreadsheets/d/1ic5fOWwP3AqzgsIcJ70ySvrq0y0TPX-nB3-KZnfieeQ/edit"></label><button id="loadSheets" type="button" class="secondary">Cargar / actualizar planilla</button><label>Hoja semanal<select id="sheetWeek" disabled><option value="">Carga la planilla primero</option></select></label><label>Ciclo<select id="sheetCycle"><option value="9">Lunes a jueves · fila 9</option><option value="43">Viernes a domingo · fila 43</option></select></label><p id="sheetStatus" role="status" aria-live="polite"></p><div id="sheetSummary" class="batch-summary" hidden></div>';
section.append(settings);
const results=document.createElement('div');results.id='individualResults';
let node=$('form').nextSibling;
while(node){const next=node.nextSibling;results.append(node);node=next}
root.append(results);
const batch=document.createElement('section');batch.hidden=true;
const title=document.createElement('h2');title.textContent='Vista previa y descarga';
const progress=document.createElement('p');progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
const tabs=document.createElement('div');tabs.className='batch-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Grupos de productos');
const panels=document.createElement('div');batch.append(title,progress,tabs,panels);root.append(batch);
let sheets=[],running=false,loading=false,templatePromise;
const generatorVersion=Date.now();
const formatInputs=Array.from(root.querySelectorAll('.format-options input'));
const formatKey=input=>input.id.charAt(6).toLowerCase()+input.id.slice(7);
const groupFormats=new WeakMap();
const formatHelp=$('formats-heading').nextElementSibling;
const individualFormatHelp=formatHelp.textContent;
const groups=()=>sheets.find(sheet=>sheet.name===$('sheetWeek').value)?.cycles[$('sheetCycle').value]||[];
function clearBatch(){tabs.replaceChildren();panels.replaceChildren();progress.textContent=''}
function summarize(){
clearBatch();const rows=groups(),summary=$('sheetSummary');summary.replaceChildren();summary.hidden=!rows.length;
for(const group of rows){
const row=document.createElement('div'),heading=document.createElement('p');
row.className='batch-group';heading.id='sheet-group-'+group.cell;
heading.textContent=group.cell+': '+(group.error?group.value+' — '+group.error:group.ids.join(' - '));
heading.classList.toggle('batch-error',!!group.error);row.append(heading);summary.append(row);
if(group.error)continue;
const controls=document.createElement('div');
controls.className='batch-group-formats';controls.setAttribute('role','group');controls.setAttribute('aria-labelledby',heading.id);
let formats=groupFormats.get(group);
if(!formats){formats=Object.fromEntries(formatInputs.map(input=>[formatKey(input),input.checked]));groupFormats.set(group,formats)}
for(const input of formatInputs){
const key=formatKey(input),label=document.createElement('label'),checkbox=document.createElement('input');
checkbox.type='checkbox';checkbox.checked=formats[key];checkbox.dataset.format=key;
checkbox.addEventListener('change',()=>{formats[key]=checkbox.checked;clearBatch()});
label.append(checkbox,document.createTextNode(input.nextElementSibling.firstChild.textContent));controls.append(label);
}
row.append(controls);
}
$('sheetStatus').textContent=sheets.length?(rows.length+' grupos encontrados. '+(rows.some(group=>group.error)?'Corrige las celdas marcadas antes de generar.':'Revisa los IDs antes de generar.')):'';
}
mode.addEventListener('change',()=>{
const massive=mode.value==='massive';settings.hidden=!massive;section.querySelector('.product-fields').hidden=massive;$('version').hidden=massive;
formatHelp.textContent=massive?'Cambia un formato aquí para aplicarlo a todos los grupos. Ajusta cada banner en la lista de la planilla.':individualFormatHelp;
for(const id of ['left','right','third'])$(id).disabled=massive;
results.hidden=massive;batch.hidden=!massive;
});
$('sheetWeek').addEventListener('change',summarize);$('sheetCycle').addEventListener('change',summarize);
$('sheetSource').addEventListener('input',()=>{sheets=[];$('sheetWeek').replaceChildren(new Option('Carga la planilla primero',''));$('sheetWeek').disabled=true;summarize();$('sheetStatus').textContent='Carga la planilla para aplicar el nuevo enlace.'});
$('loadSheets').addEventListener('click',async()=>{
if(loading||running)return;loading=true;clearBatch();sheets=[];$('sheetSummary').hidden=true;$('sheetWeek').disabled=true;$('loadSheets').disabled=true;$('sheetSource').disabled=true;
const source=$('sheetSource').value.trim();let id=source;
try{
if(source.startsWith('https://')){const url=new URL(source);if(url.hostname!=='docs.google.com')throw new Error('Usa un enlace de docs.google.com.');id=url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/)?.[1]||''}
if(!/^[A-Za-z0-9_-]{20,100}$/.test(id))throw new Error('Introduce un enlace o ID válido de Google Sheets.');
$('sheetStatus').textContent='Leyendo hojas y ciclos de Google Sheets…';
const response=await fetch('/api/sheets?id='+encodeURIComponent(id),{cache:'no-store',signal:AbortSignal.timeout(45000)}),data=await response.json();
if(!response.ok)throw new Error(data.error||'No se pudo cargar la planilla.');
if(data.sheets.some(sheet=>Object.values(sheet.cycles).some(rows=>rows.some(group=>!Object.hasOwn(group,'sheetPrices')))))throw new Error('El servidor local está ejecutando la versión anterior, que solo lee IDs. Cierra la ventana del servidor Python, vuelve a ejecutar iniciar-mvp.cmd y pulsa Cargar / actualizar planilla.');
sheets=data.sheets;$('sheetWeek').replaceChildren(...sheets.map(sheet=>new Option(sheet.name,sheet.name)));$('sheetWeek').disabled=false;summarize();
}catch(error){$('sheetWeek').replaceChildren(new Option('Carga la planilla primero',''));$('sheetStatus').textContent=error.message}
finally{loading=false;$('loadSheets').disabled=false;$('sheetSource').disabled=false}
});
function activate(index,focus=false){
Array.from(tabs.children).forEach((tab,i)=>{const selected=i===index;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;panels.children[i].hidden=!selected;if(selected&&focus)tab.focus()});
}
tabs.addEventListener('keydown',event=>{const current=Array.from(tabs.children).indexOf(document.activeElement);if(current<0)return;let index=current;if(event.key==='ArrowRight')index=(current+1)%tabs.children.length;else if(event.key==='ArrowLeft')index=(current-1+tabs.children.length)%tabs.children.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.children.length-1;else return;event.preventDefault();activate(index,true)});
function lock(value){
for(const input of $('form').querySelectorAll('input,select,button')){if(value){input.dataset.batchDisabled=String(input.disabled);input.disabled=true}else if('batchDisabled' in input.dataset){input.disabled=input.dataset.batchDisabled==='true';delete input.dataset.batchDisabled}}
}
async function createFrame(panel,config){
if(!templatePromise)templatePromise=fetch('mvp.html',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('No se pudo cargar la plantilla local.');return response.text()});
const source=await templatePromise;
const frame=document.createElement('iframe');frame.title='Banners '+config.ids.join(' - ');
const ready=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('El generador del grupo tardó demasiado en cargar.')),30000);frame.onload=()=>{clearTimeout(timeout);frame.contentWindow.bannerGenerator?resolve():reject(new Error('No se pudo iniciar el generador del grupo.'))}});
frame.srcdoc=source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('</head>','<style>body{background:white}.container{padding:0}#form,.generator-header,.results-heading{display:none!important}</style></head>').replace('</body>','<script>window.bannerEmbedded=true;<\/script><script src="mvp-local-generator.js?v='+generatorVersion+'"><\/script></body>');
panel.append(frame);await ready;
const observer=new frame.contentWindow.ResizeObserver(()=>{if(!panel.hidden)frame.style.height=(frame.contentDocument.body.scrollHeight+20)+'px'});observer.observe(frame.contentDocument.body);
const result=await frame.contentWindow.bannerGenerator.run(config);
if(!result.ok){frame.remove();throw new Error(result.message)}
return frame;
}
window.bannerBatch={isMassive:()=>mode.value==='massive',async generate(){
if(running||loading)return;
const config=window.bannerGenerator.snapshot(),rows=groups();
if(!config.ready){$('status').textContent='Selecciona una campaña y espera a que termine de cargar.';return}
if(!rows.length||rows.some(group=>group.error)){$('status').textContent='Carga una planilla y selecciona un ciclo con grupos válidos. Corrige los errores antes de generar.';return}
const emptyGroups=rows.filter(group=>!Object.values(groupFormats.get(group)).some(Boolean));
if(emptyGroups.length){$('status').textContent='Selecciona al menos un formato para cada grupo. Faltan formatos en '+emptyGroups.map(group=>group.cell).join(', ')+'.';return}
clearBatch();running=true;lock(true);batch.hidden=false;let failures=0;
try{
for(let i=0;i<rows.length;i++){
const group=rows[i],tab=document.createElement('button'),panel=document.createElement('div');
tab.type='button';tab.id='batchTab'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','batchPanel'+i);tab.textContent=group.ids.join(' - ');tab.title=group.cell;
panel.id='batchPanel'+i;panel.className='batch-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.tabIndex=0;
tab.addEventListener('click',()=>activate(i));tabs.append(tab);panels.append(panel);activate(i);
progress.textContent='Generando '+(i+1)+' de '+rows.length+' · '+group.cell+'…';
try{
const frame=await createFrame(panel,{...config,formats:groupFormats.get(group),ids:group.ids}),generator=frame.contentWindow.bannerGenerator,endpointPrices=generator.endpointPrices();
const downloads=document.createElement('div'),downloadAll=document.createElement('button'),downloadStatus=document.createElement('span');
downloads.className='batch-downloads';downloadAll.type='button';downloadAll.textContent='Descargar todos los formatos';
downloadStatus.setAttribute('role','status');downloadStatus.setAttribute('aria-live','polite');
downloads.append(downloadAll,downloadStatus);panel.prepend(downloads);
downloadAll.addEventListener('click',async()=>{
downloadAll.disabled=true;downloadStatus.textContent='Preparando descargas…';
try{
const count=await generator.downloadAll();
downloadStatus.textContent=count+' archivos enviados a descarga. Si el navegador lo solicita, permite las descargas múltiples.';
}catch(error){downloadStatus.textContent=error.message}
finally{downloadAll.disabled=false}
});
const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.className='sheet-prices-toggle';
checkbox.checked=!!group.sheetPrices;checkbox.disabled=!group.sheetPrices;
label.className='sheet-prices-control';label.append(checkbox,document.createTextNode(' Usar precios de planilla'));panel.prepend(label);
if(group.sheetPrices)generator.setPrices(group.sheetPrices);
else{const warning=document.createElement('p');warning.textContent=(group.priceError||'La planilla no tiene precios válidos para este grupo.')+' Se usan los precios del endpoint.';label.after(warning)}
checkbox.addEventListener('change',()=>generator.setPrices(checkbox.checked?group.sheetPrices:endpointPrices));
}catch(error){failures++;panel.replaceChildren();tab.dataset.error='true';tab.textContent+=' · Error';const p=document.createElement('p');p.textContent=group.cell+': '+error.message;panel.append(p)}
}
activate(0);progress.textContent='Proceso terminado: '+(rows.length-failures)+' grupos generados y '+failures+' con error.';$('status').textContent=progress.textContent;
}finally{running=false;lock(false)}
}};
$('selector-campana').addEventListener('change',()=>{if(!running)clearBatch()});
for(const input of formatInputs)input.addEventListener('change',()=>{
if(running||!window.bannerBatch.isMassive())return;
const key=formatKey(input);
for(const sheet of sheets)for(const cycle of Object.values(sheet.cycles))for(const group of cycle){
const formats=groupFormats.get(group);
if(formats)formats[key]=input.checked;
}
for(const checkbox of $('sheetSummary').querySelectorAll('[data-format="'+key+'"]'))checkbox.checked=input.checked;
clearBatch();
});
$('exportFormat').addEventListener('change',()=>{for(const frame of panels.querySelectorAll('iframe')){const select=frame.contentDocument.getElementById('exportFormat');select.value=$('exportFormat').value;select.dispatchEvent(new frame.contentWindow.Event('change'))}});
})();
