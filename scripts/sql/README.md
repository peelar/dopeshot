# SQL Scripts

This folder contains ad-hoc SQL scripts you can run via the shared runner.

## Run a script

```bash
./scripts/sql/run.sh staging upgrade-brand-user.sql --email user@example.com
```

## Admin promotion

```bash
./scripts/sql/run.sh staging promote-admin-user.sql --email user@example.com
```

## Add a new script

1. Add a new `.sql` file in this folder.
2. Use psql variables for inputs (for example `:'email'`).
3. Run it with `./scripts/sql/run.sh <env> <script> --var key=value`.

## Notes

- The runner resolves connection URLs from env files or shell vars, similar to `scripts/migrate.sh`.
- For prod, set `PROD_SQL_CONFIRMED=yes` before running.
