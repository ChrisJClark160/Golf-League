/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const usersId = app.findCollectionByNameOrId("users").id;

    const courses = new Collection({
        type: "base",
        name: "courses",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            { name: "name", type: "text", required: true, max: 200 },
            { name: "location", type: "text", required: false, max: 200 },
            { name: "holes", type: "number", required: true, min: 9, max: 36 },
            { name: "stroke_index_18", type: "json", required: false, maxSize: 2000 },
            { name: "par_per_hole", type: "json", required: false, maxSize: 2000 },
            { name: "par_total", type: "number", required: false, min: 50, max: 90 },
            { name: "external_id", type: "text", required: false, max: 100 },
            {
                name: "data_source",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["uk_golf_api", "manual", "openstreetmap", "unknown"],
            },
            {
                name: "created_by",
                type: "relation",
                required: false,
                collectionId: usersId,
                cascadeDelete: false,
                maxSelect: 1,
            },
            { name: "last_verified_at", type: "date", required: false },
            { name: "created", type: "autodate", onCreate: true },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_courses_name ON courses (name)",
            "CREATE INDEX idx_courses_external_id ON courses (external_id)",
        ],
    });

    return app.save(courses);
}, (app) => {
    const c = app.findCollectionByNameOrId("courses");
    return app.delete(c);
});
