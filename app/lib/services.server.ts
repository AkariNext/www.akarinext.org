import ServiceYamlFile from '../../data/services.yaml?raw';
import yaml from 'yaml';

export interface TService {
	name: string;
	description: string;
	thumbnailUrl: string;
}

export const SERVICES: TService[] = yaml.parse(ServiceYamlFile);
