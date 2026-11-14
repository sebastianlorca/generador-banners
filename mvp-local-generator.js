(function(){

const root=document.getElementById('pcf-banner-mvp');
if(!root||root.dataset.ready)return;
root.dataset.ready='true';
const $=id=>root.querySelector('[id="'+id+'"]');
const canvas=$('canvas'),ctx=canvas.getContext('2d');
let busy=false,lastScene=null;
const slotIds=['left','right','third'];
const controlNames=['Left','Right','Third'];
function registeredBrand(product){
const name=(product.marca?.nombre||'').trim();
return name?name.replace(/[\s®]+$/u,'')+'®':'';
}
function titleWithoutBrand(product){
const brand=(product.marca?.nombre||'').trim().replace(/[\s®]+$/u,''),escapedBrand=brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const title=brand?String(product.bannerTitle||'').replace(new RegExp('\\s*'+escapedBrand+'\\s*®?\\s*$','iu'),'').trim():product.bannerTitle;
return title||product.familia?.nombre||'Producto';
}
const editorProductIds=[null,null,null];
const backgroundFields={1:'background1',2:'background',3:'background3'};
const formatFields={desk:'formatDesk',mobile:'formatMobile',story:'formatStory',fhd:'formatFhd',mini:'formatMini',horizontal:'formatHorizontal',horizontal3840:'formatHorizontal3840'};
function selectedFormats(){return Object.fromEntries(Object.entries(formatFields).map(([key,id])=>[key,$(id).checked]))}
function syncFormatSections(){const formats=selectedFormats();for(const [key,contentId] of Object.entries({desk:'desktopPreviewContent',mobile:'mobilePreviews',story:'storyPreviews',fhd:'fhdPreviews',mini:'miniPreviews',horizontal:'horizontalPreviews',horizontal3840:'horizontal3840Previews'}))$(contentId).closest('details.preview').hidden=!formats[key]}
function sceneCanvases(scene){return [...(scene.formats.desk?[canvas]:[]),...root.querySelectorAll('#mobilePreviews canvas, #storyPreviews canvas, #fhdPreviews canvas, #miniPreviews canvas, #horizontalPreviews canvas, #horizontal3840Previews canvas')]}
const textColorFields={title:'titleColor',name:'nameColor',price:'priceColor',discount:'discountColor'};
const campaignSelector=$('selector-campana');
let campaignValues={},campaignLoading=false,campaignRequest=0,loadedCampaignId=null;
const campaignFieldIds=["titleColor", "nameColor", "priceColor", "discountColor", "background1", "background", "background3", "backgroundMobile", "backgroundStory", "backgroundFhd", "backgroundMini", "backgroundHorizontal", "backgroundHorizontal3840"];
const campaignFieldNames={"titleColor": "Color del t\u00edtulo", "nameColor": "Color del nombre", "priceColor": "Color del precio (oferta y referencial)", "discountColor": "Color del porcentaje de descuento", "background1": "Banner Principal Web Desk (1 producto)", "background": "Banner Principal Web Desk (2 productos)", "background3": "Banner Principal Web Desk (3 productos)", "backgroundMobile": "Banner Principal Web Mobile", "backgroundStory": "Banner Stories", "backgroundFhd": "Pantalla FHD", "backgroundMini": "Banner Mini Totem", "backgroundHorizontal": "Horizontal 5760", "backgroundHorizontal3840": "Horizontal 3840"};
function campaignFieldValue(value){
if(Array.isArray(value))return campaignFieldValue(value[0]);
if(value&&typeof value==='object')return campaignFieldValue(value.url??value.value??value.asset??'');
return value==null?'':String(value).trim();
}
function parseCampaign(raw){
if(!raw||/liquid\s*error/i.test(raw))throw new Error('Modyo no pudo entregar los datos de la entrada seleccionada.');
const entry=JSON.parse(raw);
const fields=Array.isArray(entry.fields)?Object.fromEntries(entry.fields.map(field=>[field.name,field.value??field])):entry.fields;
if(!fields||typeof fields!=='object')throw new Error('La entrada no contiene campos de campa\u00f1a.');
return Object.fromEntries(Object.entries(campaignFieldNames).map(([id,name])=>[id,campaignFieldValue(fields[name])]));
}
async function applyCampaign(){
if(busy)return;
const option=campaignSelector.selectedOptions[0],request=++campaignRequest;
campaignValues={};loadedCampaignId=null;invalidate();
campaignLoading=Boolean(option?.value);$('generate').disabled=campaignLoading;
if(!option?.value){status('Selecciona una campana antes de generar.');return}
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
try{
status('Cargando fondos y colores de la campana desde Modyo...');
const raw=option.getAttribute('data-content-url');
if(!raw||raw.includes('{')||raw.includes('<'))throw new Error('Actualiza el HTML del widget: falta la URL de contenido de la campana.');
const url=new URL(raw,location.origin);
if(!['https:','http:'].includes(url.protocol))throw new Error('URL de contenido de Modyo no valida.');
const locale=option.getAttribute('data-locale');if(locale)url.searchParams.set('locale',locale);
const response=await fetch(url.href,{headers:{Accept:'application/json'},credentials:'same-origin',signal:controller.signal});
if(!response.ok)throw new Error('No se pudo consultar la campana en Modyo (HTTP '+response.status+'). URL: '+url.href);
const entry=await response.json();
if(request!==campaignRequest)return;
if(entry.meta?.uuid!==option.value)throw new Error('La API no devolvio la campana seleccionada.');
campaignValues=parseCampaign(JSON.stringify(entry));
textColors=readTextColors();loadedCampaignId=option.value;
status('Campana cargada desde Modyo. Completa los IDs y pulsa Generar Banner.');
}catch(error){if(request===campaignRequest){campaignValues={};status(error.name==='AbortError'?'Modyo tardo demasiado en entregar la campana. Vuelve a seleccionarla.':error.message,true)}}
finally{clearTimeout(timer);if(request===campaignRequest){campaignLoading=false;$('generate').disabled=window.bannerBatch?.isMassive()?false:!loadedCampaignId}}
}
if(campaignSelector)campaignSelector.addEventListener('change',applyCampaign);
let textColors={};
const colorProbe=document.createElement('canvas').getContext('2d');
function validTextColor(value){if(!CSS.supports('color',value))return false;colorProbe.fillStyle='#010203';colorProbe.fillStyle=value;if(colorProbe.fillStyle!=='#010203')return true;colorProbe.fillStyle='#040506';colorProbe.fillStyle=value;return colorProbe.fillStyle!=='#040506'}
function readTextColors(){const colors={};let invalid=null;const labels={title:'titulo',name:'nombre',price:'precio',discount:'porcentaje de descuento'};for(const [key,id] of Object.entries(textColorFields)){const value=campaignValues[id]||'',valid=!value||validTextColor(value);if(!valid&&!invalid)invalid='Color de '+labels[key]+' no valido. Usa un color CSS, por ejemplo #ff0000, rgba(255,0,0,0.8) o red.';colors[key]=value}if(invalid)throw new Error(invalid);return colors}
function textColor(key,fallback){return textColors[key]||fallback}
function selectedSlots(){return slotIds.map((id,index)=>({id:$(id).value.trim(),index})).filter(slot=>slot.id)}
const previewLinks=new Map();let previewTimer,previewRevision=0;
function clearPreviewLinks(){
clearTimeout(previewTimer);previewRevision++;
for(const {link,url} of previewLinks.values()){link.removeAttribute('href');if(url)URL.revokeObjectURL(url)}
previewLinks.clear();
}
function updatePreviewLinks(){
clearTimeout(previewTimer);const revision=++previewRevision;
for(const {link} of previewLinks.values())link.removeAttribute('href');
const outputs=sceneCanvases(lastScene);
for(const output of outputs){
if(previewLinks.has(output))continue;
let link=output.closest('a.banner-preview-link');
if(!link){link=document.createElement('a');link.className='banner-preview-link';link.style.display='block';link.target='_blank';link.rel='noopener';link.title='Abrir imagen en otra pestaña · También puedes usar clic derecho';link.setAttribute('aria-label',output.getAttribute('aria-label')||'Abrir banner en otra pestaña');output.replaceWith(link);link.append(output)}
previewLinks.set(output,{link,url:null});
}
previewTimer=setTimeout(()=>{
for(const output of outputs)exportBlob(output).then(blob=>{
if(revision!==previewRevision||!output.isConnected)return;
const entry=previewLinks.get(output);if(!entry)return;
const url=URL.createObjectURL(blob);if(entry.url)URL.revokeObjectURL(entry.url);
entry.url=url;entry.link.href=url;
}).catch(()=>{const entry=previewLinks.get(output);if(revision===previewRevision&&entry){entry.link.removeAttribute('href');if(entry.url)URL.revokeObjectURL(entry.url);entry.url=null}});
},180);
}
window.addEventListener('pagehide',clearPreviewLinks);
function setDownloads(enabled){$('download').disabled=!enabled||!lastScene?.formats.desk;if($('downloadAll'))$('downloadAll').disabled=!enabled;for(const button of root.querySelectorAll('#mobilePreviews button, #storyPreviews button, #fhdPreviews button, #miniPreviews button, #horizontalPreviews button, #horizontal3840Previews button'))button.disabled=!enabled;if(enabled&&lastScene)updatePreviewLinks();else clearPreviewLinks()}
function hideProductControls(){$('sharedEditors').hidden=true;$('desktopPreviewContent').hidden=true;for(let i=0;i<3;i++){const mobile=$('mobileControls'+i);if(mobile){mobile.hidden=true;$('controlParking').append(mobile);}const story=$('storyControls'+i);if(story){story.hidden=true;$('controlParking').append(story)}const fhd=$('fhdControls'+i);if(fhd){fhd.hidden=true;$('controlParking').append(fhd)}const mini=$('miniControls'+i);if(mini){mini.hidden=true;$('controlParking').append(mini)}const horizontal=$('horizontalControls'+i);if(horizontal){horizontal.hidden=true;$('controlParking').append(horizontal)}const horizontal3840=$('horizontal3840Controls'+i);if(horizontal3840){horizontal3840.hidden=true;$('controlParking').append(horizontal3840)}$('controls'+i).hidden=true}$('imageControls').hidden=true}
function showProductControls(slots,formats){
$('desktopPreviewContent').hidden=!formats.desk;$('sharedEditors').hidden=formats.desk;
$(formats.desk?'deskControlsHost':'sharedControlsHost').append($('imageControls'));$('imageControls').hidden=false;
for(const slot of slots){$('controls'+slot.index).hidden=false;$('controls'+slot.index).querySelector('.zoom-options').hidden=!formats.desk;for(const key of ['mobile','story','fhd','mini','horizontal','horizontal3840'])$(key+'Controls'+slot.index).hidden=!formats[key]}
}
function invalidate(){hideProductControls();lastScene=null;setDownloads(false);$('mobilePreviews').replaceChildren();$('mobileHint').hidden=true;$('storyPreviews').replaceChildren();$('storyHint').hidden=true;$('fhdPreviews').replaceChildren();$('miniPreviews').replaceChildren();$('horizontalPreviews').replaceChildren();$('horizontal3840Previews').replaceChildren()}
function updateVersion(){const slots=selectedSlots(),count=slots.length;for(let i=0;i<3;i++){$('controls'+i).hidden=true;if(editorProductIds[i]!==$(slotIds[i]).value.trim()){editorProductIds[i]=null;$('image'+controlNames[i]).value='1';$('image'+controlNames[i]).disabled=true;$('customImage'+controlNames[i]).value='';$('customImage'+controlNames[i]).disabled=true;for(const field of ['title','name','price','reference']){const input=$(field+controlNames[i]);input.value='';input.disabled=true} $('discount'+controlNames[i]).textContent='Se completa al generar con el ID.';}}$('version').textContent=count?'Versión automática: '+count+' producto'+(count===1?'':'s')+'. Se usa el orden de los campos completados.':'Ingresa al menos un ID para elegir una versión.';invalidate();}

function catalogEndpoint(){return '/api/products'}
async function loadFonts(){await Promise.all(['400','500','700'].map(weight=>document.fonts.load(weight+' 20px Ubuntu')));if(!['400','500','700'].every(weight=>document.fonts.check(weight+' 20px Ubuntu')))throw new Error('No se pudo cargar Ubuntu. Revisa la conexión a Google Fonts y vuelve a generar el banner.')}
const productImageUrl=url=>url;
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error)}
function loadImage(url,label='imagen'){return new Promise((resolve,reject)=>{
const img=new Image(),resolved=new URL(url,document.baseURI),origin=new URL(document.baseURI).origin;
if(resolved.origin!==origin&&['assets.pcfactory.cl','assets-v3.pcfactory.cl'].includes(resolved.hostname)){resolved.href=new URL('/api/image?url='+encodeURIComponent(resolved.href),origin).href}
if(['http:','https:'].includes(resolved.protocol))img.crossOrigin='anonymous';
img.onload=()=>resolve(img);
img.onerror=()=>reject(new Error('No se pudo cargar '+label+'. Revisa el error de red en la consola del navegador: puede ser una respuesta HTTP, CORS o la politica CSP del sitio. Servidor de imagen: '+resolved.host+'. URL: '+resolved.href));
img.src=resolved.href;
})}
async function loadCampaignBackground(id,label){
const url=campaignValues[id];
if(!url)throw new Error('La entrada seleccionada no entrega la imagen de '+label+'. La API de contenido devolvio ese campo vacio para esta campana.');
if(/liquid|<!--|%3c!--/i.test(url))throw new Error('Modyo devolvio un error Liquid en el campo '+label+'.');
const resolved=new URL(url,document.baseURI);
if(!['http:','https:'].includes(resolved.protocol)||url.includes('Liquid::'))throw new Error('La imagen de '+label+' no tiene una URL valida en la entrada de Modyo.');
return loadImage(resolved.href,'el fondo '+label);
}
const loadBackground=count=>loadCampaignBackground(backgroundFields[count],'Banner Principal Web Desk ('+count+' producto'+(count===1?'':'s')+')');
const loadMobileBackground=()=>loadCampaignBackground('backgroundMobile','Banner Principal Web Mobile');
const loadStoryBackground=()=>loadCampaignBackground('backgroundStory','Banner Stories');
const loadFhdBackground=()=>loadCampaignBackground('backgroundFhd','Pantalla FHD');
const loadMiniBackground=()=>loadCampaignBackground('backgroundMini','Banner Mini Totem');
const loadHorizontalBackground=()=>loadCampaignBackground('backgroundHorizontal','Horizontal 5760');
const loadHorizontal3840Background=()=>loadCampaignBackground('backgroundHorizontal3840','Horizontal 3840');
async function getProducts(ids){
const endpoint=catalogEndpoint();
const query=new URLSearchParams();[...new Set(ids)].forEach(id=>query.append('productsIds',id));
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
try{
let response;try{response=await fetch(endpoint+'?'+query,{method:'GET',headers:{Accept:'application/json'},signal:controller.signal})}
catch(error){throw new Error(error.name==='AbortError'?'El catálogo tardó demasiado en responder. Intenta nuevamente.':'No se pudo consultar el servidor local. Abre mvp.html desde iniciar-mvp.cmd y revisa la conexión.');}
if(!response.ok){let detail='';try{detail=(await response.json()).error||''}catch{}throw new Error('La consulta al catálogo respondió HTTP '+response.status+'. '+(detail||'Revisa la consola del servidor local.'));}
const data=await response.json();if(!Array.isArray(data))throw new Error('El catálogo no devolvió una lista de productos.');return ids.map(id=>{const p=data.find(p=>String(p.id)===id);if(!p)throw new Error('El catálogo no devolvió el producto '+id+'.');if(!Number.isFinite(p.precio?.efectivo)||!p.imagenes?.['0']?.['250'])throw new Error('El producto '+id+' no tiene precio efectivo o foto principal.');return p})
}finally{clearTimeout(timer)}
}
// Only remove near-white pixels reachable from an image edge (four neighbours).
function clearEdgeWhite(data,width,height,tolerance,removeInterior=false){
const count=width*height,seen=new Uint8Array(count),queue=new Int32Array(count);let head=0,tail=0;
function visit(pixel){if(seen[pixel])return;seen[pixel]=1;const i=pixel*4;const low=Math.min(data[i],data[i+1],data[i+2]),high=Math.max(data[i],data[i+1],data[i+2]);if(data[i+3]===0||(255-low<=tolerance&&high-low<=30)){queue[tail++]=pixel}}
for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x)}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1)}
while(head<tail){const pixel=queue[head++],x=pixel%width,y=Math.floor(pixel/width);data[pixel*4+3]=0;if(x>0)visit(pixel-1);if(x<width-1)visit(pixel+1);if(y>0)visit(pixel-width);if(y<height-1)visit(pixel+width)}
if(removeInterior){for(let pixel=0;pixel<count;pixel++){const i=pixel*4,low=Math.min(data[i],data[i+1],data[i+2]),high=Math.max(data[i],data[i+1],data[i+2]);if(255-low<=tolerance&&high-low<=30)data[i+3]=0}}
return data;
}
function removeWhiteBackground(image,tolerance,removeInterior){const layer=document.createElement('canvas');layer.width=image.width;layer.height=image.height;const context=layer.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);let pixels;try{pixels=context.getImageData(0,0,layer.width,layer.height)}catch{throw new Error('No se pueden leer los pixeles de la foto por CORS. El servidor de fotos debe permitir CORS para este sitio Modyo.')}clearEdgeWhite(pixels.data,layer.width,layer.height,tolerance,removeInterior);context.putImageData(pixels,0,0);return layer}

