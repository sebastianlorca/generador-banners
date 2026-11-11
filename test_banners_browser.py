"""Prueba de navegador con servicios simulados; no comprueba Google ni PC Factory."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import subprocess
import threading
import re
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parent
TEST = r'''
<script>
(async()=>{
const $=id=>document.getElementById(id),wait=async predicate=>{for(let i=0;i<300;i++){if(predicate())return;await new Promise(r=>setTimeout(r,50))}throw Error('Tiempo de espera agotado')},assert=(v,m)=>{if(!v)throw Error(m)};
try{
await wait(()=>window.bannerGenerator);
$('selector-campana').selectedIndex=1;$('selector-campana').dispatchEvent(new Event('change'));
await wait(()=>bannerGenerator.snapshot().ready);
$('generationMode').value='massive';$('generationMode').dispatchEvent(new Event('change'));
$('loadSheets').click();await wait(()=>$('sheetWeek').value==='W45');
assert($('sheetSummary').children.length===4,'Resumen');
for(const input of document.querySelectorAll('.format-options input')){
if(!['formatDesk','formatMobile'].includes(input.id))input.click();
}
const groupRows=$('sheetSummary').children;
const groupFormat=(index,key)=>groupRows[index].querySelector('[data-format="'+key+'"]');
groupFormat(0,'mobile').click();
groupFormat(2,'desk').click();
groupFormat(2,'mobile').click();
await bannerBatch.generate();
assert(!$('batchTab0')&&$('status').textContent.includes('Faltan formatos'),'Validar grupo sin formatos');
groupFormat(2,'mobile').click();
await bannerBatch.generate();
const tabs=[...document.querySelectorAll('[role=tab]')],frames=[...document.querySelectorAll('iframe')];
assert(tabs.length===4&&frames.length===3,'Pestañas y continuidad tras error: '+tabs.length+'/'+frames.length+' '+document.querySelectorAll('.batch-panel')[0]?.textContent);
assert(tabs[1].dataset.error==='true','Error por grupo');
const first=frames[0].contentDocument,second=frames[1].contentDocument;
assert(first.getElementById('formatDesk').checked&&!first.getElementById('formatMobile').checked,'Primer grupo solo Desk');
assert(!second.getElementById('formatDesk').checked&&second.getElementById('formatMobile').checked,'Otro grupo solo Mobile');
assert(tabs[0].getAttribute('aria-selected')==='true'&&getComputedStyle(tabs[0]).backgroundColor!==getComputedStyle(tabs[2]).backgroundColor,'Estilo activo diferenciado');
assert(first.getElementById('download').disabled===false,'Descarga habilitada');
assert(first.getElementById('titleLeft').value==='Familia Marca®','Marca registrada en titulo del grupo');
const toggles=[...document.querySelectorAll('.sheet-prices-toggle')];
assert(toggles[0].checked&&first.getElementById('priceLeft').value==='619990','Precios de planilla iniciales');
assert(first.getElementById('referenceLeft').value==='1029990','Referencial de planilla');
assert(first.getElementById('discountLeft').textContent.includes('40'),'Descuento de planilla');
toggles[0].checked=false;toggles[0].dispatchEvent(new Event('change'));
assert(first.getElementById('priceLeft').value==='100'&&first.getElementById('referenceLeft').value==='200','Restaurar endpoint');
assert(second.getElementById('priceRight').value==='799990','Orden e independencia de precios');
toggles[0].checked=true;toggles[0].dispatchEvent(new Event('change'));
assert(first.getElementById('priceLeft').value==='619990'&&!first.getElementById('download').disabled,'Volver a planilla y descargar');
assert(!toggles[2].checked&&toggles[2].disabled,'Precios ausentes usan endpoint');
const input=first.getElementById('nameLeft');input.value='Nombre editado';input.dispatchEvent(new Event('input',{bubbles:true}));
tabs[2].click();tabs[0].click();assert(input.value==='Nombre editado','Conservar edición');
assert(second.getElementById('nameLeft').value!=='Nombre editado','Aislar grupos');
const cutout=first.getElementById('removeWhiteLeft');cutout.checked=false;cutout.dispatchEvent(new Event('change'));await wait(()=>!first.getElementById('imageLeft').disabled);
assert(second.getElementById('removeWhiteLeft').checked,'Recorte independiente entre banners');
cutout.checked=true;cutout.dispatchEvent(new Event('change'));await wait(()=>!first.getElementById('imageLeft').disabled);
const custom=first.getElementById('customImageLeft'),image=first.getElementById('imageLeft');custom.value=location.origin+'/custom.svg';image.value='11';image.dispatchEvent(new Event('change'));await wait(()=>!image.disabled);
assert(image.value==='11'&&cutout.disabled,'Imagen personalizada sin controles de recorte');
const pixels=first.getElementById('canvas').getContext('2d').getImageData(0,0,1920,525).data;let whites=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]===255&&pixels[i+1]===255&&pixels[i+2]===255&&pixels[i+3]===255)whites++;
assert(whites>100,'Conservar blancos de la imagen personalizada');
$('exportFormat').value='webp';$('exportFormat').dispatchEvent(new Event('change'));
assert(first.getElementById('exportFormat').value==='webp','Formato compartido');
const sent=[];
for(const frame of [frames[0],frames[1]]){
frame.contentWindow.HTMLAnchorElement.prototype.click=function(){sent.push(this.download)};
}
document.querySelector('.batch-downloads button').click();
await wait(()=>!document.querySelector('.batch-downloads button').disabled);
assert(sent.length===1&&sent[0].startsWith('banner-')&&sent[0].endsWith('.webp'),'Descarga masiva del grupo activo');
sent.length=0;
await frames[1].contentWindow.bannerGenerator.downloadAll();
assert(sent.length===2&&sent.every(name=>name.startsWith('banner-mobile-')&&name.endsWith('.webp')),'Descargar todas las piezas Mobile del grupo');
const canvas=first.getElementById('canvas');const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp'));assert(blob?.type==='image/webp','Exportar WebP real');
$('generationMode').value='individual';$('generationMode').dispatchEvent(new Event('change'));
assert(!$('individualResults').hidden&&!$('left').disabled,'Modo individual');
const config=bannerGenerator.snapshot();Object.keys(config.formats).forEach(k=>config.formats[k]=true);
const result=await bannerGenerator.run({...config,ids:['1','2','3']});assert(result.ok,'Generación individual con siete formatos');
assert(document.querySelectorAll('#individualResults canvas').length===19,'Canvas de siete formatos');
assert($('titleLeft').value==='Familia Marca®','Marca registrada en modo Individual');
assert($('downloadAll')&&!$('downloadAll').disabled,'Descarga masiva disponible en modo Individual');
$('sheetCycle').value='43';$('sheetCycle').dispatchEvent(new Event('change'));assert($('sheetSummary').children.length===1,'Segundo ciclo');
document.body.setAttribute('data-test-result','PASS');
}catch(error){document.body.setAttribute('data-test-result','FAIL: '+error.message)}
})();
</script>'''


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def do_GET(self):
        request = urlsplit(self.path)
        params = parse_qs(request.query)
        mime = 'application/json'
        if request.path.startswith('/api/campaigns/'):
            names = ['Banner Principal Web Desk (1 producto)', 'Banner Principal Web Desk (2 productos)', 'Banner Principal Web Desk (3 productos)', 'Banner Principal Web Mobile', 'Banner Stories', 'Pantalla FHD', 'Banner Mini Totem', 'Horizontal 5760', 'Horizontal 3840']
            content = json.dumps({'meta': {'uuid': request.path.rsplit('/', 1)[-1], 'name': 'Campaña simulada'}, 'fields': {name: {'url': 'https://assets-v3.pcfactory.cl/uploads/fixture.svg'} for name in names}}).encode()
        elif request.path == '/api/products':
            ids = params.get('productsIds', [])
            content = json.dumps([{'id': int(i), 'nombre': 'Producto ' + i, 'familia': {'nombre': 'Familia'}, 'marca': {'nombre': 'Marca'}, 'precio': {'efectivo': 100, 'referencia': 200}, 'imagenes': {'0': {'250': 'https://assets.pcfactory.cl/public/foto/fixture.svg'}}} for i in ids if i != '999']).encode()
        elif request.path == '/api/sheets':
            def group(ids): return {'cell': 'E9', 'ids': ids, 'value': '-'.join(ids), 'error': '', 'sheetPrices': [{'efectivo': 619990, 'referencia': 1029990}, {'efectivo': 799990, 'referencia': 1189990}][:len(ids)] if len(ids) < 3 else None}
            content = json.dumps({'sheets': [{'name': 'W45', 'cycles': {'9': [group(['1']), group(['999']), group(['1', '2']), group(['1', '2', '3'])], '43': [group(['2'])]}}]}).encode()
        elif request.path == '/custom.svg':
            mime = 'image/svg+xml'
            content = b'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="white"/></svg>'
        elif request.path in ('/fixture.svg', '/api/image'):
            mime = 'image/svg+xml'
            content = b'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#005544"/><circle cx="64" cy="64" r="32" fill="#aabbcc"/></svg>'
        elif request.path in ('/mvp.html', '/test.html'):
            mime = 'text/html; charset=utf-8'
            content = (ROOT / 'mvp.html').read_text(encoding='utf-8')
            content = re.sub(r'<link[^>]+https://fonts[^>]+>', '', content)
            if request.path == '/test.html': content = content.replace('</body>', TEST + '</body>')
            content = content.encode()
        elif request.path == '/mvp-local-generator.js':
            mime = 'text/javascript; charset=utf-8'
            content = (ROOT / 'mvp-local-generator.js').read_text(encoding='utf-8')
            start = content.index('async function loadFonts()')
            end = content.index('\n', start)
            content = (content[:start] + 'async function loadFonts(){}' + content[end:]).encode()
        else:
            return super().do_GET()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        try:
            self.wfile.write(content)
        except (ConnectionAbortedError, BrokenPipeError):
            pass


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8876), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
        browser = subprocess.Popen([edge, '--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--disable-extensions', '--user-data-dir=' + str(ROOT / '.browser-test-profile-2'), '--remote-debugging-port=9223', 'http://127.0.0.1:8876/test.html'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        driver = r'''
        (async()=>{
        let page;for(let i=0;i<100;i++){try{page=(await(await fetch('http://127.0.0.1:9223/json')).json()).find(p=>p.url.includes('/test.html'));if(page)break}catch{}await new Promise(r=>setTimeout(r,100))}
        if(!page)throw Error('No se pudo iniciar Edge');
        const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const callbacks=new Map();
        ws.addEventListener('message',e=>{const data=JSON.parse(e.data);if(data.id){callbacks.get(data.id)?.(data);callbacks.delete(data.id)}});
        const call=(method,params={})=>new Promise(resolve=>{callbacks.set(++id,resolve);ws.send(JSON.stringify({id,method,params}))});
        let result;for(let i=0;i<350;i++){const response=await call('Runtime.evaluate',{expression:'document.body.getAttribute("data-test-result")'});result=response.result?.result?.value;if(result)break;await new Promise(r=>setTimeout(r,100))}
        console.log(result||'Sin resultado del navegador');ws.send(JSON.stringify({id:++id,method:'Browser.close'}));setTimeout(()=>process.exit(result==='PASS'?0:1),100);
        })().catch(e=>{console.log(e.message);process.exit(1)});
        '''
        try:
            result = subprocess.run(['node', '-e', driver], capture_output=True, timeout=48)
            print(result.stdout.decode('utf-8', errors='replace').strip())
            raise SystemExit(result.returncode)
        finally:
            if browser.poll() is None:
                browser.terminate()
    finally:
        server.shutdown()
