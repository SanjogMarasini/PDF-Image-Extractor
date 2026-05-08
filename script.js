pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const pdfInput = document.getElementById('pdfInput');
const extractBtn = document.getElementById('extractBtn');
const gallery = document.getElementById('gallery');
const statusText = document.getElementById('status');
const downloadAllBtn = document.getElementById('downloadAllBtn');

let imageDataList = [];

extractBtn.addEventListener('click', async () => {
  const file = pdfInput.files[0];

  if (!file) {
    alert('Please select a PDF file.');
    return;
  }

  gallery.innerHTML = '';
  imageDataList = [];
  downloadAllBtn.disabled = true;

  statusText.innerText = 'Processing PDF...';

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedArray = new Uint8Array(this.result);

    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    statusText.innerText = `Total Pages: ${pdf.numPages}`;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const imageData = canvas.toDataURL('image/png');

      imageDataList.push({
        name: `page-${pageNum}.png`,
        data: imageData
      });

      const card = document.createElement('div');
      card.className = 'card';

      const img = document.createElement('img');
      img.src = imageData;

      const downloadBtn = document.createElement('button');
      downloadBtn.innerText = `Download Page ${pageNum}`;

      downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = imageData;
        a.download = `page-${pageNum}.png`;
        a.click();
      });

      card.appendChild(img);
      card.appendChild(downloadBtn);

      gallery.appendChild(card);
    }

    statusText.innerText = 'Extraction Complete!';
    downloadAllBtn.disabled = false;
  };

  fileReader.readAsArrayBuffer(file);
});

downloadAllBtn.addEventListener('click', async () => {
  const zip = new JSZip();

  imageDataList.forEach((imgObj) => {
    const base64Data = imgObj.data.split(',')[1];
    zip.file(imgObj.name, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'pdf-images.zip';
  link.click();
});
