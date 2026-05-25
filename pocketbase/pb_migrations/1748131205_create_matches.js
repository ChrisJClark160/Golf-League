/// <reference path="../pb_data/types.d.ts" />

// A match is a declared 1-on-1 head-to-head within a round.
// Course/date/holes/tees/scorecard live on the round, not duplicated here.
migrate((app) => {
    const roundsId = app.findCollectionByNameOrId("rounds").id;
    const seasonsId = app.findCollectionByNameOrId("seasons").id;
    const usersId = app.findCollectionByNameOrId("users").id;

    const matches = new Collection({
        type: "base",
        name: "matches",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id = player_a || @request.auth.id = player_b || @request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            {
                name: "round",
                type: "relation",
                required: true,
                collectionId: roundsId,
                cascadeDelete: true,
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
            {
                name: "player_a",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            {
                name: "player_b",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "handicap_a", type: "number", required: true, min: 0, max: 54 },
            { name: "handicap_b", type: "number", required: true, min: 0, max: 54 },
            {
                name: "result",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["a_won", "b_won", "draw", "void"],
            },
            // Free-text margin: "2&1", "4&3", "1up", "halved", "no-show", "weather-13"
            { name: "margin", type: "text", required: true, max: 30 },
            { name: "stableford_a", type: "number", required: false, min: 0, max: 90 },
            { name: "stableford_b", type: "number", required: false, min: 0, max: 90 },
            {
                name: "confirmed_by",
                type: "relation",
                required: false,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "confirmed_at", type: "date", required: false },
            {
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["pending", "confirmed", "disputed", "void"],
            },
            { name: "match_notes", type: "text", required: false, max: 500 },
            { name: "created", type: "autodate", onCreate: true },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
            "CREATE INDEX idx_matches_round ON matches (round)",
            "CREATE INDEX idx_matches_season ON matches (season)",
            "CREATE INDEX idx_matches_status ON matches (status)",
            "CREATE INDEX idx_matches_players ON matches (player_a, player_b)",
        ],
    });

    return app.save(matches);
}, (app) => {
    const c = app.findCollectionByNameOrId("matches");
    return app.delete(c);
});
