import type { Schema, Struct } from '@strapi/strapi';

export interface AuthorFinishedGame extends Struct.ComponentSchema {
  collectionName: 'components_author_finished_games';
  info: {
    displayName: 'Finished Game';
  };
  attributes: {
    game: Schema.Attribute.Relation<'oneToOne', 'api::game.game'>;
    impression: Schema.Attribute.Enumeration<
      ['obsessed', 'love', 'like', 'meh', 'give_up']
    >;
    recruitment: Schema.Attribute.Enumeration<
      [
        'looking_for_group',
        'invite_anytime',
        'need_hints',
        'can_teach',
        'discussion_welcome',
      ]
    >;
    skill_level: Schema.Attribute.Enumeration<
      ['casual', 'intermediate', 'expert', 'better_than_you']
    >;
  };
}

export interface AuthorPlayingGame extends Struct.ComponentSchema {
  collectionName: 'components_author_playing_games';
  info: {
    displayName: 'Playing Game';
  };
  attributes: {
    game: Schema.Attribute.Relation<'oneToOne', 'api::game.game'>;
    impression: Schema.Attribute.Enumeration<
      ['obsessed', 'love', 'like', 'meh', 'give_up']
    >;
    recruitment: Schema.Attribute.Enumeration<
      [
        'looking_for_group',
        'invite_anytime',
        'need_hints',
        'can_teach',
        'discussion_welcome',
      ]
    >;
    skill_level: Schema.Attribute.Enumeration<
      ['casual', 'intermediate', 'expert', 'better_than_you']
    >;
  };
}

export interface AuthorSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_author_social_links';
  info: {
    displayName: 'Social Link';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['twitter', 'github', 'discord', 'website', 'twitch', 'youtube']
    >;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'author.finished-game': AuthorFinishedGame;
      'author.playing-game': AuthorPlayingGame;
      'author.social-link': AuthorSocialLink;
    }
  }
}
