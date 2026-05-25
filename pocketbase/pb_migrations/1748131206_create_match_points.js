/// <reference path="../pb_data/types.d.ts" />

// Denormalised points per match per player. Populated by a PocketBase hook
// on match confirmation. The league table query becomes a simple SUM over this.
migrate((app) => {
    const matchesId = app.findCollectionByNameOrId("matches").id;
    const usersId = app.findCollectionByNameOrId("users").id;
    const seasonsId = app.findCollectionByNameOrId("seasons").id;

    const matchPoints = new Collection({
        type: "base",
        name: "match_points",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: null, // only writable by hooks (with elevated privileges)
        updateRule: null,
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            {
                name: "match",
                type: "relation",
                required: true,
                collectionId: matchesId,
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
            {
                name: "season",
                type: "relation",
                required: true,
                collectionId: seasonsId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "base_points", type: "number", required: true, min: 0, max: 3 },
            { name: "new_opponent_bonus", type: "number", required: true, min: 0, max: 1 },
            { name: "close_rematch_bonus", type: "number", required: true, min: 0, max: 1 },
            { name: "total_points", type: "number", required: true, min: 0, max: 5 },
            { name: "counted", type: "bool", required: true },
            { name: "created", type: "autodate", onCreate: true },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_match_points_unique ON match_points (match, player)",
            "CREATE INDEX idx_match_points_season_player ON match_points (season, player)",
        ],
    });

    return app.save(matchPoints);
}, (app) => {
    const c = app.findCollectionByNameOrId("match_points");
    return app.delete(c);
});
