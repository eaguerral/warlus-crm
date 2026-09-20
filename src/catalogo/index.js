const express = require('express');

const app = express();
const PORT = process.env.CATALOGO_PORT || 8082;

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'catalogo',
        status: 'OK'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Microservicio de catálogo Warlus CRM'
    });
});

app.listen(PORT, () => {
    console.log(`Catalogo service ejecutándose en puerto ${PORT}`);
});