-- Rename notes column to delivery_note for consistency with code
ALTER TABLE orders 
RENAME COLUMN notes TO delivery_note;