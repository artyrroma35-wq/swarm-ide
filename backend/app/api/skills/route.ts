import { getSkillLoader } from '@/src/skills/skill-loader';

export async function GET() {
  const loader = getSkillLoader();
  const skills = loader.loadAll();
  return Response.json({ 
    skills: skills.map(s => ({ name: s.name, description: s.description, autoLoad: s.autoLoad })),
    total: skills.length 
  });
}
