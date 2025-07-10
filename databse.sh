psql -U postgres -d crm_database -f drop_tables.sql
psql -U postgres -d crm_database -f schema.sql
psql -U postgres -d crm_database -f data.sql