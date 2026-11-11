"""Servidor local del MVP: python servidor-mvp.py"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import re
from planilla_banners import parse_workbook

ROOT = Path(__file__).resolve().parent
CATALOG = 'https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/banners'

CAMPAIGNS = {'f1bbd79b-c557-4f2f-80bd-8d101480f810', 'a1a77a6a-dc62-4fd9-983f-f1f8562d7a2f'}

class Handler(SimpleHTTPRequestHandler):
    def sheets(self, params):
        spreadsheet = params.get('id', [''])[0]
        code = 200
        try:
            if not re.fullmatch(r'[A-Za-z0-9_-]{20,100}', spreadsheet):
                raise ValueError('ID de Google Sheets no válido.')
            target = 'https://docs.google.com/spreadsheets/d/' + spreadsheet + '/export?format=xlsx'
            with urlopen(Request(target, headers={'User-Agent': 'PCFactory-Banner-MVP/1.0'}), timeout=30) as upstream:
                content = upstream.read(40 * 1024 * 1024 + 1)
            if len(content) > 40 * 1024 * 1024:
                raise ValueError('La planilla supera 40 MiB.')
            sheets = parse_workbook(content)
            if not sheets:
                raise ValueError('No hay hojas con nombres W01 a W52.')
            payload = {'sheets': sheets}
        except HTTPError as error:
            code = 502
            payload = {'error': 'Google rechazó la lectura (HTTP ' + str(error.code) + '). Comprueba que la planilla permita lectura sin iniciar sesión y descarga. Una planilla privada necesita una conexión autenticada aún no configurada.'}
        except Exception as error:
            code = 502
            payload = {'error': 'No se pudo cargar la planilla: ' + str(error)}
        content = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(content)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        request = urlsplit(self.path)
        params = parse_qs(request.query)
        if request.path == '/api/sheets':
            return self.sheets(params)
        is_campaign = request.path.startswith('/api/campaigns/')
        if request.path not in ('/api/products', '/api/image') and not is_campaign:
            return super().do_GET()
        if is_campaign:
            uuid = request.path.rsplit('/', 1)[-1]
            if uuid not in CAMPAIGNS:
                return self.send_error(404, 'Campana no disponible')
            target = 'https://ww3.pcfactory.cl/api/content/spaces/banners-principales/types/campana/entries/' + uuid + '?locale=es'
        elif request.path == '/api/products':
            ids = params.get('productsIds', [])
            if not 1 <= len(ids) <= 3 or any(not value.isascii() or not value.isdigit() for value in ids):
                return self.send_error(400, 'Se requieren entre uno y tres IDs numericos')
            target = CATALOG + '?' + urlencode({'productsIds': ids}, doseq=True)
        else:
            target = params.get('url', [''])[0]
            parsed = urlsplit(target)
            allowed = ((parsed.netloc == 'assets.pcfactory.cl' and parsed.path.startswith('/public/foto/')) or (parsed.netloc == 'assets-v3.pcfactory.cl' and parsed.path.startswith('/uploads/')))
            if parsed.scheme != 'https' or not allowed:
                return self.send_error(400, 'URL de foto no permitida')
        try:
            with urlopen(Request(target, headers={'User-Agent': 'PCFactory-Banner-MVP/1.0'}), timeout=20) as upstream:
                content = upstream.read(12 * 1024 * 1024 + 1)
                if len(content) > 12 * 1024 * 1024:
                    return self.send_error(502, 'Respuesta demasiado grande')
                content_type = upstream.headers.get('Content-Type', 'application/octet-stream')
                if request.path == '/api/products' or is_campaign:
                    json.loads(content)
                    content_type = 'application/json; charset=utf-8'
                elif not content_type.startswith('image/'):
                    return self.send_error(502, 'La foto no es una imagen')
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(content)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
            print('Error consultando catalogo/imagen:', error)
            content = json.dumps({'error': 'El servidor local no pudo consultar PC Factory: ' + str(error)}, ensure_ascii=False).encode('utf-8')
            self.send_response(502)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)

if __name__ == '__main__':
    import sys
    import webbrowser
    server = ThreadingHTTPServer(('127.0.0.1', 8765), Handler)
    if '--open' in sys.argv:
        webbrowser.open('http://127.0.0.1:8765/mvp.html')
    print('Abre http://127.0.0.1:8765/mvp.html — Ctrl+C para detener')
    server.serve_forever()
