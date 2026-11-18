"""OAuth de escritorio; secretos y tokens siempre fuera del servidor web."""
import csv
import io
import json
import os
from pathlib import Path
import threading

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
ROWS = ('3', '9', '17', '18', '29', '37', '43', '51', '52', '63')
LOCK = threading.Lock()


class GoogleConnectionError(Exception):
    """Connection failure with a message safe to display in the local UI."""


def token_path():
    return Path(os.environ.get('LOCALAPPDATA', Path.home() / '.local' / 'share')) / 'PCFactoryBanners' / 'google-token.json'


def client_path():
    configured = os.environ.get('BANNERS_GOOGLE_CLIENT')
    if configured:
        return Path(configured)
    saved = token_path().parent / 'credentials.json'
    if saved.is_file():
        return saved
    candidates = list((Path.home() / 'Desktop').glob('client_secret_*.apps.googleusercontent.com.json'))
    if len(candidates) == 1:
        return candidates[0]
    raise GoogleConnectionError('No se encontró el JSON OAuth. Guarda credentials.json en %LOCALAPPDATA%\\PCFactoryBanners o revisa BANNERS_GOOGLE_CLIENT.')


def libraries():
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request, AuthorizedSession
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as error:
        raise GoogleConnectionError('Faltan las dependencias de Google. Ejecuta pip install -r requirements.txt con el mismo Python que inicia el generador.') from error
    return Credentials, Request, AuthorizedSession, InstalledAppFlow


def save(credentials):
    path = token_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(credentials.to_json(), encoding='utf-8')
    temporary.replace(path)


def credentials():
    Credentials, Request, _, _ = libraries()
    with LOCK:
        if not token_path().is_file():
            return None
        creds = Credentials.from_authorized_user_file(str(token_path()), SCOPES)
        if not creds.valid:
            if not creds.refresh_token:
                raise ValueError('Vuelve a conectar con Google.')
            creds.refresh(Request())
            save(creds)
        return creds


def connect():
    _, _, _, InstalledAppFlow = libraries()
    path = client_path()
    try:
        config = json.loads(path.read_text(encoding='utf-8-sig'))
        if not isinstance(config, dict) or not isinstance(config.get('installed'), dict):
            raise ValueError('Missing desktop client')
        flow = InstalledAppFlow.from_client_config(config, SCOPES)
    except OSError as error:
        raise GoogleConnectionError('No se pudo abrir el JSON OAuth. Revisa la ruta y los permisos de lectura.') from error
    except (ValueError, TypeError, KeyError) as error:
        raise GoogleConnectionError('El JSON OAuth es inválido. Usa el archivo de un cliente de aplicación de escritorio.') from error
    try:
        creds = flow.run_local_server(host='127.0.0.1', port=0, timeout_seconds=180,
                                      access_type='offline', prompt='consent')
    except Exception as error:
        # Some consent errors are displayed by Google without redirecting to localhost.
        raise GoogleConnectionError('La autorización de Google no se completó. Revisa el mensaje que muestra Google en el navegador y termina el inicio de sesión en ese equipo.') from error
    try:
        with LOCK:
            save(creds)
    except OSError as error:
        raise GoogleConnectionError('Google autorizó el acceso, pero no se pudo guardar la sesión. Revisa los permisos de %LOCALAPPDATA%\\PCFactoryBanners.') from error


def disconnect():
    with LOCK:
        token_path().unlink(missing_ok=True)


def read_rows(spreadsheet, week, creds):
    _, _, AuthorizedSession, _ = libraries()
    with AuthorizedSession(creds) as session:
        response = session.get(
            'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheet + '/values:batchGet',
            params=[('ranges', "'" + week + "'!" + row + ':' + row) for row in ROWS]
                   + [('valueRenderOption', 'FORMATTED_VALUE')], timeout=120)
        if response.status_code == 403:
            raise ValueError('Google denegó el acceso. Comparte la planilla con la cuenta conectada y verifica que Google Sheets API esté habilitada.')
        if response.status_code == 404:
            raise ValueError('La planilla no existe o la cuenta conectada no tiene acceso.')
        if not response.ok:
            raise ValueError('Google Sheets API devolvió HTTP ' + str(response.status_code) + '. Revisa la semana y la autorización.')
        ranges = response.json().get('valueRanges', [])
    if len(ranges) != len(ROWS):
        raise ValueError('Google no devolvió todas las filas solicitadas.')
    result = {}
    for row, item in zip(ROWS, ranges):
        output = io.StringIO()
        csv.writer(output).writerow((item.get('values') or [[]])[0])
        result[row] = output.getvalue().encode('utf-8')
    return result
