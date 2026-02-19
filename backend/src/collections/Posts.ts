import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
    slug: 'posts',
    admin: {
        useAsTitle: 'title',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            unique: true,
            index: true,
        },
        {
            name: 'content',
            type: 'richText',
        },
        {
            name: 'author',
            type: 'relationship',
            relationTo: 'authors',
        },
        {
            name: 'published_date',
            type: 'date',
        },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: 'Technology', value: 'tech' },
                { label: 'Game', value: 'game' },
                { label: 'Misc', value: 'misc' },
            ],
            required: true,
            defaultValue: 'game',
        },
        {
            name: 'tags',
            type: 'array',
            fields: [
                {
                    name: 'tag',
                    type: 'text',
                },
            ],
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
            ],
            defaultValue: 'draft',
        },
    ],
}
