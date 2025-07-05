## Database Structure

### Tables Overview:

- **bounty_forms**: Main form metadata (name, dates, rewards, etc.)
- **form_questions**: Individual questions with their types and options
- **form_responses**: User submissions to forms
- **question_answers**: Individual answers within each submission

### Key Features:

- ✅ **UUID Primary Keys** for security
- ✅ **Foreign Key Constraints** for data integrity
- ✅ **Check Constraints** for data validation
- ✅ **Indexes** for query performance
- ✅ **Row Level Security** for access control
- ✅ **Auto-updated timestamps**
- ✅ **Cascading deletes** to prevent orphaned data

## Setup Instructions

### For New Databases:

1. Run `schema.sql` or `schema-safe.sql` (if schema already exists)

### For Existing Databases:

Run the migration files in this order:

1. **Required Migrations:**

   ```sql
   -- Run in Supabase SQL Editor:
   \i add-updated-at-to-responses.sql
   \i fix-creator-id-type.sql
   ```

2. **Optional Migrations (if needed):**
   ```sql
   \i add-user-profiles.sql
   \i add-user-eligibility.sql
   \i add-separate-token-rewards.sql
   \i add-payment-table.sql
   \i add-featured-column.sql
   ```

### Recent Fixes:

- ✅ Fixed missing `updated_at` column in `form_responses` table
- ✅ Updated `creator_id` from UUID to VARCHAR(100) for wallet addresses
- ✅ Added proper triggers for auto-updating timestamps
- ✅ Added indexes for better query performance

## Security Notes - TODO

- The current RLS policies allow all operations for development
- In production, you should:
  - Implement proper user authentication
  - Restrict form creation to authenticated users
  - Allow only form owners to edit their forms
  - Control who can view private forms

## Troubleshooting

### Common Issues:

1. **"column updated_at does not exist"**

   - Run: `add-updated-at-to-responses.sql`

2. **"invalid input syntax for type uuid"** (creator_id)

   - Run: `fix-creator-id-type.sql`

3. **Missing tables or columns**
   - For new setup: Use `schema.sql`
   - For existing: Use `schema-safe.sql`
