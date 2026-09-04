# Road AI Maintenance Server

Node.js + Express + TypeScript 后端框架。接口结构与前端 `src/api` 保持一致，默认返回 `/mock/data` 同源种子数据，运行期间内存中可增删改。

```bash
npm install
npm run dev
```

默认端口 `3001`，可用 `PORT` 环境变量覆盖。

## AI 识别

模型训练中，当前 `src/ai.ts` 提供异步识别桩。后续模型服务就绪后，将 `AI_RECOGNITION_ENDPOINT` 指向模型 HTTP 服务，并替换 `runRecognition` 实现。
