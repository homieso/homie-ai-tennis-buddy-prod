# AI网球搭子产品迭代优化实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于用户反馈完成5个优化任务：注册流程优化、邮件提醒功能、智能对话增强、价值传递、意见反馈精细化问卷

**Architecture:** 在现有Next.js + Supabase架构上扩展功能，添加邮件服务集成，优化用户体验流程，增强AI个性化互动

**Tech Stack:** Next.js 14, Supabase, Stripe, DeepSeek API, Resend/SendGrid邮件服务, Vercel Cron Jobs

---

## File Structure
**New files:**
- Create: `src/app/api/send-email/route.ts` - 邮件发送API
- Create: `src/app/api/daily-reminders/route.ts` - 每日提醒定时任务API
- Create: `src/components/RegistrationSteps/` - 注册步骤组件化
  - Create: `src/components/RegistrationSteps/AgeStep.tsx`
  - Create: `src/components/RegistrationSteps/PlayingYearsStep.tsx`
  - Create: `src/components/RegistrationSteps/PreferencesStep.tsx`
  - Create: `src/components/RegistrationSteps/EmailConsentStep.tsx`
- Create: `src/components/WelcomeModal.tsx` - 注册成功欢迎模态框
- Create: `src/components/EnhancedFeedbackModal.tsx` - 增强反馈模态框

**Modify existing files:**
- Modify: `src/app/register/page.tsx` - 注册页面重构
- Modify: `src/app/api/register/route.ts` - 扩展API以存储新字段
- Modify: `src/app/dashboard/page.tsx` - 增强反馈模态框
- Modify: `src/app/api/feedback/route.ts` - 反馈API扩展
- Modify: `src/app/api/generate-goal/route.ts` - 个性化提示词
- Modify: `src/app/api/generate-emotion-support/route.ts` - 个性化提示词
- Modify: `src/lib/database.types.ts` - 扩展数据库类型

**Database migrations:**
- Add to `profiles` table: `email_notifications` (BOOLEAN DEFAULT TRUE), `last_email_sent` (TIMESTAMP), `user_preferences` (JSONB)
- Add to `feedback` table: `preferences` (JSONB)

## Task 1: 注册流程优化

### Task 1.1: 重构注册页面组件结构

**Files:**
- Modify: `src/app/register/page.tsx`
- Create: `src/components/RegistrationSteps/AgeStep.tsx`
- Create: `src/components/RegistrationSteps/PlayingYearsStep.tsx`
- Create: `src/components/RegistrationSteps/PreferencesStep.tsx`
- Create: `src/components/RegistrationSteps/EmailConsentStep.tsx`

- [ ] **Step 1: 分析现有注册页面结构**

检查当前`src/app/register/page.tsx`的组件结构，识别可抽取的部分

- [ ] **Step 2: 创建年龄选择组件**

```typescript
// src/components/RegistrationSteps/AgeStep.tsx
// 选项：18岁以下、18-25岁、26-35岁、36岁以上、"不愿透露"
```

- [ ] **Step 3: 创建球龄选择组件**

```typescript
// src/components/RegistrationSteps/PlayingYearsStep.tsx
// 选项：刚开始/1-3个月/3-6个月/6个月-1年/1年以上、"不愿透露"
```

- [ ] **Step 4: 创建偏好选择组件**

```typescript
// src/components/RegistrationSteps/PreferencesStep.tsx
// 多选：记录练习、提醒练球、打气鼓励、解答疑惑、其他（文本框）
// "暂不选择，直接跳过"按钮
```

- [ ] **Step 5: 创建邮件同意组件**

```typescript
// src/components/RegistrationSteps/EmailConsentStep.tsx
// 复选框："我同意接收Homie的每日鼓励邮件（可随时取消）"
```

- [ ] **Step 6: 重构注册页面**

修改`src/app/register/page.tsx`使用新的步骤组件，更新状态管理以支持新字段

- [ ] **Step 7: 更新步骤配置**

更新`stepConfig`对象，添加Homie对话气泡文案优化

- [ ] **Step 8: 测试注册流程**

本地测试新的注册流程，确保所有步骤正常工作

### Task 1.2: 扩展注册API

**Files:**
- Modify: `src/app/api/register/route.ts`
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: 更新数据库类型定义**

在`src/lib/database.types.ts`中扩展`profiles`表类型，添加新字段

- [ ] **Step 2: 扩展注册API请求体**

修改API以接收新字段：`age_range`, `playing_years_range`, `user_preferences`, `email_notifications`

- [ ] **Step 3: 更新数据库插入逻辑**

修改profile数据插入，包含新字段

- [ ] **Step 4: 验证API兼容性**

确保API向后兼容，现有注册不受影响

## Task 2: 邮件提醒功能

### Task 2.1: 数据库扩展

**Files:**
- Database migration (SQL)

- [ ] **Step 1: 创建数据库迁移脚本**

```sql
-- 为profiles表添加新字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_preferences JSONB;

-- 为feedback表添加新字段
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS preferences JSONB;
```

**注意：** 需要暂停询问用户是否已运行此迁移，或使用Supabase Dashboard执行

### Task 2.2: 邮件发送API

**Files:**
- Create: `src/app/api/send-email/route.ts`

- [ ] **Step 1: 创建邮件发送API基础结构**

