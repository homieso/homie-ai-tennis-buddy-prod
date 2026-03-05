# AI网球搭子 (AI Tennis Buddy)
一个温暖的网球AI陪伴应用，帮助初学者度过学习瓶颈期。Homie学长陪你练球、记录进步、提供情绪支持。

## 技术栈
- **前端框架**：Next.js 14 (App Router) + Tailwind CSS
- **后端**：Supabase (PostgreSQL, Auth, Storage)
- **AI引擎**：DeepSeek API
- **支付**：Stripe (国际) + 激活码 (国内)
- **部署**：Vercel

## 本地开发
1. 克隆仓库：`git clone https://github.com/homieso/homie-ai-tennis-buddy.git`
2. 安装依赖：`npm install`
3. 复制 `.env.example` 为 `.env.local`，填入必要的环境变量（参见 `.env.example`）。
4. 运行开发服务器：`npm run dev`
5. 访问 `http://localhost:3000`

## 环境变量说明
请参考 `.env.example` 文件。所有密钥请勿提交到Git。

## 部署
推荐使用Vercel一键部署：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/homieso/homie-ai-tennis-buddy)

## 贡献指南
欢迎提交Issue和Pull Request。请确保代码通过ESLint和TypeScript检查。

## 许可证
MIT License
