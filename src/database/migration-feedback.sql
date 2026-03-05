-- 创建反馈表
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 允许用户插入自己的反馈（认证用户）
CREATE POLICY "用户可以插入自己的反馈" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许管理员查看所有反馈（可选，先不创建）
-- CREATE POLICY "管理员可以查看所有反馈" ON public.feedback
--   FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');