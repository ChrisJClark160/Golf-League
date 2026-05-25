/// <reference path="../pb_data/types.d.ts" />

// Extend the built-in users collection with league-specific fields.
// PocketBase 0.22+ syntax: collection.fields.add(...)
migrate((app) => {
    const users = app.findCollectionByNameOrId("users");

    users.fields.add(new TextField({
        name: "name",
        required: true,
        max: 100,
    }));

    users.fields.add(new TextField({
        name: "nickname",
        required: false,
        max: 50,
    }));

    users.fields.add(new SelectField({
        name: "role",
        required: true,
        maxSelect: 1,
        values: ["player", "deputy", "admin"],
    }));

    users.fields.add(new FileField({
        name: "avatar",
        required: false,
        maxSelect: 1,
        maxSize: 5242880, // 5 MB
        mimeTypes: ["image/jpeg", "image/png", "image/heic", "image/webp"],
    }));

    return app.save(users);
}, (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("name");
    users.fields.removeByName("nickname");
    users.fields.removeByName("role");
    users.fields.removeByName("avatar");
    return app.save(users);
});
