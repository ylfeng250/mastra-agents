import { createOpenAI } from '@ai-sdk/openai';

export default function createQianfanModel() {
  // 自定义模型请求
  const qianfanModel = createOpenAI({
    apiKey: process.env.QIANFAN_API_KEY,
    baseURL: 'https://qianfan.baidubce.com/v2/coding',
  }).chat('deepseek-v3.2');
  return qianfanModel;
}
