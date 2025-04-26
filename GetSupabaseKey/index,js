module.exports = async function (context, req) {
  const key = process.env.VITE_SUPABASE_KEY;
  const url = process.env.VITE_SUPABASE_URL;

  if (!key || !url) {
    context.res = {
      status: 500,
      body: "Clé ou URL Supabase manquante dans les variables d'environnement."
    };
    return;
  }

  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: {
      key: key,
      url: url
    }
  };
};
