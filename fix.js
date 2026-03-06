const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 读取环境变量
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!GITHUB_TOKEN || !VERCEL_TOKEN || !VERCEL_PROJECT_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  console.error('❌ 请先设置所有环境变量');
  process.exit(1);
}

console.log('🔍 开始全面诊断...');

async function run() {
  try {
    // 1. 检查本地 Git 状态并推送最新代码
    console.log('📦 检查 Git 状态...');
    execSync('git add .', { stdio: 'inherit' });
    try {
      execSync('git commit -m "chore: automated fix"', { stdio: 'inherit' });
    } catch (e) {
      console.log('ℹ️ 没有新的更改需要提交');
    }
    console.log('⬆️ 推送代码到 GitHub...');
    execSync(`git push https://${GITHUB_TOKEN}@github.com/homieso/homie-ai-tennis-buddy.git main`, { stdio: 'inherit' });

    // 2. 触发 Vercel 重新部署（使用 Deploy Hook，需要提前创建或通过 API）
    // 这里使用 Vercel API 触发部署
    console.log('🚀 触发 Vercel 部署...');
    const deployRes = await fetch(`https://api.vercel.com/v1/deployments?projectId=${VERCEL_PROJECT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'homie-ai-tennis-buddy', target: 'production', gitSource: { ref: 'main' } })
    });
    const deployData = await deployRes.json();
    if (!deployRes.ok) throw new Error(`部署失败: ${deployData.error?.message || JSON.stringify(deployData)}`);
    console.log('✅ 部署已触发，等待构建完成...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // 等待 60 秒

    // 3. 获取最新部署状态和日志
    console.log('📊 获取 Vercel 部署状态...');
    const deploysRes = await fetch(`https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1`, {
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    });
    const deploys = await deploysRes.json();
    const latestDeploy = deploys.deployments[0];
    console.log(`最新部署: ${latestDeploy.uid}, 状态: ${latestDeploy.state}`);
    if (latestDeploy.state !== 'READY') {
      console.log('⏳ 部署尚未完成，再等待 60 秒...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }

    // 4. 获取 feedback API 的函数日志
    console.log('📜 获取 /api/feedback 函数日志...');
    const logsRes = await fetch(`https://api.vercel.com/v1/deployments/${latestDeploy.uid}/functions/api/feedback/logs`, {
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    });
    const logs = await logsRes.text();
    console.log('日志片段:\n', logs.substring(0, 1000));

    // 5. 连接 Supabase 并修复 RLS
    console.log('🛠️ 连接 Supabase 并修复 RLS...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { db: { schema: 'public' } });

    // 执行修复 SQL
    const fixSQL = `
      -- 确保 RLS 启用
      ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

      -- 删除旧策略
      DROP POLICY IF EXISTS "用户可以插入自己的反馈" ON public.feedback;
      DROP POLICY IF EXISTS "allow_insert_feedback" ON public.feedback;

      -- 创建正确策略
      CREATE POLICY "allow_insert_feedback" ON public.feedback
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- 检查表结构
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'feedback' AND table_schema = 'public';
    `;
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', { query: fixSQL }); // 注意：需要启用 exec_sql 函数或直接使用 REST API
    // 由于 Supabase 默认不允许执行任意 SQL，我们改用 REST API 调用 SQL 编辑器接口？这需要更高权限。我们采用另一种方式：直接使用 service_role 执行查询。
    // 实际上，我们可以通过 supabase 的 .rpc 调用一个自定义函数，但可能不存在。所以这里我们直接使用 SQL 编辑器的方式不可行。改为通过 supabase 的 REST API 执行原始 SQL 需要开启 pg_net 等。
    // 因此，我们只能通过 Supabase 的 SQL 编辑器手动执行。但这是自动化脚本，所以这里只能提醒用户手动执行。
    console.log('⚠️ 无法自动执行 SQL，请手动在 Supabase SQL 编辑器中执行以下语句：');
    console.log(fixSQL);

    // 但我们可以通过 service_role 直接查询和修改，但需要对应权限。Supabase 的 JavaScript 客户端不支持执行任意 SQL，除非通过 .rpc 调用自定义函数。
    // 我们退而求其次，通过 REST API 直接调用 SQL 编辑器？那需要登录，不可行。所以这一步只能提示用户。

    // 6. 测试反馈 API
    console.log('🧪 测试反馈 API...');
    // 先获取用户 JWT（登录）
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    if (signInError) throw new Error(`登录失败: ${signInError.message}`);
    const token = signInData.session.access_token;

    // 调用生产环境 API
    const testRes = await fetch('https://www.tennisjourney.top/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: '自动化测试反馈' })
    });
    const testResult = await testRes.json();
    console.log('测试响应:', testResult);
    if (!testRes.ok) {
      console.error('❌ 测试失败，需要进一步诊断');
      // 再次获取 Vercel 日志
      const logsRes2 = await fetch(`https://api.vercel.com/v1/deployments/${latestDeploy.uid}/functions/api/feedback/logs`, {
        headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
      });
      const logs2 = await logsRes2.text();
      console.log('最新日志:\n', logs2);
    } else {
      console.log('✅ 反馈功能已修复！');
    }

    // 7. 输出最终报告
    console.log('\n📋 诊断报告');
    console.log('==========');
    console.log(`最新部署 ID: ${latestDeploy.uid}`);
    console.log(`部署状态: ${latestDeploy.state}`);
    console.log(`反馈 API 测试: ${testRes.ok ? '成功' : '失败'}`);
    if (!testRes.ok) {
      console.log('请检查上方日志，并考虑手动执行 SQL 修复。');
    }

  } catch (error) {
    console.error('❌ 诊断过程出错:', error);
  }
}

run();
