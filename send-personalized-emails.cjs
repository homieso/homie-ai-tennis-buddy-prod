require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// 测试邮箱，不发送
const TEST_EMAIL = 'suhaoming010@qq.com';

// 生成个性化鼓励语
function generatePersonalizedEncouragement(user, hasPracticeToday) {
  const { nickname = '球友', age_range, playing_years_range, user_preferences = [] } = user;

  let message = '';

  if (hasPracticeToday) {
    message = `你今天已经练习了，真棒！继续保持～`;
  } else {
    message = `今天还没练习哦，Homie 等你！哪怕只是挥拍5分钟也好～`;
  }

  // 根据年龄范围添加个性化内容
  if (age_range) {
    if (age_range === '18岁以下') {
      message += ' 年轻就是资本，多练习会有很大进步！';
    } else if (age_range === '18-25岁') {
      message += ' 大学时期是提升球技的黄金时间，好好把握！';
    } else if (age_range === '25-35岁') {
      message += ' 工作之余打打球，既能锻炼身体又能放松心情！';
    } else if (age_range === '35岁以上') {
      message += ' 年龄不是问题，享受网球带来的乐趣最重要！';
    }
  }

  // 根据球龄范围添加个性化内容
  if (playing_years_range) {
    if (playing_years_range === '0-1年') {
      message += ' 刚开始打网球？坚持就是胜利，每天进步一点点！';
    } else if (playing_years_range === '1-3年') {
      message += ' 已经有些基础了，继续巩固技术，你会越来越强！';
    } else if (playing_years_range === '3-5年') {
      message += ' 三年以上的球龄，已经是资深球友了，保持热情！';
    } else if (playing_years_range === '5年以上') {
      message += ' 五年以上的老手了，网球已经成为生活的一部分了吧！';
    }
  }

  // 根据用户偏好添加提示
  if (Array.isArray(user_preferences) && user_preferences.length > 0) {
    if (user_preferences.includes('提醒练球')) {
      message += ' 别忘了设定每日提醒，坚持练习才能看到进步！';
    }
    if (user_preferences.includes('分析动作视频')) {
      message += ' 想分析你的动作视频？Homie可以帮你！';
    }
    if (user_preferences.includes('约球友')) {
      message += ' 想找球友一起练习？告诉我你的需求！';
    }
    if (user_preferences.includes('解答疑惑')) {
      message += ' 有任何网球相关问题，随时问我！';
    }
  }

  return message;
}

async function sendPersonalizedEmails() {
  console.log('开始发送个性化邮件...');
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

    // 获取所有profiles（不限制email_notifications）
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nickname, age_range, playing_years_range, user_preferences, email_notifications');

    if (profilesError) {
      console.error('查询profiles失败:', profilesError);
      throw profilesError;
    }

    console.log(`找到 ${profiles?.length || 0} 个用户档案`);

    if (!profiles || profiles.length === 0) {
      console.log('没有找到用户档案');
      return;
    }

    // 构建用户列表，合并auth和profiles信息，排除测试邮箱
    const users = [];
    for (const profile of profiles) {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      if (authUser && authUser.email && authUser.email !== TEST_EMAIL) {
        users.push({
          id: profile.id,
          email: authUser.email,
          nickname: profile.nickname || authUser.email?.split('@')[0] || '球友',
          age_range: profile.age_range,
          playing_years_range: profile.playing_years_range,
          user_preferences: profile.user_preferences,
          email_notifications: profile.email_notifications
        });
      }
    }

    console.log(`成功构建 ${users.length} 个用户数据（已排除测试邮箱 ${TEST_EMAIL}）`);

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

        // 生成个性化鼓励语
        const message = generatePersonalizedEncouragement(user, hasPracticeToday);

        // 设置发件人
        const from = 'Homie <noreply@tennisjourney.top>';
        // 如果域名未验证，使用Resend测试发件人作为后备
        // const from = 'Homie AI <onboarding@resend.dev>';

        // 邮件主题
        const subject = hasPracticeToday
          ? '🎾 今日练习打卡成功'
          : '💪 Homie 的鼓励提醒';

        // 发送邮件
        const { data, error: emailError } = await resend.emails.send({
          from,
          to: [user.email],
          subject,
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
                <p>个性化鼓励 · 每日陪伴</p>
              </div>
              <div class="content">
                <h2>嗨，${user.nickname || '球友'}！</h2>
                <div class="message">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <p>今天有什么网球计划吗？无论是练习发球、对打还是观看比赛，每一步都在让你变得更强！</p>
                <div class="footer">
                  <p>💡 提示：你可以在设置中调整邮件通知频率</p>
                  <p>🎾 坚持练球，享受网球带来的快乐！</p>
                  <p>— 你的AI网球搭子 Homie</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `嗨，${user.nickname || '球友'}！\n\n${message}\n\n今天有什么网球计划吗？无论是练习发球、对打还是观看比赛，每一步都在让你变得更强！\n\n💡 提示：你可以在设置中调整邮件通知频率\n🎾 坚持练球，享受网球带来的快乐！\n— 你的AI网球搭子 Homie`,
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
  } catch (error) {
    console.error('发送邮件过程中出现错误:', error);
  }
}

sendPersonalizedEmails().catch(console.error);