from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import requests

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Configuração da API do Claude
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_API_KEY = ""

@app.route('/processar', methods=['POST'])
@cross_origin(origins='*')
def processar_com_claude():
    data = request.json
    texto_entrada = data.get('texto')

    headers = {
        'x-api-key': f'{CLAUDE_API_KEY}',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
    }
    payload = {
        "input": texto_entrada
    }

    try:
        response = requests.post(CLAUDE_API_URL, headers=headers, json=payload)
        response_data = response.json()

        if response_data.get('type') == 'error':
            return jsonify({"resultado": response_data.get('error').get('message')})

        return jsonify({"resultado": response_data.get('output', 'Sem resposta')})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
