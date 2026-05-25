/// <reference path="../pb_data/types.d.ts" />

// The `rounds` collection is the v2 architecture change.
// A round is "we went to a course on a day and played", and 1-3 matches sit inside it.
// Even a 1-on-1 match is a round of 2 with a single match inside.
migrate((app) => {
    const seasonsId = app.findCollectionByNameOrId("seasons").id;
    const coursesId = app.findCollectionByNameOrId("courses").id;
    const usersId = app.findCollectionByNameOrId("users").id;

    const rounds = new Collection({
        type: "base",
        name: "rounds",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id = submitted_by || @request.auth.role = 'admin'",
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
                name: "course",
                type: "relation",
                required: true,
                collectionId: coursesId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "date_played", type: "date", required: true },
            {
                name: "holes",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["9", "18"],
            },
            {
                name: "tee_colour",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["white", "yellow", "red", "blue", "other"],
            },
            { name: "group_size", type: "number", required: true, min: 2, max: 4 },
            {
                name: "group_players",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                minSelect: 2,
                maxSelect: 4,
            },
            {
                name: "scorecard",
                type: "file",
                required: false,
                maxSelect: 1,
                maxSize: 5242880, // 5 MB
                mimeTypes: ["image/jpeg", "image/png", "image/heic", "image/webp"],
            },
            { name: "notes", type: "text", required: false, max: 1000 },
            {
                name: "submitted_by",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "submitted_at", type: "autodate", onCreate: true },
            {
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["pending", "confirmed", "partially_disputed", "void"],
            },
            { name: "created", type: "autodate", onCreate: true },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
            "CREATE INDEX idx_rounds_season_date ON rounds (season, date_played)",
            "CREATE INDEX idx_rounds_submitted_by ON rounds (submitted_by)",
            "CREATE INDEX idx_rounds_status ON rounds (status)",
        ],
    });

    return app.save(rounds);
}, (app) => {
    const c = app.findCollectionByNameOrId("rounds");
    return app.delete(c);
});
