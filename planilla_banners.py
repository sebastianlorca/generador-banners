"""Lee grupos de IDs de las hojas semanales de un XLSX."""
from io import BytesIO
from decimal import Decimal, InvalidOperation
import posixpath
import re
from zipfile import ZipFile, BadZipFile
from xml.etree import ElementTree as ET

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def parse_prices(value, count):
    parts = re.split(r'\s*[-/]\s*', value)
    normalized = [re.sub(r'[$.\s]', '', part) for part in parts]
    if len(parts) != count or not all(re.fullmatch(r'[0-9]+', part) and int(part) <= 9007199254740991 for part in normalized):
        raise ValueError('Se requiere un precio entero por producto, en el mismo orden, separado por guion o slash.')
    return [int(part) for part in normalized]


def parse_workbook(content):
    try:
        archive = ZipFile(BytesIO(content))
    except BadZipFile as error:
        raise ValueError('Google no entregó una planilla. Comprueba el enlace y el acceso de lectura sin iniciar sesión.') from error
    with archive:
        if sum(info.file_size for info in archive.infolist() if info.filename.endswith('.xml')) > 300 * 1024 * 1024:
            raise ValueError('Los datos XML de la planilla superan 300 MiB.')
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(t.text or '' for t in node.findall('.//s:t', NS)) for node in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        relations = {node.attrib['Id']: node.attrib['Target'] for node in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        result = []
        for sheet in ET.fromstring(archive.read('xl/workbook.xml')).findall('s:sheets/s:sheet', NS):
            name = sheet.attrib['name']
            if not re.fullmatch(r'W(?:0[1-9]|[1-4][0-9]|5[0-2])', name):
                continue
            target = relations[sheet.attrib[RID]]
            path = posixpath.normpath(target.lstrip('/') if target.startswith('/') else 'xl/' + target)
            rows = {'9': [], '43': []}
            prices = {}
            for row in ET.fromstring(archive.read(path)).findall('s:sheetData/s:row', NS):
                if row.attrib.get('r') not in ('3', '9', '17', '18', '29', '37', '43', '51', '52', '63'):
                    continue
                for cell in row.findall('s:c', NS):
                    ref = cell.attrib.get('r', '')
                    match = re.fullmatch(r'([A-Z]+)([0-9]+)', ref)
                    if not match:
                        continue
                    column = 0
                    for char in match[1]:
                        column = column * 26 + ord(char) - 64
                    if column < 5:
                        continue
                    value = cell.findtext('s:v', '', NS)
                    kind = cell.attrib.get('t')
                    if kind == 's':
                        value = strings[int(value)]
                    elif kind == 'inlineStr':
                        value = ''.join(node.text or '' for node in cell.findall('.//s:t', NS))
                    elif kind in (None, 'n') and value:
                        try:
                            number = Decimal(value)
                            if number.is_finite() and number >= 0 and number == number.to_integral_value() and number < 10 ** 30:
                                value = str(int(number))
                        except InvalidOperation:
                            pass
                    value = value.strip()
                    if not value:
                        continue
                    if row.attrib['r'] not in rows:
                        prices[ref] = value
                        continue
                    ids = [part.split(',')[0].strip() for part in re.split(r'\s*[-/]\s*', value)]
                    valid = 1 <= len(ids) <= 3 and all(re.fullmatch(r'[0-9]+', product) for product in ids)
                    rows[row.attrib['r']].append({'cell': ref, 'value': value, 'ids': ids if valid else [], 'error': '' if valid else 'Se requieren de 1 a 3 IDs numéricos separados por guion o slash; de las variantes con coma se usa solo la primera.', '_column': column})
            finish_groups(rows, prices)
            result.append({'name': name, 'cycles': rows})
        return sorted(result, key=lambda sheet: sheet['name'])


def finish_groups(rows, prices):
    for cycle, groups in rows.items():
        groups.sort(key=lambda group: group['_column'])
        for group in groups:
            del group['_column']
            column_name = re.match(r'[A-Z]+', group['cell'])[0]
            group['campaignCell'] = column_name + ('3' if cycle == '9' else '37')
            group['campaignConcept'] = prices.get(group['campaignCell'], '')
            group['nameCell'] = column_name + ('29' if cycle == '9' else '63')
            group['name'] = prices.get(group['nameCell'], '')
            reference_row, offer_row = ('17', '18') if cycle == '9' else ('51', '52')
            group['priceCells'] = {'reference': column_name + reference_row, 'offer': column_name + offer_row}
            group['sheetPrices'] = None
            group['priceError'] = ''
            if group['ids']:
                try:
                    reference = parse_prices(prices.get(group['priceCells']['reference'], ''), len(group['ids']))
                    offer = parse_prices(prices.get(group['priceCells']['offer'], ''), len(group['ids']))
                    group['sheetPrices'] = [{'efectivo': p, 'referencia': r} for p, r in zip(offer, reference)]
                except ValueError as error:
                    group['priceError'] = '/'.join(group['priceCells'].values()) + ': ' + str(error)


def parse_week_rows(name, values):
    """Parse isolated CSV rows; one row per query avoids mixed-column type loss."""
    import csv
    from io import StringIO
    rows = {'9': [], '43': []}
    prices = {}
    for number, content in values.items():
        text = content.decode('utf-8-sig')
        if text.lstrip().startswith(('<', '/*', '{')):
            raise ValueError('Google no entregó los datos de la semana. Comprueba que exista y permita lectura sin iniciar sesión.')
        records = list(csv.reader(StringIO(text)))
        # Google omits empty column labels in some CSV responses.
        if len(records) == 2 and not any(records[0]):
            records = records[1:]
        if len(records) > 1:
            raise ValueError('Google devolvió más filas de las solicitadas.')
        cells = records[0] if records else []
        for index, value in enumerate(cells, 1):
            value = value.strip()
            if index < 5 or not value:
                continue
            column, n = '', index
            while n:
                n, remainder = divmod(n - 1, 26)
                column = chr(65 + remainder) + column
            ref = column + number
            if number not in rows:
                prices[ref] = value
                continue
            # Single numeric IDs may be returned as an integral decimal.
            if re.fullmatch(r'[0-9]+\.0+', value):
                value = value.split('.')[0]
            ids = [part.split(',')[0].strip() for part in re.split(r'\s*[-/]\s*', value)]
            valid = 1 <= len(ids) <= 3 and all(re.fullmatch(r'[0-9]+', product) for product in ids)
            rows[number].append({'cell': ref, 'value': value, 'ids': ids if valid else [], 'error': '' if valid else 'Se requieren de 1 a 3 IDs numéricos separados por guion o slash; de las variantes con coma se usa solo la primera.', '_column': index})
    finish_groups(rows, prices)
    return {'name': name, 'cycles': rows}
