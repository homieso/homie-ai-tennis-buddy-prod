-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles 表（关联 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  gender TEXT,
  playing_years INTEGER,
  self_rated_ntrp DECIMAL(2,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. weekly_goals 表
CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  next_lesson_time TIMESTAMP WITH TIME ZONE,
  confusion TEXT,
  core_goal TEXT,
  micro_exercises TEXT[],
  emotion_reminder TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. practice_logs 表
CREATE TABLE IF NOT EXISTS public.practice_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  coach_content TEXT,
  best_shot TEXT,
  worst_shot TEXT,
  ai_companion_log TEXT,
  next_reminder TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. risk_assessments 表（可选，用于记录风险评分）
CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  last_active_date DATE,
  triggered_intervention BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- profiles: 用户只能查看和更新自己的档案
CREATE POLICY "用户可以查看自己的档案" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的档案" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可以插入自己的档案" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- weekly_goals: 用户只能操作自己的记录
CREATE POLICY "用户可以查看自己的周目标" ON public.weekly_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以插入自己的周目标" ON public.weekly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的周目标" ON public.weekly_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的周目标" ON public.weekly_goals
  FOR DELETE USING (auth.uid() = user_id);

-- practice_logs: 同理
CREATE POLICY "用户可以查看自己的练习日志" ON public.practice_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以插入自己的练习日志" ON public.practice_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的练习日志" ON public.practice_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的练习日志" ON public.practice_logs
  FOR DELETE USING (auth.uid() = user_id);

-- risk_assessments: 同理
CREATE POLICY "用户可以查看自己的风险评估" ON public.risk_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以插入自己的风险评估" ON public.risk_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的风险评估" ON public.risk_assessments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的风险评估" ON public.risk_assessments
  FOR DELETE USING (auth.uid() = user_id);

-- 可选：创建索引提升性能
CREATE INDEX idx_weekly_goals_user_week ON public.weekly_goals(user_id, week_start_date);
CREATE INDEX idx_practice_logs_user_date ON public.practice_logs(user_id, log_date);
CREATE INDEX idx_risk_assessments_user ON public.risk_assessments(user_id);

-- 触发器：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();