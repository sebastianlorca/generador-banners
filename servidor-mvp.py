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
import google_sheets_auth

ROOT = Path(__file__).resolve().parent
CATALOG = 'https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/banners'

CAMPAIGN_BASE = 'https://ww3.pcfactory.cl/api/content/spaces/banners-principales/types/campana/entries'

def read_campaigns():
    entries = []
    seen = set()
    page = 1
    while True:
        with open_upstream(CAMPAIGN_BASE + '?' + urlencode({'locale': 'es', 'per_page': 100, 'page': page})) as upstream:
            content = upstream.read(12 * 1024 * 1024 + 1)
        if len(content) > 12 * 1024 * 1024:
            raise ValueError('Listado de campañas demasiado grande')
        payload = json.loads(content)
        batch = payload.get('entries')
        if not isinstance(batch, list):
            raise ValueError('Modyo no devolvió un listado de campañas válido')
        for entry in batch:
            uuid = entry.get('meta', {}).get('uuid')
            if not isinstance(uuid, str) or not re.fullmatch(r'[0-9a-fA-F-]{36}', uuid):
                raise ValueError('Campaña sin UUID válido')
            if uuid not in seen:
                seen.add(uuid)
                entries.append(entry)
        total_pages = payload.get('meta', {}).get('total_pages')
        if total_pages is not None:
            if page >= int(total_pages):
                break
        elif len(batch) < 100:
            break
        if not batch or page >= 100:
            raise ValueError('No se pudo completar la paginación de campañas')
        page += 1
    return {'entries': entries}

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
    def end_headers(self):
        if not self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

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
            creds = google_sheets_auth.credentials() if google_sheets_auth.token_path().is_file() else None
            if creds:
                values = google_sheets_auth.read_rows(spreadsheet, week, creds)
            else:
                with ThreadPoolExecutor(max_workers=10) as pool:
                    values = dict(pool.map(read_row, ('3', '9', '17', '18', '29', '37', '43', '51', '52', '63')))
            payload = {'sheets': [parse_week_rows(week, values)]}
        except HTTPError as error:
            code = 502
            payload = {'error': 'Google rechazó la lectura (HTTP ' + str(error.code) + '). Para una planilla privada pulsa Conectar con Google y usa una cuenta con acceso.'}
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

    def auth_json(self, payload, code=200):
        content = json.dumps(payload).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        # Only the local UI may initiate account changes (no cross-origin POSTs).
        if self.headers.get('Origin') != 'http://127.0.0.1:8765' or self.headers.get('X-Banners-Action') != 'google-auth':
            return self.auth_json({'error': 'Origen no permitido.'}, 403)
        try:
            if self.path == '/api/google/connect':
                google_sheets_auth.connect()
            elif self.path == '/api/google/disconnect':
                google_sheets_auth.disconnect()
            else:
                return self.auth_json({'error': 'Ruta no disponible.'}, 404)
            return self.auth_json({'connected': google_sheets_auth.token_path().is_file()})
        except google_sheets_auth.GoogleConnectionError as error:
            return self.auth_json({'error': str(error)}, 400)
        except Exception:
            return self.auth_json({'error': 'No se pudo conectar con Google. Revisa las dependencias, el JSON OAuth y completa la autorización en el navegador. Puedes volver a intentarlo.'}, 400)

    def do_GET(self):
        request = urlsplit(self.path)
        params = parse_qs(request.query)
        if request.path == '/api/google/status':
            return self.auth_json({'connected': google_sheets_auth.token_path().is_file()})
        if request.path == '/api/sheets':
            return self.sheets(params)
        is_campaign_list = request.path == '/api/campaigns'
        is_campaign = is_campaign_list or request.path.startswith('/api/campaigns/')
        if request.path not in ('/api/products', '/api/image') and not is_campaign:
            return super().do_GET()
        if is_campaign:
            uuid = request.path.rsplit('/', 1)[-1]
            if not is_campaign_list and not re.fullmatch(r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}', uuid):
                return self.send_error(404, 'Campana no disponible')
            target = CAMPAIGN_BASE + '/' + uuid + '?locale=es'
        elif request.path == '/api/products':
            ids = params.get('productsIds', [])
            if not 1 <= len(ids) <= 3 or any(not value.isascii() or not value.isdigit() for value in ids):
                return self.send_error(400, 'Se requieren entre uno y tres IDs numericos')
            target = CATALOG + '?' + urlencode({'productsIds': ids}, doseq=True)
        else:
            target = params.get('url', [''])[0]
            parsed = urlsplit(target)
            allowed = (
                (parsed.netloc == 'assets.pcfactory.cl' and (
                    parsed.path.startswith('/public/foto/')
                    or re.fullmatch(r'/public/foto_original/[0-9]+/google_1000\.jpg', parsed.path)
                ))
                or (parsed.netloc == 'assets-v3.pcfactory.cl' and parsed.path.startswith('/uploads/'))
            )
            if parsed.scheme != 'https' or not allowed:
                return self.send_error(400, 'URL de foto no permitida')
        try:
            if is_campaign_list:
                content = json.dumps(read_campaigns(), ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(content)
                return
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