const money=value=>'$'+new Intl.NumberFormat('es-CL',{maximumFractionDigits:0}).format(value);
const pricePlateSvgs={
horizontal:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="350" viewBox="0 0 400 350"><path fill="#42474a" d="M257.16,226.24H18.76c-10.36,0-18.76-8.4-18.76-18.76v-54.79c0-10.36,8.4-18.75,18.76-18.75h266.59L257.16,226.24Z"/><path fill="#8ee8b2" d="M400,226.24v-73.26c0-10.52-8.53-19.04-19.05-19.04h-98.43l-43.74,12.87-.24.07c-2.31.75-4.23,2.41-5.29,4.56-1.05,2.13-1.18,4.54-.38,6.77l24.41,68.03H400Z"/></svg>',
vertical:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="350" viewBox="0 0 400 350"><g id="PRECIO"><rect fill="#45494b" x="21.44" y="180.04" width="357.12" height="88.8" rx="14.23" ry="14.23"/></g><g id="DCTO"><path fill="#a9e4b0" d="M350.24,311.75l-88.47,5.99c-2.9.2-5.58-1.54-6.59-4.27l-16.72-45.41c-1.57-4.27,1.59-8.81,6.14-8.81h105.2c3.61,0,6.55,2.93,6.55,6.55v39.42C356.35,308.66,353.68,311.52,350.24,311.75Z"/></g></svg>'
};
let pricePlates,pricePlatesPromise;
function loadPricePlates(){
if(!pricePlatesPromise)pricePlatesPromise=Promise.all([pricePlateSvgs.horizontal,pricePlateSvgs.vertical,pricePlateSvgs.vertical.replace('<g id="DCTO">','<g id="DCTO" display="none">')].map(svg=>loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),'portaprecio'))).then(images=>{pricePlates=images}).catch(error=>{pricePlatesPromise=null;throw error});
return pricePlatesPromise;
}
function drawPricePlate(context,type,x,y,width,height,discounted){
// Crop only the SVG's transparent margins; keep price and discount geometry together.
if(type==='horizontal')context.drawImage(pricePlates[0],0,133.94,400,92.3,x,y,width,height);
else context.drawImage(pricePlates[discounted?1:2],21.44,180.04,357.12,138,x,y,width,height*138/88.8);
}
function brandText(context,text,x,y){
const font=context.font,size=Number(font.match(/([\d.]+)px/)?.[1]||16);let width=0;
for(const part of String(text).split(/(®)/)){
context.font=part==='®'?font.replace(/([\d.]+)px/,size*.5+'px'):font;
if(x!==undefined)context.fillText(part,x+width,y-(part==='®'?size*.35:0));
width+=context.measureText(part).width;
}
context.font=font;return width;
}
function fitText(text,x,y,maxWidth,size,min,color,weight='700'){ctx.fillStyle=color;while(size>min){ctx.font=weight+' '+size+'px Ubuntu';if(brandText(ctx,text)<=maxWidth)break;size--}ctx.font=weight+' '+size+'px Ubuntu';while(brandText(ctx,text)>maxWidth&&text.length>1)text=text.slice(0,-2)+'…';brandText(ctx,text,x,y)}
function drawProductName(name,x,priceY){
const width=300;let lines=[];let size=16;
for(;size>=10;size--){ctx.font='400 '+size+'px Ubuntu';lines=[];let line='';for(const word of String(name||'').split(/\s+/)){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>width){lines.push(line);line=word}else{line=candidate}}if(line)lines.push(line);if(lines.length<=2)break}
ctx.fillStyle=textColor('name','#414749');ctx.font='400 '+Math.max(10,size)+'px Ubuntu';lines.forEach((line,index)=>ctx.fillText(line,x+20,priceY-26+index*17));
}
function product(p,img,x,priceY,zoom=100,offsetX=0,offsetY=0){const imageBottom=priceY-55;const imageTop=105;const imageHeight=imageBottom-imageTop;const baseScale=Math.min(285/img.width,imageHeight/img.height);const scale=baseScale*zoom/100;const originalCenter=imageTop+imageHeight/2;const imageY=Math.min(originalCenter-img.height*scale/2,imageBottom-img.height*scale);ctx.drawImage(img,x+155-img.width*scale/2+offsetX,imageY+offsetY,img.width*scale,img.height*scale);const title=p.bannerTitle??((p.familia?.nombre||'Producto')+' '+registeredBrand(p));fitText(title,x+20,priceY-47,300,22,16,textColor('title','#414749'));drawProductName(p.nombre,x,priceY);
drawPricePlate(ctx,'horizontal',x,priceY,308,71,p.precio.descuento>0);fitText(money(p.precio.efectivo),x+9,priceY+46,175,36,24,textColor('price','#fff'));if(Number.isFinite(p.precio.referencia))fitText('Referencial: '+money(p.precio.referencia),x+13,priceY+65,175,12,10,textColor('price','#fff'),'400');const discount=p.precio.descuento;if(Number.isFinite(discount)&&discount>0)fitText('-'+Math.round(discount)+'%',x+191,priceY+53,111,48,28,textColor('discount','#104d32'));}
function singleProduct(p,img,zoom,offsetX,offsetY){
const scale=Math.min(390/img.width,270/img.height)*zoom/100;
ctx.drawImage(img,1300-img.width*scale/2+offsetX,250-img.height*scale/2+offsetY,img.width*scale,img.height*scale);
fitText(registeredBrand(p),790,180,305,32,20,textColor('title','#414749'));
fitText(titleWithoutBrand(p),790,221,305,28,18,textColor('title','#414749'));
fitText(p.nombre,790,249,305,20,12,textColor('name','#414749'),'400');
drawPricePlate(ctx,'vertical',790,261,275,68,p.precio.descuento>0);
fitText(money(p.precio.efectivo),800,315,255,50,28,textColor('price','#fff'));
if(Number.isFinite(p.precio.referencia))fitText('Referencial: '+money(p.precio.referencia),790,355,164,15,10,textColor('price','#414749'),'400');

if(Number.isFinite(p.precio.descuento)&&p.precio.descuento>0)fitText('-'+Math.round(p.precio.descuento)+'%',974,353,70,32,22,textColor('discount','#104d32'));
}
function calculatedDiscount(price,reference){return reference>0&&reference>price?Math.max(0,Math.min(100,Math.round((reference-price)/reference*100))):0}
function populateEditors(products,slots){products.forEach((p,i)=>{const index=slots[i].index,control=controlNames[index];if(editorProductIds[index]!==slots[i].id){$('title'+control).value=((p.familia?.nombre||'Producto')+' '+registeredBrand(p)).trim();$('name'+control).value=p.nombre||'';$('price'+control).value=p.precio.efectivo;$('reference'+control).value=Number.isFinite(p.precio.referencia)?p.precio.referencia:p.precio.efectivo;editorProductIds[index]=slots[i].id}for(const field of ['title','name','price','reference'])$(field+control).disabled=false;$('image'+control).disabled=false;$('customImage'+control).disabled=false})}
function editedProduct(p,index){const control=controlNames[index];const prices=['price','reference'].map(field=>{const input=$(field+control),value=Number(input.value);if(String(input.value).trim()===''||!Number.isSafeInteger(value)||value<0)throw new Error('Producto '+(index+1)+': ingresa precios enteros mayores o iguales a cero.');return value});const [price,reference]=prices,discount=calculatedDiscount(price,reference);$('discount'+control).textContent=discount?'Descuento calculado: '+discount+' %':'Sin descuento (el referencial debe ser mayor al precio).';return {...p,bannerTitle:$('title'+control).value,nombre:$('name'+control).value,precio:{...p.precio,efectivo:price,referencia:reference,descuento:discount}}}
function imageOptions(index){const name=controlNames[index];return {removeWhite:$('removeWhite'+name).checked,tolerance:Number($('tolerance'+name).value),removeInterior:$('removeInterior'+name).checked}}
function syncCutoutControls(){for(let index=0;index<3;index++){const name=controlNames[index],disabled=busy||editorProductIds[index]===null,custom=$('image'+name).value==='11';$('removeWhite'+name).disabled=disabled||custom;$('removeInterior'+name).disabled=disabled||custom||!$('removeWhite'+name).checked;$('tolerance'+name).disabled=disabled||custom||!$('removeWhite'+name).checked}}
async function loadProductImage(p,selection,options,customUrl=''){
async function prepare(url,label,custom=false){
const image=await loadImage(url,label);
// Check pixel access before drawing a custom image into either preview.
const probe=document.createElement('canvas');probe.width=1;probe.height=1;const context=probe.getContext('2d');context.drawImage(image,0,0,1,1);context.getImageData(0,0,1,1);
return !custom&&options.removeWhite?removeWhiteBackground(image,options.tolerance,options.removeInterior):image;
}
async function attempt(number){const url=p.imagenes?.[String(number-1)]?.['250'];if(!url)throw new Error('Imagen no disponible');return prepare(productImageUrl(url),'la imagen '+number+' del producto '+p.id)}
customUrl=customUrl.trim();
if(selection===11){
try{const url=new URL(customUrl);if(!['http:','https:'].includes(url.protocol))throw new Error('URL no permitida');const source=url.protocol==='https:'&&url.host==='assets.pcfactory.cl'&&url.pathname.startsWith('/public/foto/')?productImageUrl(url.href):url.href;return {image:await prepare(source,'la imagen personalizada',true),selection,fallback:false}}
catch{return {image:await attempt(1),selection:1,fallback:true}}
}
try{return {image:await attempt(selection),selection,fallback:false}}catch(error){if(selection===1)throw error;return {image:await attempt(1),selection:1,fallback:true}}
}
async function changeProductImage(index){
if(!lastScene||busy)return;
const scene=lastScene,position=scene.slots.findIndex(slot=>slot.index===index);if(position<0)return;
const selector=$('image'+controlNames[index]),previous=scene.imageSelections[position];
busy=true;if(campaignSelector)campaignSelector.disabled=true;$('generate').disabled=true;setDownloads(false);for(const name of controlNames){$('image'+name).disabled=true;$('customImage'+name).disabled=true}
status('Cargando imagen del producto...');
syncCutoutControls();
try{
const options=imageOptions(index);
if(!Number.isFinite(options.tolerance)||options.tolerance<5||options.tolerance>90)throw new Error('La intensidad debe estar entre 5 y 90.');
const result=await loadProductImage(scene.products[position],Number(selector.value),options,$('customImage'+controlNames[index]).value);
if(lastScene!==scene)return;
scene.renderedImages[position]=result.image;scene.imageSelections[position]=result.selection;selector.value=String(result.selection);
renderScene(scene);await Promise.all(sceneCanvases(scene).map(exportBlob));
if(lastScene!==scene)return;
setDownloads(true);status(result.fallback?'La imagen elegida no existe o no se pudo cargar. Se muestra la imagen '+result.selection+' del dropdown.':'Imagen actualizada en escritorio, mobile, stories y Pantalla FHD.');
}catch(error){if(lastScene===scene){selector.value=String(scene.imageSelections[position]??previous);setDownloads(false);status(error.message||'No se pudo cargar la imagen principal.',true)}}
finally{busy=false;if(campaignSelector)campaignSelector.disabled=!!window.bannerBatch?.isMassive();$('generate').disabled=false;for(let i=0;i<3;i++){const disabled=editorProductIds[i]!==$(slotIds[i]).value.trim()||editorProductIds[i]===null;$('image'+controlNames[i]).disabled=disabled;$('customImage'+controlNames[i]).disabled=disabled}syncCutoutControls()}
}
function refreshEdits(){if(!lastScene||busy)return;try{renderScene(lastScene);setDownloads(true);status('Formatos seleccionados actualizados. Las descargas incluyen los cambios.')}catch(error){setDownloads(false);status(error.message,true)}}
function mobileText(context,text,x,y,width,size,min,color,weight='700'){
text=String(text||'');context.fillStyle=color;
while(size>min){context.font=weight+' '+size+'px Ubuntu';if(brandText(context,text)<=width)break;size--}
context.font=weight+' '+size+'px Ubuntu';
while(brandText(context,text)>width&&text.length>1)text=text.slice(0,-2)+'\u2026';
brandText(context,text,x,y);
}
function mobileLines(context,text,x,y,width,size,maxLines,weight='700'){
context.font=weight+' '+size+'px Ubuntu';const words=String(text||'').trim().split(/\s+/);const lines=[];let line='';
for(const word of words){if(line&&brandText(context,line+' '+word)>width){lines.push(line);line=word}else line=line?line+' '+word:word}if(line)lines.push(line);
for(let i=0;i<Math.min(lines.length,maxLines);i++){const value=i===maxLines-1?lines.slice(i).join(' '):lines[i];mobileText(context,value,x,y+i*(size+3),width,size,size,textColor('title','#414749'),weight)}
}
function renderMobile(scene,edited){
const cards=edited.map((p,i)=>{
const cardId='mobileCard'+scene.slots[i].index;
const existing=$(cardId),card=existing||document.createElement('article');card.id=cardId;card.className='mobile-card product-controls';
const label=existing?card.querySelector('p'):document.createElement('p');label.textContent='Producto '+(i+1)+' ? '+p.id+' ? '+p.nombre;
const output=existing?card.querySelector('canvas'):document.createElement('canvas');output.width=556;output.height=416;output.setAttribute('aria-label','Banner mobile del producto '+p.id);
const c=output.getContext('2d');c.drawImage(scene.mobileBg,0,0,556,416);
const control=controlNames[scene.slots[i].index],img=scene.renderedImages[i];
const zoom=Number($('mobileZoom'+control).value)/100,x=Number($('mobileX'+control).value),y=Number($('mobileY'+control).value);
const scale=Math.min(220/img.width,155/img.height)*zoom;
c.save();c.beginPath();c.rect(275,160,235,190);c.clip();c.drawImage(img,398-img.width*scale/2+x,260-img.height*scale/2+y,img.width*scale,img.height*scale);c.restore();
// Mobile separates brand and title, keeping automatic titles free of duplicate brands.
mobileText(c,registeredBrand(p),54,201,210,23,16,textColor('title','#414749'));
mobileText(c,titleWithoutBrand(p),54,230,210,22,14,textColor('title','#414749'));
mobileText(c,p.nombre,54,250,210,16,12,textColor('name','#414749'),'400');
drawPricePlate(c,'vertical',52,258,210,52,p.precio.descuento>0);
mobileText(c,money(p.precio.efectivo),59,298,196,40,22,textColor('price','#fff'));
// Only draw the discount badge for a positive discount.
if(p.precio.descuento>0){

mobileText(c,'-'+p.precio.descuento+'%',185,329,51,24,17,textColor('discount','#104d32'));
}
if(p.precio.referencia>p.precio.efectivo){c.font='700 15px Ubuntu';c.fillStyle=textColor('price','#414749');const value=money(p.precio.referencia);const width=c.measureText(value).width;c.fillText(value,84,326);c.strokeStyle=textColor('price','#414749');c.lineWidth=1;c.beginPath();c.moveTo(83,321);c.lineTo(85+width,321);c.stroke()}
if(!existing){
const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Descargar mobile '+(i+1)+' PNG';button.disabled=true;button.addEventListener('click',()=>downloadCanvas(output,'banner-mobile-'+(i+1)+'-'+p.id+'.png'));
card.append(label,output,$('mobileControls'+scene.slots[i].index),button);
}else{const controls=$('mobileControls'+scene.slots[i].index);if(controls.parentNode!==card)card.insertBefore(controls,card.querySelector('button'))}
return card;
});
const container=$('mobilePreviews');if(container.children.length!==cards.length||cards.some((card,i)=>container.children[i]!==card))container.replaceChildren(...cards);$('mobileHint').hidden=true;updateExportLabels();
}
function renderStories(scene,edited){
const cards=edited.map((p,i)=>{
const index=scene.slots[i].index,control=controlNames[index],cardId='storyCard'+index;
const existing=$(cardId),card=existing||document.createElement('article');card.id=cardId;card.className='mobile-card product-controls';
const label=existing?card.querySelector('p'):document.createElement('p');label.textContent='Producto '+(i+1)+' \u00b7 '+p.id+' \u00b7 '+p.nombre;
const output=existing?card.querySelector('canvas'):document.createElement('canvas');output.width=1080;output.height=1920;output.setAttribute('aria-label','Storie del producto '+p.id);
const c=output.getContext('2d');c.drawImage(scene.storyBg,0,0,1080,1920);
const img=scene.renderedImages[i],zoom=Number($('storyZoom'+control).value)/100,x=Number($('storyX'+control).value),y=Number($('storyY'+control).value);
const scale=Math.min(670/img.width,520/img.height)*zoom;
c.save();c.beginPath();c.rect(145,690,790,625);c.clip();c.drawImage(img,540-img.width*scale/2+x,1020-img.height*scale/2+y,img.width*scale,img.height*scale);c.restore();
mobileText(c,p.bannerTitle,218,1370,680,52,30,textColor('title','#414749'));
mobileText(c,p.nombre,218,1420,680,38,22,textColor('name','#414749'),'400');
const discounted=p.precio.descuento>0;
drawPricePlate(c,'horizontal',168,1446,745,172,discounted);
mobileText(c,money(p.precio.efectivo),186,1560,400,90,42,textColor('price','#fff'));
if(p.precio.referencia>p.precio.efectivo)mobileText(c,'Referencial: '+money(p.precio.referencia),211,1600,390,30,20,textColor('price','#fff'),'400');
if(discounted)mobileText(c,'-'+p.precio.descuento+'%',630,1570,260,112,60,textColor('discount','#104d32'));
if(!existing){const button=document.createElement('button');button.type='button';button.className='secondary';button.disabled=true;button.addEventListener('click',()=>downloadCanvas(output,'banner-storie-'+(i+1)+'-'+p.id+'.png'));card.append(label,output,$('storyControls'+index),button)}
else{const controls=$('storyControls'+index);if(controls.parentNode!==card)card.insertBefore(controls,card.querySelector('button'))}
return card;
});
const container=$('storyPreviews');if(container.children.length!==cards.length||cards.some((card,i)=>container.children[i]!==card))container.replaceChildren(...cards);$('storyHint').hidden=true;updateExportLabels();
}
function renderFhd(scene,edited){
const cards=edited.map((p,i)=>{
const index=scene.slots[i].index,control=controlNames[index],cardId='fhdCard'+index;
const existing=$(cardId),card=existing||document.createElement('article');card.id=cardId;card.className='mobile-card fhd-card product-controls';
const label=existing?card.querySelector('p'):document.createElement('p');label.textContent='Producto '+(i+1)+' \u00b7 '+p.id+' \u00b7 '+p.nombre;
const output=existing?card.querySelector('canvas'):document.createElement('canvas');output.width=1920;output.height=1080;output.setAttribute('aria-label','Pantalla FHD del producto '+p.id);
const c=output.getContext('2d');c.drawImage(scene.fhdBg,0,0,1920,1080);
const img=scene.renderedImages[i],zoom=Number($('fhdZoom'+control).value)/100,x=Number($('fhdX'+control).value),y=Number($('fhdY'+control).value);
const scale=Math.min(740/img.width,490/img.height)*zoom;
c.save();c.beginPath();c.rect(950,380,930,650);c.clip();c.drawImage(img,1395-img.width*scale/2+x,720-img.height*scale/2+y,img.width*scale,img.height*scale);c.restore();
mobileText(c,registeredBrand(p),180,540,600,72,40,textColor('title','#414749'));
mobileText(c,titleWithoutBrand(p),176,630,640,64,36,textColor('title','#414749'));
mobileText(c,p.nombre,176,690,640,46,26,textColor('name','#414749'),'400');
drawPricePlate(c,'vertical',174,722,602,150,p.precio.descuento>0);
mobileText(c,money(p.precio.efectivo),194,840,558,120,60,textColor('price','#fff'));
if(p.precio.referencia>p.precio.efectivo){
const value=money(p.precio.referencia);c.font='700 46px Ubuntu';const width=Math.min(c.measureText(value).width,280);
mobileText(c,value,260,918,280,46,26,textColor('price','#414749'));c.strokeStyle=textColor('price','#414749');c.lineWidth=3;c.beginPath();c.moveTo(250,901);c.lineTo(270+width,901);c.stroke();
}
if(p.precio.descuento>0){mobileText(c,'-'+p.precio.descuento+'%',565,925,160,70,40,textColor('discount','#104d32'))}
if(!existing){const button=document.createElement('button');button.type='button';button.className='secondary';button.disabled=true;button.addEventListener('click',()=>downloadCanvas(output,'pantalla-fhd-'+(i+1)+'-'+p.id+'.png'));card.append(label,output,$('fhdControls'+index),button)}
else{const controls=$('fhdControls'+index);if(controls.parentNode!==card)card.insertBefore(controls,card.querySelector('button'))}
return card;
});
const container=$('fhdPreviews');if(container.children.length!==cards.length||cards.some((card,i)=>container.children[i]!==card))container.replaceChildren(...cards);updateExportLabels();
}
function renderMini(scene,edited){
const cards=edited.map((p,i)=>{
const index=scene.slots[i].index,control=controlNames[index],cardId='miniCard'+index;
const existing=$(cardId),card=existing||document.createElement('article');card.id=cardId;card.className='mobile-card product-controls';
const label=existing?card.querySelector('p'):document.createElement('p');label.textContent='Producto '+(i+1)+' \u00b7 '+p.id+' \u00b7 '+p.nombre;
const output=existing?card.querySelector('canvas'):document.createElement('canvas');output.width=800;output.height=1280;output.setAttribute('aria-label','Mini Totem del producto '+p.id);
const c=output.getContext('2d');c.drawImage(scene.miniBg,0,0,800,1280);
const img=scene.renderedImages[i],zoom=Number($('miniZoom'+control).value)/100,x=Number($('miniX'+control).value),y=Number($('miniY'+control).value);
const scale=Math.min(530/img.width,380/img.height)*zoom;
c.save();c.beginPath();c.rect(90,450,620,450);c.clip();c.drawImage(img,400-img.width*scale/2+x,710-img.height*scale/2+y,img.width*scale,img.height*scale);c.restore();
mobileText(c,p.bannerTitle,150,975,530,40,24,textColor('title','#414749'));
mobileText(c,p.nombre,150,1013,530,30,18,textColor('name','#414749'),'400');
// Cover the template price and badge before drawing the edited values.
c.fillStyle='#414749';c.beginPath();c.roundRect(110,1021,581,144,28);c.fill();
const discounted=p.precio.descuento>0;
if(discounted){c.save();c.beginPath();c.roundRect(110,1021,581,144,28);c.clip();c.fillStyle='#8ce5b0';c.beginPath();c.moveTo(535,1021);c.lineTo(691,1021);c.lineTo(691,1165);c.lineTo(484,1165);c.lineTo(449,1058);c.quadraticCurveTo(442,1043,457,1038);c.closePath();c.fill();c.restore()}
mobileText(c,money(p.precio.efectivo),125,1122,discounted?315:545,72,36,textColor('price','#fff'));
if(p.precio.referencia>p.precio.efectivo)mobileText(c,'Referencial: '+money(p.precio.referencia),143,1153,310,24,16,textColor('price','#fff'),'400');
if(discounted)mobileText(c,'-'+p.precio.descuento+'%',472,1130,202,86,44,textColor('discount','#104d32'));
if(!existing){const button=document.createElement('button');button.type='button';button.className='secondary';button.disabled=true;button.addEventListener('click',()=>downloadCanvas(output,'banner-mini-totem-'+(i+1)+'-'+p.id+'.png'));card.append(label,output,$('miniControls'+index),button)}
else{const controls=$('miniControls'+index);if(controls.parentNode!==card)card.insertBefore(controls,card.querySelector('button'))}
return card;
});
const container=$('miniPreviews');if(container.children.length!==cards.length||cards.some((card,i)=>container.children[i]!==card))container.replaceChildren(...cards);updateExportLabels();
}
function renderHorizontal(scene,edited){
const cards=edited.map((p,i)=>{
const index=scene.slots[i].index,control=controlNames[index],cardId='horizontalCard'+index;
const existing=$(cardId),card=existing||document.createElement('article');card.id=cardId;card.className='mobile-card fhd-card product-controls';
const label=existing?card.querySelector('p'):document.createElement('p');label.textContent='Producto '+(i+1)+' \u00b7 '+p.id+' \u00b7 '+p.nombre;
const output=existing?card.querySelector('canvas'):document.createElement('canvas');output.width=5760;output.height=1080;output.setAttribute('aria-label','Horizontal 5760 del producto '+p.id);
const c=output.getContext('2d');c.drawImage(scene.horizontalBg,0,0,5760,1080);
const img=scene.renderedImages[i],zoom=Number($('horizontalZoom'+control).value)/100,x=Number($('horizontalX'+control).value),y=Number($('horizontalY'+control).value);
const scale=Math.min(910/img.width,560/img.height)*zoom;
c.save();c.beginPath();c.rect(4000,200,1400,650);c.clip();c.drawImage(img,4640-img.width*scale/2+x,525-img.height*scale/2+y,img.width*scale,img.height*scale);c.restore();
mobileText(c,p.bannerTitle,2430,390,1030,72,42,textColor('title','#414749'));
mobileText(c,p.nombre,2430,458,1030,54,32,textColor('name','#414749'),'400');
const discounted=p.precio.descuento>0;
drawPricePlate(c,'horizontal',2355,490,1050,244,discounted);
mobileText(c,money(p.precio.efectivo),2382,656,565,126,64,textColor('price','#fff'));
if(p.precio.referencia>p.precio.efectivo)mobileText(c,'Referencial: '+money(p.precio.referencia),2415,714,550,42,28,textColor('price','#fff'),'400');
if(discounted)mobileText(c,'-'+p.precio.descuento+'%',3010,669,365,164,84,textColor('discount','#104d32'));
if(!existing){const button=document.createElement('button');button.type='button';button.className='secondary';button.disabled=true;button.addEventListener('click',()=>downloadCanvas(output,'pantalla-horizontal-'+(i+1)+'-'+p.id+'.png'));card.append(label,output,$('horizontalControls'+index),button)}
else{const controls=$('horizontalControls'+index);if(controls.parentNode!==card)card.insertBefore(controls,card.querySelector('button'))}
return card;
});
const container=$('horizontalPreviews');if(container.children.length!==cards.length||cards.some((card,i)=>container.children[i]!==card))container.replaceChildren(...cards);updateExportLabels();
}
function renderHorizontal3840(scene,edited){
const cards=edited.map((p,i)=>{
const index=scene.slots[i].index,control=controlNames[index],cardId='horizontal3840Card'+index;
const existing=$(cardId),card=existing||document.createElement('article');card.id=cardId;card.className='mobile-card fhd-card product-controls';
const label=existing?card.querySelector('p'):document.createElement('p');label.textContent='Producto '+(i+1)+' \u00b7 '+p.id+' \u00b7 '+p.nombre;
const output=existing?card.querySelector('canvas'):document.createElement('canvas');output.width=3840;output.height=1080;output.setAttribute('aria-label','Horizontal 3840 del producto '+p.id);
const c=output.getContext('2d');c.drawImage(scene.horizontal3840Bg,0,0,3840,1080);
const img=scene.renderedImages[i],zoom=Number($('horizontal3840Zoom'+control).value)/100,x=Number($('horizontal3840X'+control).value),y=Number($('horizontal3840Y'+control).value);
const scale=Math.min(750/img.width,470/img.height)*zoom;
c.save();c.beginPath();c.rect(2800,220,850,600);c.clip();c.drawImage(img,3260-img.width*scale/2+x,515-img.height*scale/2+y,img.width*scale,img.height*scale);c.restore();
mobileText(c,registeredBrand(p),2080,360,610,70,40,textColor('title','#414749'));
mobileText(c,titleWithoutBrand(p),2080,452,610,64,36,textColor('title','#414749'));
mobileText(c,p.nombre,2080,510,610,46,26,textColor('name','#414749'),'400');
drawPricePlate(c,'vertical',2075,535,620,155,p.precio.descuento>0);
mobileText(c,money(p.precio.efectivo),2098,660,575,120,60,textColor('price','#fff'));
if(p.precio.referencia>p.precio.efectivo){const value=money(p.precio.referencia);c.font='700 46px Ubuntu';const width=Math.min(c.measureText(value).width,280);mobileText(c,value,2155,735,280,46,26,textColor('price','#414749'));c.strokeStyle=textColor('price','#414749');c.lineWidth=3;c.beginPath();c.moveTo(2145,718);c.lineTo(2165+width,718);c.stroke()}
if(p.precio.descuento>0){mobileText(c,'-'+p.precio.descuento+'%',2480,746,165,70,40,textColor('discount','#104d32'))}
if(!existing){const button=document.createElement('button');button.type='button';button.className='secondary';button.disabled=true;button.addEventListener('click',()=>downloadCanvas(output,'horizontal-3840-'+(i+1)+'-'+p.id+'.png'));card.append(label,output,$('horizontal3840Controls'+index),button)}
else{const controls=$('horizontal3840Controls'+index);if(controls.parentNode!==card)card.insertBefore(controls,card.querySelector('button'))}
return card;
});
const container=$('horizontal3840Previews');if(container.children.length!==cards.length||cards.some((card,i)=>container.children[i]!==card))container.replaceChildren(...cards);updateExportLabels();
}
function exportBlob(output){const mime='image/'+$('exportFormat').value;return new Promise((resolve,reject)=>{try{output.toBlob(blob=>{if(!blob)return reject(new Error('No se pudo exportar la imagen.'));if(blob.type!==mime)return reject(new Error('El navegador no admite este formato. Selecciona PNG.'));resolve(blob)},mime,0.9)}catch{reject(new Error('No se pudo exportar la imagen. Comprueba los permisos CORS de los fondos.'))}})}
function updateExportLabels(){const format=$('exportFormat').value.toUpperCase();$('download').textContent='Descargar escritorio '+format;root.querySelectorAll('#mobilePreviews button').forEach((button,i)=>{button.textContent='Descargar mobile '+(i+1)+' '+format});root.querySelectorAll('#storyPreviews button').forEach((button,i)=>{button.textContent='Descargar storie '+(i+1)+' '+format});root.querySelectorAll('#fhdPreviews button').forEach((button,i)=>{button.textContent='Descargar Pantalla FHD '+(i+1)+' '+format});root.querySelectorAll('#miniPreviews button').forEach((button,i)=>{button.textContent='Descargar Mini Totem '+(i+1)+' '+format});root.querySelectorAll('#horizontalPreviews button').forEach((button,i)=>{button.textContent='Descargar Horizontal 5760 '+(i+1)+' '+format});root.querySelectorAll('#horizontal3840Previews button').forEach((button,i)=>{button.textContent='Descargar Horizontal 3840 '+(i+1)+' '+format})}
$('exportFormat').addEventListener('change',()=>{updateExportLabels();if(lastScene&&!$('downloadAll')?.disabled)updatePreviewLinks()});
async function downloadCanvas(output,filename){try{const blob=await exportBlob(output),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename.replace(/\.png$/,'.'+blob.type.split('/')[1]);a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}catch(error){status(error.message,true)}}
function renderScene(scene){
textColors=readTextColors();
const edited=scene.products.map((p,i)=>editedProduct(p,scene.slots[i].index));
if(scene.formats.desk){ctx.clearRect(0,0,1920,525);ctx.drawImage(scene.bg,0,0,1920,525);
const count=scene.products.length;const layouts=count===3?[[532,343],[965,343],[1401,343]]:[[328,343],[1281,365]];
edited.forEach((p,i)=>{const control=controlNames[scene.slots[i].index],zoom=Number($('zoom'+control).value),x=Number($('offset'+control+'X').value),y=Number($('offset'+control+'Y').value);if(count===1)singleProduct(p,scene.renderedImages[i],zoom,x,y);else product(p,scene.renderedImages[i],...layouts[i],zoom,x,y)});
}
if(scene.formats.mobile)renderMobile(scene,edited);if(scene.formats.story)renderStories(scene,edited);if(scene.formats.fhd)renderFhd(scene,edited);if(scene.formats.mini)renderMini(scene,edited);if(scene.formats.horizontal)renderHorizontal(scene,edited);if(scene.formats.horizontal3840)renderHorizontal3840(scene,edited);
}
for(let i=0;i<3;i++){
const name=controlNames[i],group=document.createElement('details');group.id='controls'+i;group.hidden=true;
group.innerHTML='<summary>Producto '+(i+1)+' - Editar controles</summary><div class="text-fields"><label>Título principal<input id="title'+name+'" type="text" disabled></label><label>Nombre del producto<input id="name'+name+'" type="text" disabled></label><label>Precio ($)<input id="price'+name+'" type="number" min="0" step="1" required disabled></label><label>Precio referencial ($)<input id="reference'+name+'" type="number" min="0" step="1" required disabled></label><small id="discount'+name+'">Se completa al generar con el ID.</small></div><div class="image-choice"><label>Imagen del producto<select id="image'+name+'" disabled>'+Array.from({length:10},(_,index)=>'<option value="'+(index+1)+'">'+(index+1)+'</option>').join('')+'<option value="11">11 - Personalizada</option></select></label><label>Imagen personalizada<input id="customImage'+name+'" type="text" inputmode="url" placeholder="https://ejemplo.cl/imagen.png" disabled></label><small>Opciones 1 a 10: fotos del cat&aacute;logo. Opci&oacute;n 11: URL personalizada, aplicada al salir del campo. Si est&aacute; vac&iacute;a o falla, se usa la imagen 1.</small></div><div class="zoom-options">'+[['zoom'+name,'Zoom (%)',50,250,100],['offset'+name+'X','Eje X (px)',-500,500,0],['offset'+name+'Y','Eje Y (px)',-500,500,0],['mobileZoom'+name,'Mobile: Zoom (%)',50,250,100],['mobileX'+name,'Mobile: Eje X (px)',-150,150,0],['mobileY'+name,'Mobile: Eje Y (px)',-150,150,0]].map(([id,label,min,max,value])=>'<label>'+label+'<div class="zoom-row"><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" value="'+value+'"><input id="'+id+'Number" type="number" min="'+min+'" max="'+max+'" value="'+value+'" step="1" aria-label="'+label+' producto '+(i+1)+'"></div></label>').join('')+'</div>';
const mobileGroup=document.createElement('details');mobileGroup.id='mobileControls'+i;mobileGroup.hidden=true;
mobileGroup.innerHTML='<summary>Ajustar imagen mobile</summary><div class="zoom-options"></div>';
const desktopZoom=group.querySelector('.zoom-options'),mobileZoom=mobileGroup.querySelector('.zoom-options');
for(const label of Array.from(desktopZoom.children)){if(label.querySelector('input').id.startsWith('mobile'))mobileZoom.append(label)}
const storyGroup=mobileGroup.cloneNode(true);storyGroup.id='storyControls'+i;storyGroup.querySelector('summary').textContent='Ajustar imagen storie';for(const input of storyGroup.querySelectorAll('input')){input.id=input.id.replace('mobile','story');input.min=input.id.includes('Zoom')?'50':'-500';input.max=input.id.includes('Zoom')?'250':'500';if(input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.getAttribute('aria-label').replace('Mobile','Storie'))}for(const label of storyGroup.querySelectorAll('label'))label.firstChild.textContent=label.firstChild.textContent.replace('Mobile','Storie');$('controlParking').append(storyGroup);
const fhdGroup=storyGroup.cloneNode(true);fhdGroup.id='fhdControls'+i;fhdGroup.querySelector('summary').textContent='Ajustar imagen Pantalla FHD';for(const input of fhdGroup.querySelectorAll('input')){input.id=input.id.replace('story','fhd');if(input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.getAttribute('aria-label').replace('Storie','Pantalla FHD'))}for(const label of fhdGroup.querySelectorAll('label'))label.firstChild.textContent=label.firstChild.textContent.replace('Storie','Pantalla FHD');$('controlParking').append(fhdGroup);
const miniGroup=storyGroup.cloneNode(true);miniGroup.id='miniControls'+i;miniGroup.querySelector('summary').textContent='Ajustar imagen Mini Totem';for(const input of miniGroup.querySelectorAll('input')){input.id=input.id.replace('story','mini');if(input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.getAttribute('aria-label').replace('Storie','Mini Totem'))}for(const label of miniGroup.querySelectorAll('label'))label.firstChild.textContent=label.firstChild.textContent.replace('Storie','Mini Totem');$('controlParking').append(miniGroup);
const horizontalGroup=storyGroup.cloneNode(true);horizontalGroup.id='horizontalControls'+i;horizontalGroup.querySelector('summary').textContent='Ajustar imagen Horizontal 5760';for(const input of horizontalGroup.querySelectorAll('input')){input.id=input.id.replace('story','horizontal');if(input.id.startsWith('horizontalX')){input.min='-1500';input.max='1500'}if(input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.getAttribute('aria-label').replace('Storie','Horizontal 5760'))}for(const label of horizontalGroup.querySelectorAll('label'))label.firstChild.textContent=label.firstChild.textContent.replace('Storie','Horizontal 5760');$('controlParking').append(horizontalGroup);
const horizontal3840Group=storyGroup.cloneNode(true);horizontal3840Group.id='horizontal3840Controls'+i;horizontal3840Group.querySelector('summary').textContent='Ajustar imagen Horizontal 3840';for(const input of horizontal3840Group.querySelectorAll('input')){input.id=input.id.replace('story','horizontal3840');if(input.id.startsWith('horizontal3840X')){input.min='-1000';input.max='1000'}if(input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.getAttribute('aria-label').replace('Storie','Horizontal 3840'))}for(const label of horizontal3840Group.querySelectorAll('label'))label.firstChild.textContent=label.firstChild.textContent.replace('Storie','Horizontal 3840');$('controlParking').append(horizontal3840Group);
const note=document.createElement('p');note.className='shared-note';note.textContent='T\u00edtulo, nombre, precios e imagen se comparten con todos los formatos. El zoom y los ejes de esta secci\u00f3n solo afectan escritorio.';group.querySelector('summary').after(note);
const cutout=document.createElement('fieldset');cutout.className='cutout-options';
cutout.innerHTML='<legend>Fondo de la foto de catálogo</legend><label class="toggle"><input id="removeWhite'+name+'" type="checkbox" checked>Quitar fondo blanco</label><label class="toggle"><input id="removeInterior'+name+'" type="checkbox" checked>Quitar también blancos interiores</label><label>Intensidad de eliminación (5 a 90)<input id="tolerance'+name+'" type="number" min="5" max="90" step="1" value="35"></label><small>Aplica a este producto en los formatos de este banner. Las imágenes personalizadas conservan sus blancos y transparencia originales.</small>';
group.querySelector('.image-choice').after(cutout);
$('imageControls').append(group);$('controlParking').append(mobileGroup);
for(const field of ['removeWhite','removeInterior','tolerance'])$(field+name).addEventListener('change',()=>{syncCutoutControls();changeProductImage(i)});
$('image'+name).addEventListener('change',()=>changeProductImage(i));
$('customImage'+name).addEventListener('change',()=>{if($('image'+name).value==='11')changeProductImage(i)});
for(const field of ['title','name','price','reference'])$(field+name).addEventListener('input',refreshEdits);
for(const id of ['zoom'+name,'offset'+name+'X','offset'+name+'Y','mobileZoom'+name,'mobileX'+name,'mobileY'+name,'storyZoom'+name,'storyX'+name,'storyY'+name,'fhdZoom'+name,'fhdX'+name,'fhdY'+name,'miniZoom'+name,'miniX'+name,'miniY'+name,'horizontalZoom'+name,'horizontalX'+name,'horizontalY'+name,'horizontal3840Zoom'+name,'horizontal3840X'+name,'horizontal3840Y'+name]){const slider=$(id),number=$(id+'Number');function update(source){if(source.value===''||!Number.isFinite(Number(source.value)))return;const value=Math.max(Number(slider.min),Math.min(Number(slider.max),Math.round(Number(source.value))));slider.value=value;number.value=value;if(lastScene&&!busy)refreshEdits()}slider.addEventListener('input',()=>update(slider));number.addEventListener('input',()=>update(number));number.addEventListener('change',()=>{if(number.value==='')number.value=slider.value;update(number)})}
}
slotIds.forEach(id=>$(id).addEventListener('input',updateVersion));
for(const id of Object.values(formatFields))$(id).addEventListener('change',()=>{invalidate();syncFormatSections();status('Formatos actualizados. Pulsa Generar Banner para aplicar la seleccion.')});
async function generate(event){
event?.preventDefault();if(busy||campaignLoading)return false;busy=true;if(campaignSelector)campaignSelector.disabled=true;invalidate();$('generate').disabled=true;for(const id of Object.values(formatFields))$(id).disabled=true;$('products').replaceChildren();
try{
const slots=selectedSlots(),formats=selectedFormats();
if(campaignSelector&&!campaignSelector.value)throw new Error('Selecciona una campaña antes de generar.');
if(!slots.length)throw new Error('Ingresa al menos un ID de producto.');
if(!Object.values(formats).some(Boolean))throw new Error('Selecciona al menos un formato: Desk, Mobile, Storie, FHD, Mini Totem, Horizontal 5760 o Horizontal 3840.');
status('Consultando productos y cargando los formatos seleccionados...');
textColors=readTextColors();const ids=slots.map(slot=>slot.id);await Promise.all([loadFonts(),loadPricePlates()]);
const [bg,products,mobileBg,storyBg,fhdBg,miniBg,horizontalBg,horizontal3840Bg]=await Promise.all([formats.desk?loadBackground(ids.length):null,getProducts(ids),formats.mobile?loadMobileBackground():null,formats.story?loadStoryBackground():null,formats.fhd?loadFhdBackground():null,formats.mini?loadMiniBackground():null,formats.horizontal?loadHorizontalBackground():null,formats.horizontal3840?loadHorizontal3840Background():null]);
const options=slots.map(slot=>imageOptions(slot.index));
if(options.some(option=>!Number.isFinite(option.tolerance)||option.tolerance<5||option.tolerance>90))throw new Error('La intensidad debe estar entre 5 y 90.');
const results=await Promise.all(products.map((p,i)=>loadProductImage(p,Number($('image'+controlNames[slots[i].index]).value),options[i],$('customImage'+controlNames[slots[i].index]).value)));
const renderedImages=results.map(result=>result.image),imageSelections=results.map(result=>result.selection);
results.forEach((result,i)=>{$('image'+controlNames[slots[i].index]).value=String(result.selection)});populateEditors(products,slots);
const scene={bg,products,mobileBg,storyBg,fhdBg,miniBg,horizontalBg,horizontal3840Bg,renderedImages,slots,imageSelections,imageOptions:options,formats};
renderScene(scene);await Promise.all(sceneCanvases(scene).map(exportBlob));
if(formats.desk)for(const p of products){const line=document.createElement('span');line.textContent=p.id+' \u00b7 '+p.nombre;$('products').append(line)}
lastScene=scene;showProductControls(slots,formats);setDownloads(true);
const labels={desk:'Desk',mobile:'Mobile',story:'Storie',fhd:'FHD',mini:'Mini Totem',horizontal:'Horizontal 5760',horizontal3840:'Horizontal 3840'};
status((results.some(result=>result.fallback)?'Una imagen no estaba disponible; se usa la imagen 1. ':'')+'Generados: '+Object.keys(formats).filter(key=>formats[key]).map(key=>labels[key]).join(', ')+'.'+(formats.desk&&(bg.width!==1920||bg.height!==525)?' El fondo Desk se ajusto a 1920 x 525 px.':''));
return true;
}catch(error){invalidate();status(error.message||'No se pudo generar el banner.',true);return false}
finally{busy=false;if(campaignSelector)campaignSelector.disabled=!!window.bannerBatch?.isMassive();$('generate').disabled=false;for(const id of Object.values(formatFields))$(id).disabled=false;syncCutoutControls()}
}
$('form').addEventListener('submit',event=>{
if(window.bannerBatch?.isMassive()){event.preventDefault();window.bannerBatch.generate();return}
generate(event);
});
$('download').addEventListener('click',()=>{if(lastScene)downloadCanvas(canvas,'banner-'+lastScene.products.map(p=>p.id).join('-')+'.png')});
if(!window.bannerEmbedded){
const actions=document.createElement('div'),button=document.createElement('button'),message=document.createElement('span');
actions.className='actions';button.id='downloadAll';button.type='button';button.disabled=true;button.textContent='Descargar todos los formatos';
message.setAttribute('role','status');message.setAttribute('aria-live','polite');
actions.append(button,message);root.querySelector('.results-heading').append(actions);
button.addEventListener('click',async()=>{
button.disabled=true;message.textContent='Preparando descargas…';
try{
const count=await window.bannerGenerator.downloadAll();
message.textContent=count+' archivos enviados a descarga. Si el navegador lo solicita, permite las descargas múltiples.';
}catch(error){message.textContent=error.message}
finally{button.disabled=!lastScene||busy||sceneCanvases(lastScene).length===0}
});
}
updateVersion();
syncFormatSections();


