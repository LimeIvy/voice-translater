import socket
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.tts_main import app


class TTSAppTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_does_not_require_model(self):
        self.assertEqual(self.client.get('/api/v1/health').status_code, 200)

    def test_readiness_requires_configuration(self):
        with patch.dict('os.environ', {'TTS_HOST': '', 'TTS_PORT': ''}):
            self.assertEqual(self.client.get('/api/v1/ready').status_code, 503)

    def test_readiness_detects_unavailable_backend(self):
        with patch.dict('os.environ', {'TTS_HOST': 'tts', 'TTS_PORT': '8765'}):
            with patch('app.tts_main.socket.create_connection', side_effect=socket.timeout):
                self.assertEqual(self.client.get('/api/v1/ready').status_code, 503)

    def test_readiness_rejects_invalid_port(self):
        for port in ('invalid', '0', '65536'):
            with patch.dict('os.environ', {'TTS_HOST': 'tts', 'TTS_PORT': port}):
                self.assertEqual(self.client.get('/api/v1/ready').status_code, 503)

    def test_readiness_accepts_listening_backend(self):
        with patch.dict('os.environ', {'TTS_HOST': 'tts', 'TTS_PORT': '8765'}):
            with patch('app.tts_main.socket.create_connection') as connect:
                self.assertEqual(self.client.get('/api/v1/ready').status_code, 200)
                connect.assert_called_once_with(('tts', 8765), timeout=2)
                connect.return_value.__enter__.return_value.sendall.assert_called_once_with(bytes(4))

    def test_readiness_detects_probe_send_failure(self):
        with patch.dict('os.environ', {'TTS_HOST': 'tts', 'TTS_PORT': '8765'}):
            with patch('app.tts_main.socket.create_connection') as connect:
                connect.return_value.__enter__.return_value.sendall.side_effect = BrokenPipeError
                self.assertEqual(self.client.get('/api/v1/ready').status_code, 503)
                connect.return_value.__exit__.assert_called_once()

    def test_tauri_preflight(self):
        for origin in ('tauri://localhost', 'http://tauri.localhost', 'http://localhost:5173'):
            response = self.client.options('/api/v1/tts', headers={
                'Origin': origin, 'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
            })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers['access-control-allow-origin'], origin)

    def test_existing_tts_contract(self):
        with patch('app.api.tts.synthesize', return_value=b'RIFFtest'):
            response = self.client.post('/api/v1/tts', json={'text': 'hello'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers['content-type'], 'audio/wav')
        self.assertEqual(self.client.post('/api/v1/tts', json={'text': ' '}).status_code, 422)

    def test_untrusted_origin_is_not_allowed(self):
        response = self.client.options('/api/v1/tts', headers={
            'Origin': 'http://untrusted.example',
            'Access-Control-Request-Method': 'POST',
        })
        self.assertEqual(response.status_code, 400)
        self.assertNotIn('access-control-allow-origin', response.headers)

    def test_legacy_routes_are_not_exposed(self):
        self.assertEqual(self.client.post('/api/v1/translation', json={}).status_code, 404)


if __name__ == '__main__':
    unittest.main()
