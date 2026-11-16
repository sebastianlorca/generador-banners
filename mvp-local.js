(async function(){
const selector=document.getElementById('selector-campana'),status=document.getElementById('status');
document.getElementById('generate').disabled=true;selector.disabled=true;
if(!['http:','https:'].includes(location.protocol)){status.textContent='Abre iniciar-mvp.cmd para usar el servidor local.';return}
window.bannerCampaigns=[];
const placeholder=document.createElement('option');placeholder.value='';placeholder.disabled=true;placeholder.selected=true;placeholder.textContent='Selecciona una opción';selector.replaceChildren(placeholder);
try{
const response=await fetch('/api/campaigns',{cache:'no-store'});
if(!response.ok){const error=await response.json();throw new Error(error.error||'Error HTTP '+response.status)}
const payload=await response.json();
if(!Array.isArray(payload.entries))throw new Error('El servidor no devolvió un listado de campañas. Reinicia iniciar-mvp.cmd.');
for(const entry of payload.entries){
if(!entry.meta?.uuid||!entry.meta?.name)throw new Error('Campaña sin nombre o UUID.');
const option=document.createElement('option');option.value=entry.meta.uuid;option.textContent=entry.meta.name;
option.dataset.contentUrl='/api/campaigns/'+entry.meta.uuid;option.dataset.locale='es';selector.append(option);
window.bannerCampaigns.push(entry);
}
if(!payload.entries.length)throw new Error('No hay campañas publicadas disponibles en Modyo.');
selector.disabled=false;
const script=document.createElement('script');script.src='mvp-local-generator.js?v='+Date.now();document.body.append(script);
}catch(error){status.textContent='No se pudieron cargar las campanas: '+error.message;status.classList.add('error')}
})();
