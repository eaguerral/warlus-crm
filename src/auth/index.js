const express = require('express');

const app = express();
const PORT = process.env.AUTH_PORT || 8081;

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'auth',
        status: 'OK'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Microservicio de autenticación Warlus CRM'
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Auth service ejecutándose en puerto ${PORT}`);
    });
}

module.exports = app;