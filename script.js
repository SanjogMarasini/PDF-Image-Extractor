pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const { jsPDF } = window.jspdf;

const pdfInput = document.getElementById('pdfInput');
const extractBtn = document.getElementById('extractBtn');
const gallery = document.getElementById('gallery');
const statusText = document.getElementById('status');

const downloadAllImagesBtn = document.getElementById('downloadAllImagesBtn');
const downloadAllPdfBtn = document.getElementById('downloadAllPdfBtn');

let imageDataList = [];

extractBtn.addEventListener('click', async () => {
  const file = pdfInput.files[0];

  if (!file) {
    alert('Please select a PDF file.');
    return;
  }

  gallery.innerHTML = '';
  imageDataList = [];

  downloadAllImagesBtn.disabled = true;
  downloadAllPdfBtn.disabled = true;

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

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const imageData = canvas.toDataURL('image/png');

      imageDataList.push({
        page: pageNum,
        image: imageData
      });

      const card = document.createElement('div');
      card.className = 'card';

      const img = document.createElement('img');
      img.src = imageData;

      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'button-group';

      // Download Image Button
      const imageBtn = document.createElement('button');
      imageBtn.innerText = `Download Image Page ${pageNum}`;

      imageBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `page-${pageNum}.png`;
        link.click();
      });

      // Download PDF Button
      const pdfBtn = document.createElement('button');
      pdfBtn.innerText = `Save Page ${pageNum} as PDF`;

      pdfBtn.addEventListener('click', () => {
        const pdfDoc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdfDoc.addImage(
          imageData,
          'PNG',
          0,
          0,
          canvas.width,
          canvas.height
        );

        pdfDoc.save(`page-${pageNum}.pdf`);
      });

      buttonGroup.appendChild(imageBtn);
      buttonGroup.appendChild(pdfBtn);

      card.appendChild(img);
      card.appendChild(buttonGroup);

      gallery.appendChild(card);
    }

    statusText.innerText = 'Extraction Complete!';
    downloadAllImagesBtn.disabled = false;
    downloadAllPdfBtn.disabled = false;
  };

  fileReader.readAsArrayBuffer(file);
});

// Download all images as ZIP
downloadAllImagesBtn.addEventListener('click', async () => {

  const zip = new JSZip();

  imageDataList.forEach((imgObj) => {
    const base64Data = imgObj.image.split(',')[1];

    zip.file(`page-${imgObj.page}.png`, base64Data, {
      base64: true
    });
  });

  const content = await zip.generateAsync({ type: 'blob' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'all-images.zip';
  link.click();
});

// Download all pages as one PDF
downloadAllPdfBtn.addEventListener('click', async () => {

  if (imageDataList.length === 0) return;

  const firstImage = imageDataList[0].image;

  const img = new Image();
  img.src = firstImage;

  img.onload = () => {

    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [img.width, img.height]
    });

    imageDataList.forEach((imgObj, index) => {

      if (index !== 0) {
        pdfDoc.addPage([img.width, img.height], 'portrait');
      }

      pdfDoc.addImage(
        imgObj.image,
        'PNG',
        0,
        0,
        img.width,
        img.height
      );
    });

    pdfDoc.save('all-pages.pdf');
  };
});
