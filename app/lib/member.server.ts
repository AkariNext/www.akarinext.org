import { z } from 'zod';
import membersYamlFile from '../../data/members.yaml?raw'
import yaml from "yaml"
import type { PickType } from './helper.server';

const memberRoleEnum = z.enum([
    "mod",
    "dev",
    "designer",
])


const memberSchema = z.object({
    name: z.string(),
    avatar: z.string(),
    socials: z.array(z.object({
        type: z.string(),
        url: z.string(),
        alt: z.string().optional()
    })),
    roles: z.array(
        memberRoleEnum
    )
})

const omitRoleSchema = memberSchema.omit({ roles: true })

export type TMember = z.infer<typeof omitRoleSchema> & { roles: string[] }

const roleMap: { [key in z.infer<typeof memberRoleEnum>]: string } = {
    mod: "🪄 Mod",
    dev: '🛠️ Dev',
    designer: '🎨 Designer'
}

function convertDecoratedRoles(roles: PickType<z.infer<typeof memberSchema>, "roles">): string[] {
    return roles.map(r => roleMap[r])
}

function validateMember(member: any[]): TMember[] {
    const members: TMember[] = []
    for (const m of member) {
        const result = memberSchema.safeParse(m)
        if (result.success === false) {
            console.error("Invalid member data", result.error.flatten().fieldErrors)
            throw new Error("Invalid member data")
        }
        members.push({ ...result.data, roles: convertDecoratedRoles(result.data.roles) })
    }

    return members
}

export const MEMBERS: TMember[] = validateMember(yaml.parse(membersYamlFile))

export function getAuthor(name: string) {
    return MEMBERS.find((m) => m.name === name);
}