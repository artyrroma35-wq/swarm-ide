/**
 * 📚 Skills System — загрузка навыков для агентов
 * 
 * Агенты могут загружать навыки из markdown-файлов
 * с frontmatter (name, description, auto-load, allowed-tools)
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export interface Skill {
  name: string;
  description: string;
  content: string;
  autoLoad: boolean;
  allowedTools?: string[];
  license?: string;
}

const SKILLS_DIRS = [
  join(process.cwd(), 'skills'),
  join(process.cwd(), '.agents', 'skills'),
];

function parseFrontmatter(text: string): { frontmatter: Record<string, any>; content: string } {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: text };

  const fm: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return { frontmatter: fm, content: match[2].trim() };
}

export class SkillLoader {
  private cache = new Map<string, Skill>();

  loadAll(): Skill[] {
    const skills: Skill[] = [];
    for (const dir of SKILLS_DIRS) {
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.md')) continue;
        const path = join(dir, file);
        const text = readFileSync(path, 'utf-8');
        const { frontmatter, content } = parseFrontmatter(text);
        const skill: Skill = {
          name: frontmatter.name || file.replace('.md', ''),
          description: frontmatter.description || '',
          content,
          autoLoad: frontmatter['auto-load'] === true || frontmatter['auto-load'] === 'true',
          allowedTools: frontmatter['allowed-tools'],
          license: frontmatter.license,
        };
        this.cache.set(skill.name, skill);
        skills.push(skill);
      }
    }
    return skills;
  }

  getSkill(name: string): Skill | undefined {
    if (this.cache.size === 0) this.loadAll();
    return this.cache.get(name);
  }

  getAutoLoadSkills(): Skill[] {
    if (this.cache.size === 0) this.loadAll();
    return [...this.cache.values()].filter(s => s.autoLoad);
  }

  formatSkillsForPrompt(skills: Skill[]): string {
    return skills.map(s => 
      `[НАВЫК: ${s.name}]\n${s.description ? s.description + '\n' : ''}${s.content}`
    ).join('\n\n');
  }
}

declare global { var __skillLoader: SkillLoader | undefined; }
export function getSkillLoader(): SkillLoader {
  if (!globalThis.__skillLoader) globalThis.__skillLoader = new SkillLoader();
  return globalThis.__skillLoader;
}
