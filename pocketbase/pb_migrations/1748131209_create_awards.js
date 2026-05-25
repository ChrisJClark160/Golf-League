/// <reference path="../pb_data/types.d.ts" />

// Awards calculated at season end. Six awards in Season 0 + Wooden Spoon.
migrate((app) => {
    const seasonsId = app.findCollectionByNameOrId("seasons").id;
    const usersId = app.findCollectionByNameOrId("users").id;

    const awards = new Collection({
        type: "base",
        name: "awards",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            {
                name: "season",
                type: "relation",
                required: true,
                collectionId: seasonsId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            {
                name: "award_name",
                type: "select",
                required: true,
                maxSelect: 1,
                values: [
                    "league_champion",
                    "tour_champion",
                    "most_improved",
                    "most_social",
                    "most_active",
                    "underdog",
                    "wooden_spoon",
                ],
            },
            {
                name: "winner",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            // Headline number for the award e.g. "23 points" or "2.0 ppm" or "4&3 vs 28-shot diff"
            { name: "value", type: "text", required: false, max: 100 },
            { name: "notes", type: "text", required: false, max: 500 },
            { name: "created", type: "autodate", onCreate: true },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_awards_unique ON awards (season, award_name)",
            "CREATE INDEX idx_awards_winner ON awards (winner)",
        ],
    });

    return app.save(awards);
}, (app) => {
    const c = app.findCollectionByNameOrId("awards");
    return app.delete(c);
});
