require('dotenv').config();
throw new Error('TEST - Erreur levée à l’import du routeur GetCategories');
console.log('DEBUG MONGO_URI:', process.env.MONGO_URI);
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Auto-loader de toutes les routes situées dans des dossiers
fs.readdirSync(__dirname).forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.lstatSync(fullPath).isDirectory()) {
        try {
            const route = require(fullPath);
            app.use(`/${dir}`, route);
            console.log(`Route chargée: /${dir}`);
        } catch (err) {
            console.warn(`Aucun routeur trouvé dans ${dir}`);
        }
    }
});

// Route de test
app.get('/', (req, res) => {
    res.send('API Lampion en ligne');
});

app.listen(port, () => {
    console.log(`API listening on port ${port}`);
    console.log('ENV:', process.env);
    console.log('MONGO_URI:', process.env.MONGO_URI);
});
