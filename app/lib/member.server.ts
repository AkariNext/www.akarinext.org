import membersYamlFile from '../../data/members.yaml?raw'
import yaml from "yaml"

interface TMember {
    name: string;
    avatar: string;
    socials: {
        type: string;
        url: string;
        alt?: string;
    }[];
    roles: string[];
}

export const MEMBERS: TMember[] = yaml.parse(membersYamlFile);
