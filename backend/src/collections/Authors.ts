import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
    slug: 'authors',
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
            name: 'avatar',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'is_staff',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            name: 'staff_title',
            type: 'text',
        },
        {
            name: 'bio',
            type: 'textarea',
        },
        {
            name: 'social_links',
            type: 'array',
            fields: [
                {
                    name: 'platform',
                    type: 'select',
                    options: [
                        { label: 'X (Twitter)', value: 'twitter' },
                        { label: 'GitHub', value: 'github' },
                        { label: 'Discord', value: 'discord' },
                        { label: 'Website', value: 'website' },
                        { label: 'Twitch', value: 'twitch' },
                        { label: 'YouTube', value: 'youtube' },
                    ],
                },
                {
                    name: 'url',
                    type: 'text',
                },
            ],
        },
        {
            name: 'playing_games',
            type: 'array',
            fields: [
                {
                    name: 'game',
                    type: 'relationship',
                    relationTo: 'games',
                    required: true,
                },
                {
                    name: 'skill_level',
                    type: 'select',
                    options: [
                        { label: 'Casual', value: 'casual' },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Expert', value: 'expert' },
                        { label: 'Better than you', value: 'better_than_you' },
                    ],
                },
                {
                    name: 'impression',
                    type: 'select',
                    options: [
                        { label: 'Obsessed', value: 'obsessed' },
                        { label: 'Love', value: 'love' },
                        { label: 'Like', value: 'like' },
                        { label: 'Meh', value: 'meh' },
                        { label: 'Give Up', value: 'give_up' },
                    ],
                },
                {
                    name: 'recruitment',
                    type: 'select',
                    options: [
                        { label: 'Looking for Group', value: 'looking_for_group' },
                        { label: 'Invite Anytime', value: 'invite_anytime' },
                        { label: 'Need Hints', value: 'need_hints' },
                        { label: 'Can Teach', value: 'can_teach' },
                        { label: 'Discussion Welcome', value: 'discussion_welcome' },
                    ],
                },
            ]
        },
        {
            name: 'finished_games',
            type: 'array',
            fields: [
                {
                    name: 'game',
                    type: 'relationship',
                    relationTo: 'games',
                    required: true,
                },
                {
                    name: 'skill_level',
                    type: 'select',
                    options: [
                        { label: 'Casual', value: 'casual' },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Expert', value: 'expert' },
                        { label: 'Better than you', value: 'better_than_you' },
                    ],
                },
                {
                    name: 'impression',
                    type: 'select',
                    options: [
                        { label: 'Obsessed', value: 'obsessed' },
                        { label: 'Love', value: 'love' },
                        { label: 'Like', value: 'like' },
                        { label: 'Meh', value: 'meh' },
                        { label: 'Give Up', value: 'give_up' },
                    ],
                },
                {
                    name: 'recruitment',
                    type: 'select',
                    options: [
                        { label: 'Looking for Group', value: 'looking_for_group' },
                        { label: 'Invite Anytime', value: 'invite_anytime' },
                        { label: 'Need Hints', value: 'need_hints' },
                        { label: 'Can Teach', value: 'can_teach' },
                        { label: 'Discussion Welcome', value: 'discussion_welcome' },
                    ],
                },
            ]
        },
    ],
}