window.bannerGenerator={
async downloadAll(){
const containers={mobile:['mobilePreviews','banner-mobile'],story:['storyPreviews','banner-storie'],fhd:['fhdPreviews','pantalla-fhd'],mini:['miniPreviews','banner-mini-totem'],horizontal:['horizontalPreviews','pantalla-horizontal'],horizontal3840:['horizontal3840Previews','horizontal-3840']};
if(!lastScene||busy)throw new Error('Espera a que termine de actualizarse el banner.');
const outputs=[];
if(lastScene.formats.desk){
if($('download').disabled)throw new Error('Revisa los datos del banner antes de descargar.');
outputs.push([canvas,'banner-'+lastScene.products.map(p=>p.id).join('-')]);
}
for(const [key,[containerId,prefix]] of Object.entries(containers)){
if(!lastScene.formats[key])continue;
const container=$(containerId);
if(Array.from(container.querySelectorAll('button')).some(button=>button.disabled))throw new Error('Revisa los datos del banner antes de descargar.');
Array.from(container.querySelectorAll('canvas')).forEach((output,i)=>outputs.push([output,prefix+'-'+(i+1)+'-'+lastScene.products[i].id]));
}
// Encode every piece before starting downloads so export errors stop the whole batch.
const files=await Promise.all(outputs.map(async([output,name])=>({blob:await exportBlob(output),name})));
for(const {blob,name} of files){
const url=URL.createObjectURL(blob),link=document.createElement('a');
link.href=url;link.download=name+'.'+blob.type.split('/')[1];link.click();
setTimeout(()=>URL.revokeObjectURL(url),10000);
await new Promise(resolve=>setTimeout(resolve,200));
}
return files.length;
},
setPrices(prices){
if(!lastScene||busy)return false;
if(!Array.isArray(prices)||prices.length!==lastScene.slots.length||prices.some(p=>!['efectivo','referencia'].every(key=>Number.isSafeInteger(p[key])&&p[key]>=0)))return false;
lastScene.slots.forEach((slot,i)=>{const control=controlNames[slot.index];$('price'+control).value=prices[i].efectivo;$('reference'+control).value=prices[i].referencia});
refreshEdits();return true;
},
endpointPrices:()=>lastScene?.products.map(p=>({efectivo:p.precio.efectivo,referencia:Number.isFinite(p.precio.referencia)?p.precio.referencia:p.precio.efectivo})),
campaignConfig:entry=>({campaign:entry.meta.uuid,values:parseCampaign(JSON.stringify(entry))}),
snapshot:()=>({campaign:campaignSelector.value,values:{...campaignValues},formats:selectedFormats(),exportFormat:$('exportFormat').value,ready:!!loadedCampaignId&&!campaignLoading&&!busy}),
async run(config){
campaignSelector.value=config.campaign;campaignValues={...config.values};loadedCampaignId=config.campaign;campaignLoading=false;
slotIds.forEach((id,i)=>{$(id).value=config.ids[i]||''});updateVersion();
for(const [key,id] of Object.entries(formatFields))$(id).checked=!!config.formats[key];
$('exportFormat').value=config.exportFormat;syncFormatSections();
const ok=await generate();return {ok,message:$('status').textContent};
}
};
if(!window.bannerEmbedded){if(campaignSelector)applyCampaign();else status('Falta el selector de campanas. Actualiza el HTML del widget.',true)}

})();
