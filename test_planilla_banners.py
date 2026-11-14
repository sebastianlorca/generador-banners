import importlib.util
from io import BytesIO
import json
from unittest import TestCase, main
from unittest.mock import patch
from zipfile import ZipFile
from planilla_banners import parse_workbook, parse_prices, parse_week_rows


def workbook(shared_ids='123 / 456 / 789'):
    data = BytesIO()
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    with ZipFile(data, 'w') as z:
        z.writestr('xl/workbook.xml', f'<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="W45" r:id="a"/><sheet name="Notas" r:id="b"/><sheet name="W53" r:id="b"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="a" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/sharedStrings.xml', f'<sst xmlns="{ns}"><si><t>{shared_ids}</t></si></sst>')
        z.writestr('xl/worksheets/sheet1.xml', f'<worksheet xmlns="{ns}"><sheetData><row r="9"><c r="D9"><v>999</v></c><c r="E9"><v>57629.0</v></c><c r="G9" t="inlineStr"><is><t>123 - 456</t></is></c><c r="AA9" t="s"><v>0</v></c></row><row r="43"><c r="E43" t="inlineStr"><is><t>1/2/3/4</t></is></c><c r="F43" t="inlineStr"><is><t>1--2</t></is></c></row></sheetData></worksheet>')
    return data.getvalue()


