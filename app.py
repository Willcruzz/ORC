from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Configuração da API do Claude
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_API_KEY = ""

@app.route('/processar', methods=['POST'])
def processar_com_claude():
    data = request.json
    texto_entrada = data.get('texto')

    headers = {
        'Authorization': f'Bearer {CLAUDE_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        "input": texto_entrada
    }

    try:
        response = requests.post(CLAUDE_API_URL, headers=headers, json=payload)
        response_data = response.json()
        return jsonify({"resultado": response_data.get('output', 'Sem resposta')})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
