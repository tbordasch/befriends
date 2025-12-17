-- ============================================
-- Get Table Structure (Columns only)
-- Run this in Supabase SQL Editor
-- Copy the results and send them to me
-- ============================================

-- Get all columns for each table with details
SELECT 
  t.table_name AS "Table Name",
  c.column_name AS "Column Name",
  c.data_type AS "Data Type",
  CASE 
    WHEN c.data_type = 'character varying' THEN CAST(c.character_maximum_length AS TEXT)
    WHEN c.data_type = 'numeric' THEN CAST(c.numeric_precision AS TEXT) || ',' || CAST(c.numeric_scale AS TEXT)
    ELSE NULL
  END AS "Type Details",
  c.is_nullable AS "Nullable",
  c.column_default AS "Default Value",
  c.ordinal_position AS "Position"
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND c.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

