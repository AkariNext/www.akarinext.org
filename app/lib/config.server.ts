import configYamlFile from '../../data/config.yaml?raw';
import yaml from 'yaml';

export interface TConfig {
	footer: {
		links: {
			type: string;
			link: string;
			alt?: string;
		}[];
	};
}

export const CONFIG: TConfig = yaml.parse(configYamlFile);
