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
    raise ValueError('Configura BANNERS_GOOGLE_CLIENT con la ruta del JSON OAuth de escritorio, fuera del proyecto.')


def libraries():
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request, AuthorizedSession
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as error:
        raise ValueError('Instala las dependencias: python -m pip install -r requirements.txt') from error
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
    if 'installed' not in json.loads(path.read_text(encoding='utf-8')):
        raise ValueError('El JSON debe ser de un cliente OAuth de aplicación de escritorio.')
    flow = InstalledAppFlow.from_client_secrets_file(str(path), SCOPES)
    creds = flow.run_local_server(host='127.0.0.1', port=0, timeout_seconds=180,
                                  access_type='offline', prompt='consent')
    with LOCK:
        save(creds)


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
