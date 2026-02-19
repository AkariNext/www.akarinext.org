import type { CollectionConfig } from 'payload'

export const GameServers: CollectionConfig = {
    slug: 'game-servers',
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
            name: 'type',
            type: 'select',
            options: [
                { label: 'Minecraft', value: 'minecraft' },
                { label: 'Web Service', value: 'web' },
                { label: 'Other', value: 'other' },
            ],
            required: true,
        },
        {
            name: 'ip',
            type: 'text',
            required: true,
        },
        {
            name: 'port',
            type: 'number',
            required: true,
            defaultValue: 25565,
        },
        {
            name: 'protocol',
            type: 'text',
            defaultValue: 'TCP',
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
            ],
            defaultValue: 'published',
        },
    ],
}
