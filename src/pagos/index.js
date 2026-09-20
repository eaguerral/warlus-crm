const express = require('express');

const app = express();
const PORT = process.env.PAGOS_PORT || 8084;

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'pagos',
        status: 'OK'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Microservicio de pagos Warlus CRM'
    });
});

app.listen(PORT, () => {
    console.log(`Pagos service ejecutándose en puerto ${PORT}`);
});