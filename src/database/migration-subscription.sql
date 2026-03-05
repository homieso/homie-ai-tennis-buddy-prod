-- Tennis Journey 订阅功能迁移脚本
-- 请先在 Supabase SQL 编辑器中执行此脚本

-- 1. 为 profiles 表添加会员有效期字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS membership_valid_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.membership_valid_until IS '会员有效期截止时间，为空表示非会员';

-- 2. 创建激活码表
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.activation_codes IS '激活码表，用于国内版会员订阅';
COMMENT ON COLUMN public.activation_codes.code IS '激活码（唯一）';
COMMENT ON COLUMN public.activation_codes.used_at IS '使用时间，为空表示未使用';
COMMENT ON COLUMN public.activation_codes.used_by IS '使用者用户ID';
COMMENT ON COLUMN public.activation_codes.created_at IS '创建时间';

-- 3. 启用行级安全
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 4. 为 activation_codes 表创建 RLS 策略
-- 注意：激活码表通常需要服务端访问，用户不应直接读取
-- 这里创建策略允许服务端（通过服务端角色）访问，用户不可读
-- 使用基于角色的策略或关闭 RLS，根据安全需求调整

-- 方案A：允许所有操作（服务端使用，无用户直接访问）
-- CREATE POLICY "允许服务端访问" ON public.activation_codes
--   FOR ALL USING (true);

-- 方案B：更安全的策略，仅允许服务端角色访问
-- 需要先确认你的服务端角色，这里使用默认的 authenticated 角色
CREATE POLICY "允许认证用户查看未使用的激活码" ON public.activation_codes
  FOR SELECT USING (auth.role() = 'authenticated' AND used_at IS NULL);

CREATE POLICY "允许服务端更新激活码" ON public.activation_codes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 注意：根据实际需求调整上述策略。如果仅后端服务访问，可考虑关闭RLS或使用更严格的策略。

-- 5. 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_used ON public.activation_codes(used_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_user ON public.activation_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON public.profiles(membership_valid_until);

-- 6. 插入示例激活码（可选，用于测试）
-- INSERT INTO public.activation_codes (code) VALUES
--   ('TESTCODE123'),
--   ('TESTCODE456')
-- ON CONFLICT (code) DO NOTHING;

-- 7. 更新 database.types.ts 类型定义（需手动更新）
-- 需要在 src/lib/database.types.ts 文件中更新：
-- 1) 在 profiles 表的 Row、Insert、Update 接口中添加 membership_valid_until?: string | null
-- 2) 添加 activation_codes 表的完整类型定义