const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load text and clean it
let data = fs.readFileSync(path.join(__dirname, '../data/mental_health_knowledge.txt'), 'utf-8');

// Flatten to reduce excessive chunks
data = data.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

const CHUNK_SIZE = 2000;
const chunks = data.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g'));

console.log(`🧠 Total chunks to embed: ${chunks.length}`);

(async () => {
  const embeddedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk
      });

      embeddedChunks.push({
        embedding: embeddingRes.data[0].embedding,
        text: chunk
      });

      if ((i + 1) % 10 === 0) console.log(`✅ Embedded ${i + 1}/${chunks.length}`);
    } catch (err) {
      console.error(`❌ Error at chunk ${i + 1}: ${err.message}`);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '../data/embedded_knowledge.json'),
    JSON.stringify(embeddedChunks, null, 2)
  );

  console.log('✅ All embeddings saved successfully!');
})();
