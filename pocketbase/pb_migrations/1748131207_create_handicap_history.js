/// <reference path="../pb_data/types.d.ts" />

// Audit trail of every handicap change. Players can see why they're on X handicap.
migrate((app) => {
    const usersId = app.findCollectionByNameOrId("users").id;
    const seasonsId = app.findCollectionByNameOrId("seasons").id;
    const matchesId = app.findCollectionByNameOrId("matches").id;

    const handicapHistory = new Collection({
        type: "base",
        name: "handicap_history",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: null, // only writable by hooks or admin
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            {
                name: "player",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            {
                name: "season",
                type: "relation",
                required: true,
                collectionId: seasonsId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "change_date", type: "date", required: true },
            { name: "old_handicap", type: "number", required: true, min: 0, max: 54 },
            { name: "new_handicap", type: "number", required: true, min: 0, max: 54 },
            {
                name: "reason",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["heavy_margin", "sunday_streak", "admin", "season_start"],
            },
            {
                name: "match",
                type: "relation",
                required: false,
                collectionId: matchesId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "notes", type: "text", required: false, max: 500 },
            { name: "created", type: "autodate", onCreate: true },
        ],
        indexes: [
            "CREATE INDEX idx_handicap_history_player_date ON handicap_history (player, change_date)",
            "CREATE INDEX idx_handicap_history_season ON handicap_history (season)",
        ],
    });

    return app.save(handicapHistory);
}, (app) => {
    const c = app.findCollectionByNameOrId("handicap_history");
    return app.delete(c);
});
