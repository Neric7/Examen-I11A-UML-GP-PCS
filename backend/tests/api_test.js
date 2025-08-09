const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: "nericbenrahery@gmail.com", // À adapter
  password: "1234"                    // À adapter
};

const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

async function getAuthToken() {
  try {
    console.log("Tentative de connexion avec:", TEST_USER.email);

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (!response.data.token) {
      throw new Error("Pas de token reçu dans la réponse");
    }

    console.log("✅ Authentification réussie");
    return response.data.token;

  } catch (error) {
    console.error("❌ Échec de l'authentification. Détails:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Données:", error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

async function testGetPosts(token) {
  try {
    console.log("\n📥 Test récupération des posts...");

    const response = await axios.get(`${BASE_URL}/posts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Nombre de posts reçus : ${response.data.length || response.data.posts?.length || 0}`);

    return response.data;

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des posts:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Données:", error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

async function testCreatePost(token) {
  try {
    console.log("\n📤 Test création d'un post...");

    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.warn(`⚠️ Image de test non trouvée : ${TEST_IMAGE_PATH}`);
      console.warn("Le test continuera sans image.");
    }

    const form = new FormData();
    form.append('content', 'Test de post via api_test.js');
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      form.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    }

    const response = await axios.post(`${BASE_URL}/posts`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

    console.log("Post créé avec succès :", response.data);

  } catch (error) {
    console.error("❌ Erreur lors de la création du post:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Données:", error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

(async () => {
  try {
    console.log("🔐 Authentification...");
    const token = await getAuthToken();

    await testGetPosts(token);

    await testCreatePost(token);

    console.log("\n🎉 Tous les tests ont été exécutés.");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Un test a échoué. Voir les logs ci-dessus.");
    process.exit(1);
  }
})();
