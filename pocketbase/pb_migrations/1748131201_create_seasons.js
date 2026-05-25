/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const seasons = new Collection({
        type: "base",
        name: "seasons",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            { name: "name", type: "text", required: true, max: 100 },
            { name: "start_date", type: "date", required: true },
            { name: "end_date", type: "date", required: true },
            {
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["upcoming", "active", "locked", "archived"],
            },
            { name: "qualifying_matches", type: "number", required: true, min: 1 },
            { name: "qualifying_opponents", type: "number", required: true, min: 1 },
            { name: "max_matches_per_opponent", type: "number", required: true, min: 1 },
            { name: "close_rematch_starts_week", type: "number", required: true, min: 1 },
            { name: "inactive_deadline_week", type: "number", required: true, min: 1 },
            { name: "created", type: "autodate", onCreate: true },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_seasons_name ON seasons (name)",
            "CREATE INDEX idx_seasons_status ON seasons (status)",
        ],
    });

    return app.save(seasons);
}, (app) => {
    const seasons = app.findCollectionByNameOrId("seasons");
    return app.delete(seasons);
});
