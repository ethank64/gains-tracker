use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Schema for the local SQLite database. Migrations run automatically when
    // the frontend calls Database.load("sqlite:gains.db").
    let migrations = vec![Migration {
        version: 1,
        description: "create macro and workout tables",
        sql: "
            CREATE TABLE IF NOT EXISTS targets (
                id          INTEGER PRIMARY KEY,
                bodyweight  REAL,
                goal_weight REAL,
                calories    REAL,
                protein     REAL,
                carbs       REAL,
                fat         REAL
            );
            CREATE TABLE IF NOT EXISTS foods (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT NOT NULL,
                calories REAL,
                protein  REAL,
                carbs    REAL,
                fat      REAL
            );
            CREATE TABLE IF NOT EXISTS food_log (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                date     TEXT NOT NULL,
                name     TEXT,
                qty      REAL,
                calories REAL,
                protein  REAL,
                carbs    REAL,
                fat      REAL
            );
            CREATE TABLE IF NOT EXISTS workout_log (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                date     TEXT NOT NULL,
                exercise TEXT,
                sets     INTEGER,
                reps     INTEGER,
                weight   REAL
            );
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:gains.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