class SheetsTests(TestCase):
    def test_names_match_column_and_cycle(self):
        data = BytesIO()
        with ZipFile(BytesIO(workbook())) as old, ZipFile(data, 'w') as new:
            for name in old.namelist():
                content = old.read(name)
                if name.endswith('sheet1.xml'):
                    extra = '<row r="29"><c r="E29" t="inlineStr"><is><t>Principal-IMB2-Notebooks-SKU:56691-56693</t></is></c><c r="AA29" t="inlineStr"><is><t>Otro banner</t></is></c></row><row r="63"><c r="E63" t="inlineStr"><is><t>Fin de semana</t></is></c></row>'
                    content = content.replace(b'</sheetData>', (extra + '</sheetData>').encode())
                new.writestr(name, content)
        cycles = parse_workbook(data.getvalue())[0]['cycles']
        self.assertEqual(cycles['9'][0]['name'], 'Principal-IMB2-Notebooks-SKU:56691-56693')
        self.assertEqual(cycles['9'][0]['nameCell'], 'E29')
        self.assertEqual(cycles['9'][1]['name'], '')
        self.assertEqual(cycles['9'][2]['name'], 'Otro banner')
        self.assertEqual(cycles['43'][0]['name'], 'Fin de semana')
        self.assertEqual(cycles['43'][0]['nameCell'], 'E63')

    def test_campaign_concepts_match_columns_and_cycles(self):
        data = BytesIO()
        with ZipFile(BytesIO(workbook())) as old, ZipFile(data, 'w') as new:
            for name in old.namelist():
                content = old.read(name)
                if name.endswith('sheet1.xml'):
                    extra = '<row r="3"><c r="E3" t="inlineStr"><is><t>Toma tu Like</t></is></c><c r="AA3" t="inlineStr"><is><t>Destacado</t></is></c></row><row r="37"><c r="E37" t="inlineStr"><is><t>Fin de semana</t></is></c></row>'
                    content = content.replace(b'</sheetData>', (extra + '</sheetData>').encode())
                new.writestr(name, content)
        cycles = parse_workbook(data.getvalue())[0]['cycles']
        self.assertEqual([(g['campaignCell'], g['campaignConcept']) for g in cycles['9']], [('E3', 'Toma tu Like'), ('G3', ''), ('AA3', 'Destacado')])
        self.assertEqual(cycles['43'][0]['campaignConcept'], 'Fin de semana')
        self.assertEqual(cycles['43'][0]['campaignCell'], 'E37')

    def test_commas_and_mixed_separators(self):
        for value, expected in [('123,456', ['123']), ('123, 456,789', ['123']), ('123 / 456,789', ['123', '456']), ('12345 - 23456, 23457', ['12345', '23456']), ('123,,456', ['123']), ('1/2/3/4', [])]:
            with self.subTest(value=value):
                group = parse_workbook(workbook(value))[0]['cycles']['9'][-1]
                self.assertEqual(group['ids'], expected)
                self.assertEqual(bool(group['error']), not bool(expected))

    def test_prices_and_column_mapping(self):
        source = workbook()
        data = BytesIO()
        with ZipFile(BytesIO(source)) as old, ZipFile(data, 'w') as new:
            for name in old.namelist():
                content = old.read(name)
                if name.endswith('sheet1.xml'):
                    extra = '<row r="17"><c r="G17" t="inlineStr"><is><t>1.029.990 / 1.189.990</t></is></c></row><row r="18"><c r="G18" t="inlineStr"><is><t>$619.990 - $799.990</t></is></c></row><row r="51"><c r="G51"><v>1200</v></c></row><row r="52"><c r="G52"><v>900.0</v></c></row>'
                    content = content.replace(b'</sheetData>', (extra + '<row r="43"><c r="G43"><v>123</v></c></row></sheetData>').encode())
                new.writestr(name, content)
        cycles = parse_workbook(data.getvalue())[0]['cycles']
        self.assertEqual(cycles['9'][1]['sheetPrices'], [{'efectivo': 619990, 'referencia': 1029990}, {'efectivo': 799990, 'referencia': 1189990}])
        self.assertEqual(cycles['43'][-1]['sheetPrices'], [{'efectivo': 900, 'referencia': 1200}])
        self.assertIsNone(cycles['9'][0]['sheetPrices'])
        self.assertIn('E17/E18', cycles['9'][0]['priceError'])
        for value, count in [('', 1), ('1/2', 1), ('-100', 1), ('1,2', 2), ('abc', 1)]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_prices(value, count)

    def test_week_filter_cycles_order_gaps_and_separators(self):
        sheets = parse_workbook(workbook())
        self.assertEqual([s['name'] for s in sheets], ['W45'])
        rows = sheets[0]['cycles']
        self.assertEqual([g['cell'] for g in rows['9']], ['E9', 'G9', 'AA9'])
        self.assertEqual([g['ids'] for g in rows['9']], [['57629'], ['123', '456'], ['123', '456', '789']])
        self.assertTrue(all(g['error'] for g in rows['43']))

    def test_non_spreadsheet_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Google no entregó'):
            parse_workbook(b'<html>Sign in</html>')

    def test_week_csv_preserves_columns_and_prices(self):
        import csv
        from io import StringIO
        def row(cells):
            out = StringIO()
            writer = csv.writer(out)
            writer.writerow([''] * len(cells))
            writer.writerow(cells)
            return out.getvalue().encode('utf-8-sig')
        values = {
            '3': row([''] * 4 + ['Campana']),
            '9': row([''] * 4 + ['123.0', '', '456 - 789, 999'] + [''] * 19 + ['321']),
            '17': row([''] * 4 + ['1.000']),
            '18': row([''] * 4 + ['$900']),
            '29': row([''] * 4 + ['Banner, con coma\ny salto']),
            '43': row([''] * 4 + ['555']),
            '37': row([''] * 4 + ['Otra']),
        }
        sheet = parse_week_rows('W45', values)
        groups = sheet['cycles']['9']
        self.assertEqual([g['cell'] for g in groups], ['E9', 'G9', 'AA9'])
        self.assertEqual(groups[0]['ids'], ['123'])
        self.assertEqual(groups[1]['ids'], ['456', '789'])
        self.assertEqual(groups[0]['sheetPrices'], [{'efectivo': 900, 'referencia': 1000}])
        self.assertEqual(groups[0]['name'], 'Banner, con coma\ny salto')
        self.assertEqual(sheet['cycles']['43'][0]['campaignConcept'], 'Otra')
        single = parse_week_rows('W45', {'9': b'"","","","","123","","456 / 789"'})
        self.assertEqual([g['ids'] for g in single['cycles']['9']], [['123'], ['456', '789']])
        with self.assertRaises(ValueError):
            parse_week_rows('W45', {'9': b'<html>Login</html>'})

    def test_local_route_download_and_access_error(self):
        spec = importlib.util.spec_from_file_location('server', 'servidor-mvp.py')
        server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(server)
        class Response(BytesIO):
            pass
        class Output:
            wfile = BytesIO()
            def send_response(self, code): self.code = code
            def send_header(self, *args): pass
            def end_headers(self): pass
        output = Output()
        with patch.object(server, 'urlopen', side_effect=lambda *args, **kwargs: Response(b'"","","","",""\n"","","","","123"\n')) as request:
            server.Handler.sheets(output, {'id': ['a' * 25], 'week': ['W45']})
            self.assertEqual(output.code, 200)
            self.assertEqual(json.loads(output.wfile.getvalue())['sheets'][0]['name'], 'W45')
            self.assertEqual(request.call_count, 10)
            self.assertTrue(all('/gviz/tq?' in call.args[0].full_url and 'sheet=W45' in call.args[0].full_url for call in request.call_args_list))
        output.wfile = BytesIO()
        with patch.object(server, 'urlopen') as request:
            server.Handler.sheets(output, {'id': ['a' * 25], 'week': ['W53']})
            request.assert_not_called()
            self.assertEqual(output.code, 502)
        output.wfile = BytesIO()
        with patch.object(server, 'urlopen') as request:
            server.Handler.sheets(output, {'id': ['https://example.com']})
            request.assert_not_called()
            self.assertEqual(output.code, 502)
        output.wfile = BytesIO()
        with patch.object(server, 'urlopen', side_effect=server.HTTPError('url', 403, 'Forbidden', {}, None)):
            server.Handler.sheets(output, {'id': ['a' * 25], 'week': ['W45']})
            self.assertIn('HTTP 403', json.loads(output.wfile.getvalue())['error'])


if __name__ == '__main__':
    main()
