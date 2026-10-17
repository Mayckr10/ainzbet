/**
 * Postgres local para desenvolvimento (sem instalar nada).
 * Uso: npm run localdb   →   DATABASE_URL=postgres://postgres:postgres@localhost:5433/cassino
 */
import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: process.env.LOCALDB_DIR ?? "./.localdb",
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
});

const fresh = !(await import("node:fs")).existsSync(`${process.env.LOCALDB_DIR ?? "./.localdb"}/PG_VERSION`);
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("cassino");
console.log("Postgres local pronto: postgres://postgres:postgres@localhost:5433/cassino");
process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
setInterval(() => {}, 1 << 30);
