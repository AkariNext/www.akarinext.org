import type { CollectionConfig } from 'payload'

export const Games: CollectionConfig = {
    slug: 'games',
    admin: {
        useAsTitle: 'name',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'cover_image',
            type: 'upload',
            relationTo: 'media',
        },
    ],
}
