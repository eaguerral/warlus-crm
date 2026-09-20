const express = require('express');

const app = express();
const PORT = process.env.PEDIDOS_PORT || 8083;

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'pedidos',
        status: 'OK'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Microservicio de pedidos Warlus CRM'
    });
});

app.listen(PORT, () => {
    console.log(`Pedidos service ejecutándose en puerto ${PORT}`);
});