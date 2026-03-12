import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['name', 'avatar', 'bio', 'is_staff', 'staff_title', 'social_links', 'playing_games', 'finished_games'],
      },
    },
  },
});

export default config;
