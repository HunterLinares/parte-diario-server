
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.post('/enviar-parte', async (req, res) => {
  const data = req.body;
  const pdfPath = path.join(__dirname, 'parte_diario.pdf');

  // Crear PDF
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  doc.fontSize(18).text('Parte Diario de Trabajo', { align: 'center' });
  doc.moveDown();

  Object.entries(data).forEach(([key, value]) => {
    doc.fontSize(12).text(`${key.toUpperCase()}: ${value}`);
    doc.moveDown(0.5);
  });

  doc.end();

  writeStream.on('finish', async () => {
    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      host: 'smtp.dondominio.com',
      port: 587,
      secure: false,
      auth: {
        user: 'partes@securitymen.org',
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: 'partes@securitymen.org',
      to: 'partes@securitymen.org',
      subject: 'Parte Diario de Trabajo',
      text: 'Adjunto el parte diario generado automáticamente.',
      attachments: [
        {
          filename: 'parte_diario.pdf',
          path: pdfPath
        }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      fs.unlinkSync(pdfPath); // Eliminar el archivo después de enviar
      res.json({ status: 'success', message: 'Parte enviado correctamente por correo.' });
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      res.status(500).json({ status: 'error', message: 'Error al enviar el correo.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
