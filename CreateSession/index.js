const crypto = require('crypto');

module.exports = async function (context, req) {
    // Génération d'un ID de session aléatoire
    const sessionId = crypto.randomBytes(4).toString('hex'); // Exemple : 'a3b4c7f1'

    context.res = {
        status: 200,
        body: {
            message: "Session créée avec succès",
            sessionId: sessionId
        },
        headers: {
            "Content-Type": "application/json"
        }
    };
};
