/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const matchesId = app.findCollectionByNameOrId("matches").id;
    const usersId = app.findCollectionByNameOrId("users").id;

    const disputes = new Collection({
        type: "base",
        name: "disputes",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'deputy'",
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
                name: "raised_by",
                type: "relation",
                required: true,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "reason", type: "text", required: true, max: 1000 },
            {
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["open", "resolved", "rejected"],
            },
            {
                name: "resolved_by",
                type: "relation",
                required: false,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "resolution", type: "text", required: false, max: 1000 },
            { name: "created", type: "autodate", onCreate: true },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
            "CREATE INDEX idx_disputes_match ON disputes (match)",
            "CREATE INDEX idx_disputes_status ON disputes (status)",
        ],
    });

    return app.save(disputes);
}, (app) => {
    const c = app.findCollectionByNameOrId("disputes");
    return app.delete(c);
});
