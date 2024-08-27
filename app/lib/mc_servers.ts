import mcServersYamlFile from '../../data/mc_servers.yaml?raw';
import yaml from 'yaml';

export interface IMCServer {
	name: string;
	address: string;
	port: number;
	type?: 'java' | 'bedrock';
}

export const MC_SERVERS: IMCServer[] = yaml.parse(mcServersYamlFile);
