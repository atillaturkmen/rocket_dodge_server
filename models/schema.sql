BEGIN TRANSACTION;
ALTER TABLE "rocket_dodge" RENAME TO "rocket_dodge_legacy";
CREATE TABLE IF NOT EXISTS "rocket_dodge" (
	"username"	TEXT UNIQUE,
	"pc_score"	INTEGER,
	"mobile_score"	INTEGER,
	"pc_score_ip"	TEXT,
	"mobile_score_ip"	TEXT,
	"pc_score_time"	TEXT,
	"mobile_score_time"	TEXT,
	"pc_score_replay"	BLOB,
	"mobile_score_replay"	BLOB,
	PRIMARY KEY("username"),
	FOREIGN KEY("username") REFERENCES "accounts"
);
CREATE TABLE IF NOT EXISTS "touch_dodge" (
	"username"	CHAR(128),
	"pc_score"	INTEGER,
	"mobile_score"	INTEGER,
	"pc_score_ip"	TEXT,
	"mobile_score_ip"	TEXT,
	"pc_score_time"	TEXT,
	"mobile_score_time"	TEXT,
	PRIMARY KEY("username"),
	FOREIGN KEY("username") REFERENCES "accounts"("username")
);
CREATE TABLE IF NOT EXISTS "rocket_dodge_legacy" (
	"username"	CHAR(128),
	"pc_score"	INTEGER,
	"mobile_score"	INTEGER,
	"pc_score_ip"	TEXT,
	"mobile_score_ip"	TEXT,
	"pc_score_time"	TEXT,
	"mobile_score_time"	TEXT,
	PRIMARY KEY("username"),
	FOREIGN KEY("username") REFERENCES "accounts"("username")
);
CREATE TABLE IF NOT EXISTS "hold_dodge_accelerated" (
	"username"	CHAR(128),
	"pc_score"	INTEGER,
	"mobile_score"	INTEGER,
	"pc_score_ip"	TEXT,
	"mobile_score_ip"	TEXT,
	"pc_score_time"	TEXT,
	"mobile_score_time"	TEXT,
	PRIMARY KEY("username"),
	FOREIGN KEY("username") REFERENCES "accounts"("username")
);
CREATE TABLE IF NOT EXISTS "hold_dodge" (
	"username"	CHAR(128),
	"pc_score"	INTEGER,
	"mobile_score"	INTEGER,
	"pc_score_ip"	TEXT,
	"mobile_score_ip"	TEXT,
	"pc_score_time"	TEXT,
	"mobile_score_time"	TEXT,
	PRIMARY KEY("username"),
	FOREIGN KEY("username") REFERENCES "accounts"("username")
);
CREATE TABLE IF NOT EXISTS "auth_tokens" (
	"selector"	char(12),
	"hashedValidator"	char(128),
	"username"	CHAR(128),
	"expires"	datetime,
	PRIMARY KEY("selector")
);
CREATE TABLE IF NOT EXISTS "accounts" (
	"username"	CHAR(128),
	"password"	CHAR(128),
	PRIMARY KEY("username")
);
COMMIT;
