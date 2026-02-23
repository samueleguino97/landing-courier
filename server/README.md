To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## Postgres

The API now requires a Postgres database.

Set `DATABASE_URL` before starting the server, for example:

```sh
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/courier"
```

If you are running local Postgres and the DB does not exist yet:

```sh
createdb courier
```

On boot, the API creates required tables automatically.

To seed demo data (flights + quotes + orders):

```sh
bun run seed
```
