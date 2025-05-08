const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');

const app = express();
const port = 8080;

// OpenAPI定義ファイルを読み込む
const openApiDocument = YAML.parse(fs.readFileSync('./openapi.yaml', 'utf8'));

// Swagger UIを設定
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// OpenAPI定義をJSONとして提供するエンドポイント
app.get('/openapi.json', (req, res) => {
  res.json(openApiDocument);
});

app.listen(port, () => {
  console.log(`OpenAPI documentation server is running at http://localhost:${port}/api-docs`);
}); 