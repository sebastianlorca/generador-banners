(function(){
'use strict';
const root=document.getElementById('pcf-banner-mvp'),$=id=>root.querySelector('[id="'+id+'"]');
const section=$('products-heading').closest('section');
const modeLabel=document.createElement('label');modeLabel.textContent='Modo de generación';
const mode=document.createElement('select');mode.id='generationMode';
for(const [value,label] of [['individual','Individual'],['massive','Masivo desde Google Sheets']])mode.add(new Option(label,value));
modeLabel.append(mode);
const modeSection=document.createElement('section');modeSection.className='config-section';
modeSection.innerHTML='<h3><span class="step-number">01</span> Forma de generar los banners</h3>';
modeSection.append(modeLabel);$('form').prepend(modeSection);
const campaignSection=$('campaign-heading').closest('section');
$('campaign-heading').querySelector('.step-number').textContent='02';
$('products-heading').querySelector('.step-number').textContent='03';
$('formats-heading').querySelector('.step-number').textContent='04';
const settings=document.createElement('div');settings.className='batch-settings';settings.hidden=true;
settings.innerHTML='<label>Enlace o ID de Google Sheets<input id="sheetSource" type="text" value="https://docs.google.com/spreadsheets/d/1ic5fOWwP3AqzgsIcJ70ySvrq0y0TPX-nB3-KZnfieeQ/edit"></label><label>Hoja semanal<select id="sheetWeek"></select></label><button id="loadSheets" type="button" class="secondary">Cargar / actualizar semana</button><label>Ciclo<select id="sheetCycle"><option value="9">Lunes a jueves · fila 9</option><option value="43">Viernes a domingo · fila 43</option></select></label><p id="sheetStatus" role="status" aria-live="polite"></p><div id="sheetSummary" class="batch-summary" hidden></div>';
section.append(settings);
for(let week=1;week<=52;week++){const name='W'+String(week).padStart(2,'0');$('sheetWeek').add(new Option(name,name))}
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
const slug=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
function campaignFor(group){
const concept=group.campaignConcept?.trim();
if(!concept)throw new Error(group.campaignCell+': no tenía concepto de campaña. Banner no generado.');
const entries=window.bannerCampaigns||[];
let matches=entries.filter(entry=>entry.meta.uuid.toLowerCase()===concept.toLowerCase());
if(!matches.length)matches=entries.filter(entry=>entry.meta.slug&&slug(entry.meta.slug)===slug(concept));
if(!matches.length)matches=entries.filter(entry=>slug(entry.meta.name)===slug(concept));
if(matches.length!==1)throw new Error(group.campaignCell+': '+(matches.length?'el concepto coincide con varias campañas':'no se encontró diseño de campaña para «'+concept+'»')+'. Banner no generado.');
return matches[0];
}
const groupLabel=group=>group.cell+': '+(group.name||group.ids.join(' - ')||group.value);
const shortGroupLabel=group=>{const characters=Array.from(groupLabel(group));return characters.length>45?characters.slice(0,44).join('')+'…':characters.join('')};
function clearBatch(){tabs.replaceChildren();panels.replaceChildren();progress.textContent=''}
function updateSummaryStatus(){
const cards=Array.from($('sheetSummary').children),review=cards.filter(card=>card.dataset.state!=='ready').length;
$('sheetStatus').textContent=sheets.length?cards.length+' banners · '+(cards.length-review)+' listos · '+review+' por revisar'+(cards.length?'':' en este ciclo'):'';
}
function summarize(){
clearBatch();const rows=groups(),summary=$('sheetSummary');summary.replaceChildren();summary.hidden=!rows.length;
for(const group of rows){
const row=document.createElement('div'),heading=document.createElement('p');
row.className='batch-group';heading.id='sheet-group-'+group.cell;
const header=document.createElement('div'),position=document.createElement('span'),badge=document.createElement('span');
header.className='batch-card-header';position.textContent='Banner '+(summary.children.length+1)+' · '+group.cell;badge.className='batch-card-badge';header.append(position,badge);
heading.className='batch-card-title';heading.textContent=group.name||group.ids.join(' · ')||group.value;heading.title=groupLabel(group);
row.setAttribute('aria-labelledby',heading.id);row.append(header,heading);summary.append(row);
const concept=document.createElement('p'),cell=document.createElement('small');let campaignError='';
cell.className='batch-card-cell';cell.textContent='Celda de campaña: '+group.campaignCell;
try{const entry=campaignFor(group);concept.textContent='Campaña: '+entry.meta.name}catch(error){campaignError=error.message;concept.textContent=group.campaignConcept?'No encontramos una campaña para «'+group.campaignConcept+'».':'Falta el concepto de campaña.';if(error.message.includes('varias campañas'))concept.textContent='El concepto coincide con varias campañas.';cell.textContent='Revisa '+group.campaignCell+' en la planilla. Este banner se omitirá.';concept.className='batch-card-warning'}
row.append(concept,cell);
const products=document.createElement('p');products.className='batch-card-products';products.textContent='Productos: '+(group.ids.join(' · ')||'IDs inválidos');row.append(products);
if(group.error){const error=document.createElement('p');error.className='batch-card-warning';error.textContent=group.error;row.append(error);row.dataset.state='review';badge.textContent='⚠ Revisar IDs';continue}
const controls=document.createElement('div');
controls.className='batch-group-formats';controls.setAttribute('role','group');controls.setAttribute('aria-labelledby',heading.id);
let formats=groupFormats.get(group);
if(!formats){formats=Object.fromEntries(formatInputs.map(input=>[formatKey(input),input.checked]));groupFormats.set(group,formats)}
const updateCard=()=>{const empty=!Object.values(formats).some(Boolean);row.dataset.state=campaignError||empty?'review':'ready';badge.textContent=campaignError?'⚠ Sin campaña':empty?'⚠ Sin formatos':'✓ Listo';updateSummaryStatus()};
row.updateStatus=updateCard;
for(const input of formatInputs){
const key=formatKey(input),label=document.createElement('label'),checkbox=document.createElement('input');
checkbox.type='checkbox';checkbox.checked=formats[key];checkbox.dataset.format=key;
checkbox.addEventListener('change',()=>{formats[key]=checkbox.checked;clearBatch();updateCard()});
label.append(checkbox,document.createTextNode(input.nextElementSibling.firstChild.textContent));controls.append(label);
}
const formatLabel=document.createElement('p');formatLabel.className='batch-card-formats-title';formatLabel.textContent='Formatos';row.append(formatLabel,controls);updateCard();
}
updateSummaryStatus();
}
mode.addEventListener('change',()=>{
const massive=mode.value==='massive';campaignSection.hidden=massive;$('selector-campana').disabled=massive;$('selector-campana').required=!massive;
$('generate').disabled=false;settings.hidden=!massive;section.querySelector('.product-fields').hidden=massive;$('version').hidden=massive;
formatHelp.textContent=massive?'Cambia un formato aquí para aplicarlo a todos los grupos. Ajusta cada banner en la lista de la planilla.':individualFormatHelp;
for(const id of ['left','right','third'])$(id).disabled=massive;
results.hidden=massive;batch.hidden=!massive;
});
$('sheetWeek').addEventListener('change',()=>{sheets=[];summarize();$('sheetStatus').textContent='Pulsa Cargar / actualizar semana para leer '+$('sheetWeek').value+'.'});$('sheetCycle').addEventListener('change',summarize);
$('sheetSource').addEventListener('input',()=>{sheets=[];summarize();$('sheetStatus').textContent='Carga la planilla para aplicar el nuevo enlace.'});
$('loadSheets').addEventListener('click',async()=>{
if(loading||running)return;loading=true;clearBatch();sheets=[];$('sheetSummary').hidden=true;$('sheetWeek').disabled=true;$('loadSheets').disabled=true;$('sheetSource').disabled=true;
const source=$('sheetSource').value.trim();let id=source;
try{
if(source.startsWith('https://')){const url=new URL(source);if(url.hostname!=='docs.google.com')throw new Error('Usa un enlace de docs.google.com.');id=url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/)?.[1]||''}
if(!/^[A-Za-z0-9_-]{20,100}$/.test(id))throw new Error('Introduce un enlace o ID válido de Google Sheets.');
$('sheetStatus').textContent='Leyendo hojas y ciclos de Google Sheets… La carga puede tardar hasta 2 minutos.';
const response=await fetch('/api/sheets?id='+encodeURIComponent(id)+'&week='+encodeURIComponent($('sheetWeek').value),{cache:'no-store',signal:AbortSignal.timeout(150000)}),data=await response.json();
if(!response.ok)throw new Error(data.error||'No se pudo cargar la planilla.');
if(data.sheets.some(sheet=>Object.values(sheet.cycles).some(rows=>rows.some(group=>!Object.hasOwn(group,'campaignConcept')))))throw new Error('El servidor local está ejecutando la versión anterior, que no lee conceptos de campaña. Cierra la ventana del servidor Python, vuelve a ejecutar iniciar-mvp.cmd y pulsa Cargar / actualizar planilla.');
if(data.sheets.length!==1||data.sheets[0].name!==$('sheetWeek').value)throw new Error('El servidor no devolvió la semana seleccionada. Reinicia iniciar-mvp.cmd y recarga con Ctrl+F5.');
sheets=data.sheets;summarize();
}catch(error){$('sheetStatus').textContent=error.message}
finally{$('sheetWeek').disabled=false;loading=false;$('loadSheets').disabled=false;$('sheetSource').disabled=false}
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
if(!rows.length||rows.some(group=>group.error)){$('status').textContent='Carga una planilla y selecciona un ciclo con grupos válidos. Corrige los errores antes de generar.';return}
const emptyGroups=rows.filter(group=>!Object.values(groupFormats.get(group)).some(Boolean));
if(emptyGroups.length){$('status').textContent='Selecciona al menos un formato para cada grupo. Faltan formatos en '+emptyGroups.map(group=>group.cell).join(', ')+'.';return}
clearBatch();running=true;lock(true);batch.hidden=false;let failures=0;
try{
for(let i=0;i<rows.length;i++){
const group=rows[i],tab=document.createElement('button'),panel=document.createElement('div');
tab.type='button';tab.id='batchTab'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','batchPanel'+i);tab.textContent=shortGroupLabel(group);tab.title=groupLabel(group);
panel.id='batchPanel'+i;panel.className='batch-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.tabIndex=0;
tab.addEventListener('click',()=>activate(i));tabs.append(tab);panels.append(panel);activate(i);
progress.textContent='Generando '+(i+1)+' de '+rows.length+' · '+group.cell+'…';
try{
const entry=campaignFor(group);
const frame=await createFrame(panel,{...config,...window.bannerGenerator.campaignConfig(entry),formats:groupFormats.get(group),ids:group.ids}),generator=frame.contentWindow.bannerGenerator,endpointPrices=generator.endpointPrices();
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
for(const card of $('sheetSummary').children)card.updateStatus?.();
clearBatch();
});
$('exportFormat').addEventListener('change',()=>{for(const frame of panels.querySelectorAll('iframe')){const select=frame.contentDocument.getElementById('exportFormat');select.value=$('exportFormat').value;select.dispatchEvent(new frame.contentWindow.Event('change'))}});
})();
