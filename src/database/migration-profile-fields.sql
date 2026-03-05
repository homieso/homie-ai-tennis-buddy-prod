-- Tennis Journey 用户资料字段扩展迁移脚本
-- 请在 Supabase SQL 编辑器中执行此脚本，以支持对话式注册流程

-- 1. 为 profiles 表添加昵称字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT;

COMMENT ON COLUMN public.profiles.nickname IS '用户昵称';

-- 2. 为 profiles 表添加年龄字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age INTEGER;

COMMENT ON COLUMN public.profiles.age IS '用户年龄';

-- 3. 将 playing_years 字段改为 TEXT 类型以支持文本描述（如"3个月"、"一年"）
-- 注意：先备份数据，然后修改列类型
-- 由于 playing_years 可能已有数据，我们创建新列并迁移数据
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS playing_years_text TEXT;

-- 将现有的数字转换为文本（例如 2 -> '2年'）
UPDATE public.profiles
SET playing_years_text =
  CASE
    WHEN playing_years IS NULL THEN NULL
    WHEN playing_years = 0 THEN '刚刚开始'
    WHEN playing_years = 1 THEN '1年'
    ELSE playing_years::TEXT || '年'
  END;

-- 删除旧列（可选，如果需要保留兼容性，可以跳过此步骤）
-- ALTER TABLE public.profiles DROP COLUMN playing_years;

-- 重命名新列为 playing_years
ALTER TABLE public.profiles
RENAME COLUMN playing_years_text TO playing_years;

-- 4. 为 profiles 表添加给 Homie 的留言字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS message_to_homie TEXT;

COMMENT ON COLUMN public.profiles.message_to_homie IS '用户给 Homie 的留言';

-- 5. 更新 database.types.ts 类型定义（需手动更新）
-- 需要在 src/lib/database.types.ts 文件中更新：
-- 1) 在 profiles 表的 Row、Insert、Update 接口中添加：
--    nickname?: string | null
--    age?: number | null
--    playing_years?: string | null  -- 从 number 改为 string
--    message_to_homie?: string | null