```typescript
// 基础API路由，使用Resend服务（需要API密钥）
```

**暂停点：** 需要询问用户邮件服务选择和API密钥

- [ ] **Step 2: 实现邮件模板**

创建HTML邮件模板，包含个性化问候、鼓励语、练习提醒

- [ ] **Step 3: 添加环境变量验证**

在API中验证`RESEND_API_KEY`环境变量

- [ ] **Step 4: 实现发送逻辑**

实现邮件发送函数，处理成功/失败响应

### Task 2.3: 每日提醒定时任务

**Files:**
- Create: `src/app/api/daily-reminders/route.ts`
- Create: `vercel.json` (配置Cron Jobs)

- [ ] **Step 1: 创建每日提醒API**

```typescript
// 获取所有同意接收邮件的用户
// 调用DeepSeek API生成个性化鼓励语
// 调用邮件API发送
```

- [ ] **Step 2: 配置Vercel Cron Jobs**

在`vercel.json`中添加Cron配置，每天上午9点执行

```json
{
  "crons": [
    {
      "path": "/api/daily-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] **Step 3: 实现个性化内容生成**

集成DeepSeek API，基于用户历史生成个性化内容

- [ ] **Step 4: 添加防重复发送机制**

检查`last_email_sent`字段，避免重复发送

## Task 3: 智能对话增强

### Task 3.1: 注册流程动态对话

**Files:**
- Modify: `src/app/register/page.tsx`

- [ ] **Step 1: 实现上下文状态管理**

在注册流程中保存已收集的用户信息，动态更新Homie对话文案

- [ ] **Step 2: 个性化问候**

根据昵称个性化步骤文案，如："小雅，你学网球多久了？"

- [ ] **Step 3: 年龄自适应语气**

根据年龄范围调整Homie的语气（如对年轻用户更活泼，对成年用户更稳重）

### Task 3.2: AI API个性化增强

**Files:**
- Modify: `src/app/api/generate-goal/route.ts`
- Modify: `src/app/api/generate-emotion-support/route.ts`
- Modify: `src/app/api/generate-practice-log/route.ts`

- [ ] **Step 1: 扩展AI提示词上下文**

修改所有生成API，从数据库读取用户档案信息（年龄、球龄、偏好）

- [ ] **Step 2: 个性化目标生成**

在周目标生成中考虑用户球龄和偏好

- [ ] **Step 3: 个性化情感支持**

在情感支持中基于用户信息和历史互动提供更贴心的回复

- [ ] **Step 4: 测试个性化效果**

验证AI回复的个性化程度

## Task 4: 价值传递

### Task 4.1: 注册成功欢迎体验

**Files:**
- Create: `src/components/WelcomeModal.tsx`
- Modify: `src/app/register/page.tsx`

- [ ] **Step 1: 创建欢迎模态框组件**

```typescript
// 显示Homie欢迎消息，使用用户昵称
// "小雅，很高兴认识你！我会一直陪着你练球..."
// "开始"按钮跳转到仪表盘
```

- [ ] **Step 2: 集成到注册流程**

修改注册成功后的跳转逻辑，先显示欢迎模态框

- [ ] **Step 3: 添加动画效果**

使用Framer Motion添加平滑过渡动画

- [ ] **Step 4: 测试用户体验**

验证注册成功后的流程是否顺畅

## Task 5: 意见反馈精细化问卷

### Task 5.1: 增强反馈模态框

**Files:**
- Create: `src/components/EnhancedFeedbackModal.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/api/feedback/route.ts`

- [ ] **Step 1: 创建增强反馈组件**

```typescript
// 添加偏好选择部分：提醒练球、分析动作视频、约球友、解答疑惑、其他
// 与注册步骤5类似的选项，但可多选
```

- [ ] **Step 2: 替换现有反馈模态框**

修改`src/app/dashboard/page.tsx`，使用新的增强反馈组件

- [ ] **Step 3: 扩展反馈API**

修改`src/app/api/feedback/route.ts`接收`preferences`字段

- [ ] **Step 4: 更新数据库存储**

将用户选择的偏好存储到`feedback.preferences` JSONB字段

- [ ] **Step 5: 测试提交功能**

验证反馈提交包含偏好选项

## 执行顺序

1. **先执行Task 1** - 注册流程优化（前端修改）
2. **执行Task 3.1** - 智能对话增强（与Task 1协同）
3. **执行Task 4** - 价值传递（依赖Task 1完成）
4. **执行Task 5** - 意见反馈精细化（独立任务）
5. **执行Task 2** - 邮件提醒功能（需要外部API密钥）
6. **最后执行Task 3.2** - AI API个性化增强

## 需要用户提供的额外信息

1. **邮件服务选择**：Resend、SendGrid还是其他服务？
2. **邮件服务API密钥**：执行到Task 2.2时暂停询问
3. **数据库迁移确认**：是否已运行迁移脚本，或需要Claude协助生成SQL？

## 风险评估

1. **数据库迁移**：添加新字段需要小心处理，确保现有数据兼容
2. **邮件服务依赖**：需要外部API密钥，可能涉及成本
3. **定时任务**：Vercel Cron Jobs可能需要Pro计划
4. **AI提示词修改**：需要测试个性化效果，避免生成不当内容