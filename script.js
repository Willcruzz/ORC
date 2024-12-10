document.getElementById('processButton').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const resultsArea = document.getElementById('results');
  resultsArea.value = ''; // Limpa os resultados anteriores

  if (!fileInput.files.length) {
    alert('Por favor, selecione pelo menos um arquivo.');
    return;
  }

  Array.from(fileInput.files).forEach((file) => {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      processPDF(file, resultsArea);
    } else if (fileType.startsWith('image/')) {
      processImage(file, resultsArea);
    } else {
      resultsArea.value += `Arquivo ${file.name} não é suportado.\n\n`;
    }
  });
});




function processPDF(file, resultsArea) {
  const reader = new FileReader();

  reader.onload = function () {
    const loadingTask = pdfjsLib.getDocument({ data: reader.result });
    loadingTask.promise
      .then((pdf) => {
        const numPages = pdf.numPages;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          pdf.getPage(pageNum).then((page) => {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderTask = page.render({ canvasContext: context, viewport });
            renderTask.promise.then(() => {
              Tesseract.recognize(canvas, 'eng', {
                logger: (info) => console.log(info),
              })
                .then(({ data: { text } }) => {
                  resultsArea.value += `Texto extraído do PDF - Página ${pageNum}:\n${text}\n\n`;
                })
                .catch((err) => {
                  resultsArea.value += `Erro ao processar PDF - Página ${pageNum}: ${err.message}\n\n`;
                });
            });
          });
        }
      })
      .catch((err) => {
        resultsArea.value += `Erro ao carregar PDF: ${err.message}\n\n`;
      });
  };

  reader.readAsArrayBuffer(file);
}

function processImage(file, resultsArea) {
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;

    img.onload = () => {
      Tesseract.recognize(img, 'eng', {
        logger: (info) => console.log(info),
      })
        .then(({ data: { text } }) => {
          resultsArea.value += `Texto extraído da imagem ${file.name}:\n${text}\n\n`;
        })
        .catch((err) => {
          resultsArea.value += `Erro ao processar imagem ${file.name}: ${err.message}\n\n`;
        });
    };
  };

  reader.readAsDataURL(file);
}





document.getElementById('sendButton').addEventListener('click', async () => {
  const inputText = document.getElementById('inputText').value;
  const resultText = document.getElementById('resultText');

  if (!inputText.trim()) {
    alert('Por favor, insira um texto!');
    return;
  }

  try {
    // Enviar o texto para o backend
    const response = await fetch('/processar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texto: inputText }),
    });

    const data = await response.json();

    if (data.resultado) {
      resultText.value = data.resultado; // Exibir o texto gerado no campo de saída
    } else {
      resultText.value = 'Erro ao processar o texto.';
    }
  } catch (error) {
    console.error('Erro:', error);
    resultText.value = 'Erro ao se comunicar com o servidor.';
  }
});

const additionalInfo = `
      TÍTULO:
      NÚMERO:
      Local e Data:

      ADQUIRENTE/COMPRADOR/DEVEDOR Pessoa Física:
      Nome:
      CPF:
      Nacionalidade:
      Profissão:
      Documentos:
      Endereço:
      Estado civil:
      Regime de casamento:
      Email:

      TRANSMITENTE/VENDEDOR Pessoa Física:
      Nome:
      CPF:
      Nacionalidade:
      Profissão:
      Documento:
      Endereço:
      Estado civil:
      Regime de casamento:
      Email:

      CREDOR:
      Nome:
      CNPJ:
      Endereço:
      Representantes:

      CONDIÇÕES DO FINANCIAMENTO:
      Modalidade:
      Sistema de amortização:
      Valor do contrato:
      Financiamento:
      Recursos próprios:
      FGTS:
      Taxa de Juros nominal:
      Taxa de Juros efetiva:
      Prazo:
      Prestação mensal inicial:
      Primeiro pagamento:

      DESCRIÇÃO DO IMÓVEL:
      Tipo:
      Área:
      Endereço:
      Bairro:
      Cidade:
      Matrícula:
    `;

    document.getElementById('sendToClaudeButton').addEventListener('click', async () => {
      const inputText = document.getElementById('inputText').value;

      const finalText = `${inputText}\n\n${additionalInfo}`; // Combine o texto original com as informações adicionais

      try {
        const response = await fetch(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLAUDE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: finalText }),
        });

        if (!response.ok) throw new Error(`Erro: ${response.statusText}`);

        const result = await response.json();
        const claudeResponse = result.output; // Substitua conforme o formato da API

        document.getElementById('inputText').value = claudeResponse; // Atualize o textarea com a resposta
        document.getElementById('generateXmlButton').style.display = 'inline-block'; // Mostre o botão de gerar XML
      } catch (error) {
        console.error('Erro ao enviar para Claude:', error);
        alert('Erro ao enviar para Claude. Verifique a conexão e a chave da API.');
      }
    });

    document.getElementById('generateXmlButton').addEventListener('click', () => {
      const inputText = document.getElementById('inputText').value;

      // Convertendo o texto para XML
      const xmlTemplate = `
        <documento>
          ${inputText.split('\n').map(line => {
            const [key, ...value] = line.split(':');
            if (key.trim()) {
              return `<${key.trim().replace(/ /g, '_').toLowerCase()}>${value.join(':').trim()}</${key.trim().replace(/ /g, '_').toLowerCase()}>`;
            }
            return '';
          }).join('')}
        </documento>
      `;

      // Criando um arquivo XML para download
      const blob = new Blob([xmlTemplate], { type: 'application/xml' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'informacoes_claude.xml';
      downloadLink.style.display = 'none';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });