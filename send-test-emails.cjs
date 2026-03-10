require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmails() {
  console.log('开始发送测试邮件...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置');
  console.log('Resend API Key:', process.env.RESEND_API_KEY ? '已设置' : '未设置');

  // 使用Supabase Admin API获取用户列表
  // 注意：这需要service role key
  try {
    // 获取所有用户
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('获取用户列表失败:', authError);
      throw authError;
    }

    console.log(`从Auth获取到 ${authUsers?.users?.length || 0} 个用户`);

    // 获取启用了邮件通知的profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nickname, user_preferences, email_notifications')
      .eq('email_notifications', true);

    if (profilesError) {
      console.error('查询profiles失败:', profilesError);
      throw profilesError;
    }

    console.log(`找到 ${profiles?.length || 0} 个已启用邮件通知的用户档案`);

    if (!profiles || profiles.length === 0) {
      console.log('没有需要发送邮件的用户');
      return;
    }

    // 构建用户列表，合并auth和profiles信息
    const users = [];
    for (const profile of profiles) {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      if (authUser && authUser.email) {
        users.push({
          id: profile.id,
          email: authUser.email,
          nickname: profile.nickname || authUser.email?.split('@')[0] || '球友',
          user_preferences: profile.user_preferences,
          email_notifications: profile.email_notifications
        });
      }
    }

    console.log(`成功构建 ${users.length} 个用户数据`);

    if (users.length === 0) {
      console.log('没有找到有效的用户邮箱');
      return;
    }

  const today = new Date().toISOString().split('T')[0];
  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      console.log(`处理用户: ${user.email} (${user.nickname})`);

      // 检查用户今日是否有练习记录
      const { data: logs } = await supabase
        .from('practice_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .limit(1);

      const hasPracticeToday = logs && logs.length > 0;

      // 生成鼓励语
      const message = hasPracticeToday
        ? `你今天已经练习了，真棒！继续保持～`
        : `今天还没练习哦，Homie 等你！哪怕只是挥拍5分钟也好～`;

      // 发送邮件
      const { data, error: emailError } = await resend.emails.send({
        from: 'Homie AI <onboarding@resend.dev>',
        to: [user.email],
        subject: hasPracticeToday ? '🎾 今日练习打卡成功' : '💪 Homie 的鼓励提醒',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none; }
              .message { font-size: 18px; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎾 你的AI网球搭子</h1>
              <p>测试邮件 · 功能验证</p>
            </div>
            <div class="content">
              <h2>嗨，${user.nickname || '球友'}！</h2>
              <div class="message">
                ${message}
              </div>
              <p>这是产品优化第二阶段的测试邮件，用于验证邮件发送功能是否正常工作。</p>
              <div class="footer">
                <p>🎾 坚持练球，享受网球带来的快乐！</p>
                <p>— 你的AI网球搭子团队</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `嗨，${user.nickname || '球友'}！\n\n${message}\n\n这是产品优化第二阶段的测试邮件，用于验证邮件发送功能是否正常工作。\n\n🎾 坚持练球，享受网球带来的快乐！\n— 你的AI网球搭子团队`,
      });

      if (emailError) {
        console.error(`发送给 ${user.email} 失败:`, emailError);
        failCount++;
      } else {
        console.log(`已发送给 ${user.email}, 邮件ID: ${data?.id}`);
        successCount++;
      }
    } catch (error) {
      console.error(`处理用户 ${user.email} 时出错:`, error);
      failCount++;
    }
  }

  console.log(`\n邮件发送完成:`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`总计: ${users.length}`);
}

sendTestEmails().catch(console.error);