const tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Diretório contendo os arquivos de imagem
const imageDir = './images'; // Altere para o caminho do seu diretório de imagens

// Função para processar um arquivo com Tesseract.js
const processFile = (filePath) => {
  return tesseract.recognize(filePath, 'por', {
    logger: (info) => console.log(info.progress ? `Progress: ${info.progress * 100}%` : info),
  })
    .then(({ data: { text } }) => {
      console.log(`OCR concluído para ${filePath}`);
      return { filePath, text };
    })
    .catch((err) => {
      console.error(`Erro ao processar ${filePath}:`, err);
      return { filePath, error: err.message };
    });
};

// Função principal para processar múltiplos arquivos
const processFilesInDirectory = async (directory) => {
  const files = fs.readdirSync(directory)
    .filter((file) => /\.(png|jpe?g|bmp|tiff|webp)$/i.test(file)) // Filtrar arquivos de imagem
    .map((file) => path.join(directory, file));

  if (files.length === 0) {
    console.log('Nenhuma imagem encontrada no diretório.');
    return;
  }

  console.log(`Encontrado(s) ${files.length} arquivo(s) para processar.`);

  const results = await Promise.all(files.map((file) => processFile(file)));

  // Salvar resultados em um arquivo de texto
  const outputFilePath = path.join(directory, 'ocr_results.txt');
  const outputContent = results
    .map(({ filePath, text, error }) =>
      error ? `Erro em ${filePath}: ${error}` : `Arquivo: ${filePath}\nTexto extraído:\n${text}\n\n`
    )
    .join('\n');

  fs.writeFileSync(outputFilePath, outputContent, 'utf-8');
  console.log(`Resultados salvos em ${outputFilePath}`);
};

// Executar o processamento
processFilesInDirectory(imageDir);
