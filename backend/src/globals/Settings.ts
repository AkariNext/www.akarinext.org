import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
    slug: 'settings',
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'site_title',
            type: 'text',
        },
        {
            name: 'site_description',
            type: 'textarea',
        },
        {
            name: 'site_logo',
            type: 'upload',
            relationTo: 'media',
        },
    ],
}
