/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const seasonsId = app.findCollectionByNameOrId("seasons").id;
    const usersId = app.findCollectionByNameOrId("users").id;

    const seasonPlayers = new Collection({
        type: "base",
        name: "season_players",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin' || @request.auth.id = player",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            {
                name: "season",
                type: "relation",
                required: true,
                collectionId: seasonsId,
                cascadeDelete: true,
                maxSelect: 1,
            },
            {
                name: "player",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "starting_handicap", type: "number", required: true, min: 4, max: 42 },
            { name: "current_handicap", type: "number", required: true, min: 4, max: 42 },
            {
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["active", "inactive", "pending"],
            },
            { name: "joined_at", type: "date", required: false },
            { name: "committed", type: "bool", required: false },
            { name: "created", type: "autodate", onCreate: true },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_season_players_unique ON season_players (season, player)",
            "CREATE INDEX idx_season_players_player ON season_players (player)",
        ],
    });

    return app.save(seasonPlayers);
}, (app) => {
    const c = app.findCollectionByNameOrId("season_players");
    return app.delete(c);
});
