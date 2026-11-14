"""Servidor local del MVP: python servidor-mvp.py"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import re
import os
import ssl
import subprocess
import tempfile
from contextlib import contextmanager
from http.client import parse_headers
from io import BytesIO
from types import SimpleNamespace
from planilla_banners import parse_week_rows
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parent
CATALOG = 'https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/banners'

CAMPAIGNS = {
    '40dd98db-cdc8-4d40-9950-a195bdbde8a5',
    'ddd3ff5d-88dd-4ca7-86f6-959313238eea',
    '0b5d9f6d-4a44-4a52-83c7-d8634799ca0d',
    'f1bbd79b-c557-4f2f-80bd-8d101480f810',
    'a1a77a6a-dc62-4fd9-983f-f1f8562d7a2f',
}

@contextmanager
def open_upstream(target, timeout=20):
    request = Request(target, headers={'User-Agent': 'PCFactory-Banner-MVP/1.0'})
    try:
        response = urlopen(request, timeout=timeout)
    except URLError as error:
        if os.name != 'nt' or not isinstance(error.reason, ssl.SSLCertVerificationError):
            raise
        # Schannel can retrieve intermediate certificates using Windows trust.
        # Keep certificate and hostname verification enabled.
        curl = Path(os.environ['SystemRoot']) / 'System32' / 'curl.exe'
        with tempfile.TemporaryDirectory(prefix='banner-https-') as directory:
            body = Path(directory) / 'body'
            headers = Path(directory) / 'headers'
            result = subprocess.run([
                str(curl), '--silent', '--show-error', '--fail', '--location',
                '--proto', '=https', '--proto-redir', '=https',
                '--max-time', str(timeout), '--max-filesize', str(40 * 1024 * 1024),
                '--user-agent', 'PCFactory-Banner-MVP/1.0',
                '--dump-header', str(headers), '--output', str(body), target,
            ], capture_output=True, timeout=timeout + 5, creationflags=subprocess.CREATE_NO_WINDOW)
            if result.returncode:
                raise URLError('HTTPS de Windows: ' + result.stderr.decode('utf-8', errors='replace').strip()) from error
            final_headers = headers.read_bytes().strip().split(b'\r\n\r\n')[-1]
            parsed_headers = parse_headers(BytesIO(final_headers.split(b'\r\n', 1)[1] + b'\r\n\r\n'))
            with body.open('rb') as content:
                yield SimpleNamespace(read=content.read, headers=parsed_headers)
        return
    with response:
        yield response

class Handler(SimpleHTTPRequestHandler):
    def sheets(self, params):
        spreadsheet = params.get('id', [''])[0]
        week = params.get('week', [''])[0]
        code = 200
        try:
            if not re.fullmatch(r'[A-Za-z0-9_-]{20,100}', spreadsheet):
                raise ValueError('ID de Google Sheets no válido.')
            if not re.fullmatch(r'W(?:0[1-9]|[1-4][0-9]|5[0-2])', week):
                raise ValueError('Selecciona una hoja entre W01 y W52. Si el servidor es antiguo, reinícialo y recarga con Ctrl+F5.')
            def read_row(number):
                query = urlencode({'sheet': week, 'headers': 0, 'tqx': 'out:csv', 'range': number + ':' + number})
                target = 'https://docs.google.com/spreadsheets/d/' + spreadsheet + '/gviz/tq?' + query
                with open_upstream(target, timeout=120) as upstream:
                    content = upstream.read(4 * 1024 * 1024 + 1)
                if len(content) > 4 * 1024 * 1024:
                    raise ValueError('Una fila de la semana supera 4 MiB.')
                return number, content
            # Isolate rows to preserve numeric IDs in columns containing mostly text.
            with ThreadPoolExecutor(max_workers=10) as pool:
                values = dict(pool.map(read_row, ('3', '9', '17', '18', '29', '37', '43', '51', '52', '63')))
            payload = {'sheets': [parse_week_rows(week, values)]}
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
            with open_upstream(target, timeout=20) as upstream:
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
        except (HTTPError, URLError, TimeoutError, ValueError, OSError, subprocess.SubprocessError) as error:
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
