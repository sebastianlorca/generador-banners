(async function(){
const selector=document.getElementById('selector-campana'),status=document.getElementById('status');
document.getElementById('generate').disabled=true;selector.disabled=true;
if(!['http:','https:'].includes(location.protocol)){status.textContent='Abre iniciar-mvp.cmd para usar el servidor local.';return}
try{
await Promise.all(Array.from(selector.options).filter(option=>option.value).map(async option=>{
const response=await fetch(option.dataset.contentUrl+'?locale=es');
if(!response.ok){const error=await response.json();throw new Error(error.error||'Error HTTP '+response.status)}
const entry=await response.json();option.textContent=entry.meta.name;
}));
selector.disabled=false;
const script=document.createElement('script');script.src='mvp-local-generator.js?v='+Date.now();document.body.append(script);
}catch(error){status.textContent='No se pudieron cargar las campanas: '+error.message;status.classList.add('error')}
})();
