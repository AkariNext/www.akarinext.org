import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { IconBrandDiscord, IconBrandGithub, IconBrandSteam, IconWorld } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { MEMBERS } from "~/lib/member.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export function loader() {
  return json({ members: MEMBERS });
}

function getMemberSocialIcon(type: string) {
  switch (type) {
    case "discord":
      return <IconBrandDiscord />;
    case "github":
      return <IconBrandGithub />;
    case "steam":
      return <IconBrandSteam />;
    default:
      return <IconWorld />;
  }
}

export default function Index() {
  const { members } = useLoaderData<typeof loader>();
  const displayMembers = members.slice(0, 3);  // 3人だけ表示する残りはView allで専用ページにて表示する

  return (
    <div>
      <div className="grid grid-cols-1  md:grid-cols-3 w-full  gap-y-4 md:gap-x-4">
        <div className="h-96 col-span-2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 rounded-2xl flex flex-col p-8">
          <div className="text-white text-4xl font-bold">Let's have fun and play funny!</div>
          <p className="text-white mt-4">AkariNextで一緒に楽しくゲームや開発を行いましょう！</p>
        </div>
        <div className="col-span-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900 rounded-2xl w-full p-8 flex flex-col justify-between">
          <div>
            <div className="text-white text-4xl font-bold">Join us!</div>
            <p className="text-white mt-4">今すぐAkariNextのコミュニティーに参加しましょう！</p>
          </div>
          <Button asChild>
            <a href="https://discord.gg/E2aG9qrFmh" target="_blank" rel="noreferrer noopener">
              Discord
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl p-8 min-h-96">
        <div className="flex justify-between items-center" id="usual-member-header">
          <div className="text-slate-700 text-2xl font-bold">USUAL MEMBER</div>
          <a href="#" className="text-slate-700 hover:underline hover:transition-all">View all</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 mt-8 gap-8">
          {displayMembers.map((member) => (
            <div key={member.name} className="flex justify-center items-center flex-col bg-slate-100 rounded-3xl p-8">
              <img src={member.avatar} className="h-24 rounded-2xl" alt="" />
              <div className="mt-2 text-slate-700 text-lg font-bold">{member.name}</div>
              <div className="flex flex-row gap-2">
                {member.socials.map((social, index) => (
                  <a href={social.url} key={index} target="_blank" rel="noreferrer noopener">
                    {social.alt ? <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {getMemberSocialIcon(social.type)}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{social.alt}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> : getMemberSocialIcon(social.type)}
                  </a>
                ))}
              </div>
              <div className="flex gap-1 flex-row flex-wrap border-t pt-2 mt-2">
                {member.roles.map((role, index) => <Badge key={index}>{role}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 h-96 grid grid-cols-3 gap-4">
        <div className="col-span-1 w-full h-full bg-blue-200 rounded-2xl p-8">
          プレイしているゲームを確認しましょう！
        </div>
        <div className="col-span-2 w-full h-full bg-blue-400 rounded-2xl">

        </div>
      </div>
    </div>
  );
}
