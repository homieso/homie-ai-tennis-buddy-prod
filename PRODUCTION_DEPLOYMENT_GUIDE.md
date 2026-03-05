# AI网球搭子项目 - 生产环境部署与域名切换操作指南

## 概述
本指南详细说明如何将AI网球搭子项目（homie-ai-tennis-buddy）部署到生产环境，包括Supabase数据库配置、Vercel部署和域名切换。请按顺序执行以下步骤。

---

## 一、Supabase 生产环境配置

### 1. 创建新 Supabase 项目
1. **登录 Supabase 控制台**
   - 访问 [https://app.supabase.com](https://app.supabase.com) 并登录
   - 点击 "New Project"

2. **配置项目参数**
   - **项目名称**: `ai-tennis-buddy-prod`（建议）
   - **数据库密码**: 设置一个强密码并妥善保管
   - **区域**: 选择 `Southeast Asia (Singapore)` 或根据用户地理位置选择最近区域
   - **定价计划**: 选择免费计划（Free Tier）即可满足初期需求

3. **记录关键信息**
   创建完成后，在项目设置中找到以下信息并保存：
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. 执行数据库迁移
在Supabase SQL编辑器中按顺序执行以下脚本：

**执行顺序：**
1. **schema.sql** - 创建核心表结构
   ```sql
   -- 从项目文件复制完整内容
   -- 文件位置: src/database/schema.sql
   ```

2. **migration-profile-fields.sql** - 添加用户档案字段
   ```sql
   -- 从项目文件复制完整内容
   -- 文件位置: src/database/migration-profile-fields.sql
   ```

3. **migration-subscription.sql** - 添加会员相关表
   ```sql
   -- 从项目文件复制完整内容
   -- 文件位置: src/database/migration-subscription.sql
   ```

4. **migration-feedback.sql** - 创建反馈表
   ```sql
   -- 从项目文件复制完整内容
   -- 文件位置: src/database/migration-feedback.sql
   ```

**操作步骤：**
1. 在Supabase控制台左侧菜单选择 "SQL Editor"
2. 点击 "New query"
3. 将每个SQL文件的内容复制到编辑器中
4. 点击 "Run" 执行
5. 检查执行结果，确保没有错误

**验证数据库结构：**
执行完成后，在 "Table Editor" 中应能看到以下表：
- `profiles`
- `weekly_goals`
- `practice_logs`
- `risk_assessments`
- `subscriptions`
- `feedback`

---

## 二、Vercel 部署

### 1. 导入 GitHub 仓库
1. **登录 Vercel**
   - 访问 [https://vercel.com](https://vercel.com) 并登录
   - 确保已连接GitHub账户（Settings → Git Connections）

2. **创建新项目**
   - 点击 "Add New" → "Project"
   - 选择GitHub仓库 `homieso/homie-ai-tennis-buddy`
   - 如果仓库未出现，点击 "Adjust GitHub App Permissions" 重新授权

3. **配置项目设置**
   - **Project Name**: `homie-ai-tennis-buddy`（自动填充）
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `/`（默认）
   - **Build and Output Settings**: 保持默认

### 2. 配置环境变量
在 "Environment Variables" 部分添加以下变量：

| 变量名 | 值来源 | 示例值（占位符） |
|--------|--------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase项目URL | `https://xxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DEEPSEEK_API_KEY` | DeepSeek API控制台 | `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `STRIPE_SECRET_KEY` | Stripe测试密钥 | `sk_test_<your_stripe_secret_key>` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe测试可发布密钥 | `pk_test_<your_stripe_publishable_key>` |
| `STRIPE_PRICE_ID` | Stripe价格ID | `price_<your_stripe_price_id>` |

**重要提醒：**
- Stripe密钥目前使用测试模式，如需正式收费，后续需替换为生产密钥
- 所有敏感密钥仅配置在Vercel环境变量中，切勿提交到GitHub
- 确保 `.env.local` 文件已通过 `.gitignore` 排除

### 3. 部署项目
1. **开始部署**
   - 点击 "Deploy" 按钮
   - Vercel将自动构建和部署项目

2. **等待部署完成**
   - 构建过程约2-5分钟
   - 部署成功后，Vercel会提供一个默认域名：`homie-ai-tennis-buddy.vercel.app`

3. **验证部署**
   - 访问默认域名，确认应用正常运行
   - 测试注册、登录、目标设置等核心功能

---

## 三、域名切换（国内版）

### 1. 确定目标域名
继续使用现有国内域名：`www.tennisjourney.top`

### 2. 在 Vercel 中添加自定义域名
1. 进入Vercel项目仪表板
2. 选择 "Settings" → "Domains"
3. 在输入框中输入 `www.tennisjourney.top`
4. 点击 "Add"

5. **Vercel会显示DNS配置要求：**
   ```
   记录类型: CNAME
   主机记录: www
   记录值: cname.vercel-dns.com
   ```

### 3. 在阿里云修改 DNS 解析
1. **登录阿里云控制台**
   - 访问 [https://homenew.console.aliyun.com](https://homenew.console.aliyun.com)
   - 进入 "域名" → "域名列表"

2. **找到域名**
   - 选择 `tennisjourney.top` 域名
   - 点击 "解析设置"

3. **修改解析记录**
   - 找到现有的 `www` 记录（如果存在）
   - 点击 "修改" 或 "添加记录"
   - 配置如下：
     ```
     记录类型: CNAME
     主机记录: www
     记录值: cname.vercel-dns.com
     TTL: 10分钟（默认）
     ```

4. **保存设置**
   - 点击 "确认"
   - 等待DNS生效（通常几分钟到几小时）

### 4. 验证域名生效
1. **检查DNS传播**
   ```bash
   # 在终端执行
   dig www.tennisjourney.top
   # 或
   nslookup www.tennisjourney.top
   ```
   确认解析到 `cname.vercel-dns.com`

2. **访问网站**
   - 打开浏览器访问 `https://www.tennisjourney.top`
   - 确认能正常打开新项目页面
   - 测试所有功能是否正常工作

---

## 四、旧项目清理（可选）

### 1. 移除旧域名绑定
1. 访问旧Vercel项目：`tennis-journey`
2. 进入 "Settings" → "Domains"
3. 找到 `www.tennisjourney.top` 域名
4. 点击 "Remove" 解除绑定

### 2. 保留国际版域名
以下域名可保留，不影响新项目：
- `tj-7.vercel.app`
- `tennis-journey-homieso.vercel.app`

---

## 五、安全提醒与最佳实践

### 1. 密钥安全管理
- ✅ **已做**: 所有敏感密钥配置在Vercel环境变量中
- ✅ **已做**: `.env.local` 已通过 `.gitignore` 排除
- 🔍 **需定期检查**: 确保GitHub仓库没有意外提交密钥
- 🔄 **需定期更新**: 定期轮换API密钥

### 2. 数据库安全
- 启用Supabase行级安全（Row Level Security）
- 定期备份数据库
- 监控数据库使用情况

### 3. 监控与日志
- 配置Vercel Analytics监控访问量
- 设置错误监控（如Sentry）
- 定期检查Supabase日志

### 4. 性能优化
- 启用Vercel Edge Functions（如适用）
- 配置图片优化
- 使用CDN缓存静态资源

---

## 六、故障排除

### 常见问题及解决方案

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 部署失败 | 环境变量缺失 | 检查Vercel环境变量配置 |
| 数据库连接失败 | Supabase URL/Key错误 | 验证Supabase项目配置 |
| 域名无法访问 | DNS未生效 | 等待DNS传播或检查解析记录 |
| Stripe支付失败 | 测试密钥配置错误 | 检查Stripe Dashboard密钥 |
| AI功能不可用 | DeepSeek API密钥错误 | 验证DeepSeek API密钥 |

### 获取帮助
- **Vercel文档**: [https://vercel.com/docs](https://vercel.com/docs)
- **Supabase文档**: [https://supabase.com/docs](https://supabase.com/docs)
- **项目GitHub Issues**: [https://github.com/homieso/homie-ai-tennis-buddy/issues](https://github.com/homieso/homie-ai-tennis-buddy/issues)

---

## 七、后续维护

### 1. 代码更新流程
```bash
# 1. 本地开发
git pull origin main
# 进行修改...

# 2. 提交到GitHub
git add .
git commit -m "更新描述"
git push origin main

# 3. Vercel自动部署
# 推送后Vercel会自动触发重新部署
```

### 2. 数据库迁移
- 新增数据库变更时，创建新的迁移脚本
- 在Supabase SQL编辑器中按顺序执行
- 记录所有迁移操作

### 3. 定期检查清单
- [ ] 监控Vercel部署状态
- [ ] 检查Supabase使用量
- [ ] 验证域名SSL证书
- [ ] 测试核心功能
- [ ] 备份数据库

---

## 完成状态确认

完成所有步骤后，应满足以下条件：

✅ **Supabase配置完成**
- 新项目 `ai-tennis-buddy-prod` 创建
- 所有数据库表成功迁移
- 环境变量已记录

✅ **Vercel部署完成**
- 项目成功部署到 `homie-ai-tennis-buddy.vercel.app`
- 所有环境变量正确配置
- 应用功能正常

✅ **域名切换完成**
- `www.tennisjourney.top` 解析到新Vercel项目
- SSL证书自动签发
- 网站可正常访问

✅ **安全配置完成**
- 所有密钥安全存储
- 无敏感信息泄露风险
- 访问控制配置正确

---

**最后更新**: 2026-03-05  
**文档维护者**: AI网球搭子项目团队