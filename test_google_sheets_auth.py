import unittest
from unittest.mock import Mock, patch
import google_sheets_auth as auth
from planilla_banners import parse_week_rows


class GoogleRowsTests(unittest.TestCase):
    def response(self, status=200):
        response = Mock(status_code=status, ok=status == 200)
        values = []
        for row in auth.ROWS:
            cells = {'3': ['Destacado'], '9': ['57024-49917'],
                     '17': ['1.000 / 2.000'], '18': ['900 / 1.800'],
                     '29': ['Productos de prueba']}.get(row, [])
            values.append({'values': [['', '', '', ''] + cells] if cells else []})
        response.json.return_value = {'valueRanges': values}
        return response

    def read(self, response):
        session = Mock()
        session.get.return_value = response
        factory = Mock()
        factory.return_value.__enter__ = Mock(return_value=session)
        factory.return_value.__exit__ = Mock(return_value=False)
        with patch.object(auth, 'libraries', return_value=(None, None, factory, None)):
            result = auth.read_rows('example', 'W45', Mock())
        return result, session

    def test_authenticated_rows_keep_columns_prices_and_campaign(self):
        values, session = self.read(self.response())
        group = parse_week_rows('W45', values)['cycles']['9'][0]
        self.assertEqual(group['cell'], 'E9')
        self.assertEqual(group['ids'], ['57024', '49917'])
        self.assertEqual(group['campaignConcept'], 'Destacado')
        self.assertEqual(group['name'], 'Productos de prueba')
        self.assertEqual(group['sheetPrices'][1], {'efectivo': 1800, 'referencia': 2000})
        params = session.get.call_args.kwargs['params']
        self.assertEqual(len([p for p in params if p[0] == 'ranges']), 10)

    def test_access_denied(self):
        with self.assertRaisesRegex(ValueError, 'denegó'):
            self.read(self.response(403))

    def test_missing_ranges(self):
        response = self.response()
        response.json.return_value = {'valueRanges': []}
        with self.assertRaisesRegex(ValueError, 'todas las filas'):
            self.read(response)


if __name__ == '__main__':
    unittest.main()
