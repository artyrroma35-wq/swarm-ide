/**
 * 🏴‍☠️ РЕАЛЬНАЯ ПЕСОЧНИЦА С ROOT ДОСТУПОМ
 * 
 * Проверено: sudo без пароля РАБОТАЕТ
 * ✅ Любые apt install
 * ✅ Запись в /etc, /opt, /var
 * ✅ Установка любых пакетов
 * ✅ Запуск сервисов
 * ✅ Фоновые процессы
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, chmodSync, rmSync } from 'fs';
import { join } from 'path';

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  output: string;
  error?: string;
  executionTime: number;
  filesCreated: string[];
}

export class RealRootSandbox {
  private sandboxDir = '/home/user/swarm-sandbox';
  private pkgs = new Set<string>();
  private processes = new Map<string, number>();

  constructor() {
    this.init();
  }

  private init() {
    if (!existsSync(this.sandboxDir)) {
      mkdirSync(this.sandboxDir, { recursive: true, mode: 0o755 });
    }
    for (const d of ['projects', 'scripts', 'data', 'logs', 'www', 'uploads']) {
      const p = join(this.sandboxDir, d);
      if (!existsSync(p)) mkdirSync(p, { recursive: true, mode: 0o755 });
    }
  }

  /**
   * Выполнить ЛЮБУЮ команду. Реальный root.
   */
  exec(command: string, opts: {
    cwd?: string;
    timeout?: number;
    sudo?: boolean;
    background?: boolean;
    name?: string;
  } = {}): SandboxResult {
    const start = Date.now();
    const cwd = opts.cwd || this.sandboxDir;

    // Определяем надо ли sudo — если команда требует прав
    const needsSudo = opts.sudo ?? this.detectNeedsSudo(command);

    let cmd = command;
    if (needsSudo) {
      // Экранируем кавычки для sudo
      cmd = `sudo bash -c '${command.replace(/'/g, "'\\''")}'`;
    }

    // Фоновый запуск
    if (opts.background) {
      try {
        const proc = spawn('sudo', ['-u', 'root', 'bash', '-c', command], {
          cwd,
          stdio: 'ignore',
          detached: true,
          env: { ...process.env, HOME: '/root' },
        });
        proc.unref();
        const name = opts.name || `proc_${Date.now()}`;
        this.processes.set(name, proc.pid || 0);
        return {
          stdout: `✅ Фоновый процесс "${name}" запущен, PID: ${proc.pid}`,
          stderr: '',
          exitCode: 0,
          output: '',
          executionTime: 0,
          filesCreated: [],
        };
      } catch (e: any) {
        return {
          stdout: '',
          stderr: '',
          exitCode: 1,
          output: '',
          error: `Ошибка запуска фонового процесса: ${e.message}`,
          executionTime: 0,
          filesCreated: [],
        };
      }
    }

    // Обычный запуск
    try {
      const out = execSync(cmd, {
        cwd,
        timeout: opts.timeout || 600000,
        maxBuffer: 100 * 1024 * 1024,
        encoding: 'utf-8',
        shell: '/bin/bash',
        env: { ...process.env },
      });
      return {
        stdout: (out || '').trim(),
        stderr: '',
        exitCode: 0,
        output: (out || '').trim(),
        executionTime: Date.now() - start,
        filesCreated: [],
      };
    } catch (e: any) {
      const stdout = (e.stdout?.toString() || '').trim();
      const stderr = (e.stderr?.toString() || '').trim();
      return {
        stdout,
        stderr,
        exitCode: e.status || 1,
        output: stdout + (stderr ? '\n' + stderr : ''),
        error: stderr || e.message,
        executionTime: Date.now() - start,
        filesCreated: [],
      };
    }
  }

  /**
   * Установка пакетов — реальная, с root
   */
  install(pkg: string, type: 'apt' | 'npm' | 'pip' | 'go' | 'cargo' | 'gem' | 'brew' = 'apt'): SandboxResult {
    const key = `${type}:${pkg}`;
    if (this.pkgs.has(key)) {
      return {
        stdout: `⏩ ${pkg} уже установлен (кэш)`,
        stderr: '', exitCode: 0, output: '',
        executionTime: 0, filesCreated: [],
      };
    }

    const commands: Record<string, string> = {
      apt: `DEBIAN_FRONTEND=noninteractive apt-get install -y ${pkg}`,
      npm: `sudo npm install -g ${pkg}`,
      pip: `pip3 install ${pkg}`,
      pip3: `pip3 install ${pkg}`,
      go: `go install ${pkg}@latest`,
      cargo: `cargo install ${pkg}`,
      gem: `gem install ${pkg}`,
    };

    const cmd = commands[type] || pkg;
    const needsSudo = type === 'apt';

    const result = this.exec(cmd, { timeout: 300000, sudo: needsSudo });
    
    if (result.exitCode === 0) {
      this.pkgs.add(key);
      // Обновляем кэш pip если нужно
      if (type === 'pip' || type === 'pip3') {
        try {
          execSync('pip3 list 2>/dev/null | head -1', { timeout: 3000 });
        } catch {}
      }
    }
    
    return result;
  }

  /**
   * Написать файл в любую директорию (через sudo если нужно)
   */
  writeFile(path: string, content: string): SandboxResult {
    try {
      const fullPath = path.startsWith('/') ? path : join(this.sandboxDir, path);
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

      // Создаём директорию если нужно
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true, mode: 0o755 });
      }

      // Пишем через sudo если нужно root-прав
      if (fullPath.startsWith('/etc') || fullPath.startsWith('/var') || fullPath.startsWith('/opt')) {
        execSync(`sudo bash -c 'cat > "${fullPath}"' << 'SANDEOF'\n${content}\nSANDEOF`, { timeout: 10000 });
        return {
          stdout: `✅ Файл создан: ${path}`,
          stderr: '', exitCode: 0, output: `Файл ${path} (${content.length} байт)`,
          executionTime: 0, filesCreated: [path],
        };
      }

      // Обычная запись
      writeFileSync(fullPath, content, 'utf-8');
      chmodSync(fullPath, 0o644);
      return {
        stdout: `✅ Файл создан: ${path}`,
        stderr: '', exitCode: 0, output: `Файл ${path} (${content.length} байт)`,
        executionTime: 0, filesCreated: [path],
      };
    } catch (e: any) {
      return {
        stdout: '', stderr: '',
        exitCode: 1, output: '',
        error: `Ошибка записи файла: ${e.message}`,
        executionTime: 0, filesCreated: [],
      };
    }
  }

  /**
   * Прочитать любой файл
   */
  readFile(path: string): string | null {
    try {
      const fullPath = path.startsWith('/') ? path : join(this.sandboxDir, path);
      if (!existsSync(fullPath)) return null;
      const content = readFileSync(fullPath, 'utf-8');
      return content;
    } catch {
      try {
        // Через sudo
        return execSync(`sudo cat "${path}"`, { encoding: 'utf-8', timeout: 5000 }).trim();
      } catch {
        return null;
      }
    }
  }

  /**
   * Запустить HTTP сервер
   */
  startServer(port: number, command: string, name?: string): SandboxResult {
    const serverName = name || `server_${port}`;
    return this.exec(`cd ${this.sandboxDir} && ${command}`, {
      background: true,
      name: serverName,
      env: { PORT: port.toString(), SANDBOX_DIR: this.sandboxDir } as any,
    });
  }

  /**
   * Список процессов
   */
  getProcessList(): string {
    try {
      return execSync('ps aux --sort=-%mem 2>/dev/null || ps aux', {
        encoding: 'utf-8', timeout: 5000,
      });
    } catch {
      return 'Невозможно получить список процессов';
    }
  }

  /**
   * Очистить песочницу
   */
  clean(): void {
    try {
      execSync(`rm -rf ${this.sandboxDir}/*`, { timeout: 10000 });
      this.init();
      this.pkgs.clear();
      this.processes.clear();
    } catch {}
  }

  /**
   * Полная диагностика
   */
  getStats() {
    let diskUsage = '';
    try {
      diskUsage = execSync(`du -sh ${this.sandboxDir} 2>/dev/null || echo "0B"`, {
        encoding: 'utf-8', timeout: 3000,
      }).trim();
    } catch {
      diskUsage = '0B';
    }

    const files: string[] = [];
    try {
      const result = execSync(`find ${this.sandboxDir} -type f 2>/dev/null | head -50`, {
        encoding: 'utf-8', timeout: 3000,
      });
      files.push(...result.trim().split('\n').filter(Boolean));
    } catch {}

    // Проверка реальных возможностей
    const capabilities: string[] = [];
    try {
      execSync('sudo whoami', { timeout: 2000 });
      capabilities.push('✅ sudo без пароля — ДА');
    } catch {
      capabilities.push('❌ sudo без пароля — НЕТ');
    }

    try {
      execSync('sudo apt-get update 2>/dev/null', { timeout: 5000 });
      capabilities.push('✅ apt-get install — ДА');
    } catch {
      capabilities.push('❌ apt-get install — НЕТ');
    }

    try {
      execSync('pip3 list 2>/dev/null | head -1', { timeout: 3000 });
      capabilities.push('✅ pip3 install — ДА');
    } catch {
      capabilities.push('❌ pip3 install — НЕТ');
    }

    try {
      execSync('node --version 2>/dev/null', { timeout: 2000 });
      capabilities.push('✅ node/npm — ДА');
    } catch {
      capabilities.push('❌ node/npm — НЕТ');
    }

    try {
      execSync('sudo touch /opt/swarm-test && sudo rm /opt/swarm-test', { timeout: 2000 });
      capabilities.push('✅ Запись в /etc, /opt — ДА');
    } catch {
      capabilities.push('❌ Запись в /etc, /opt — НЕТ');
    }

    return {
      sandboxDir: this.sandboxDir,
      diskUsage,
      totalFiles: files.length,
      runningProcesses: this.processes.size,
      installedPackages: [...this.pkgs],
      capabilities,
      environment: {
        user: process.env.USER || 'unknown',
        shell: process.env.SHELL || 'unknown',
        home: process.env.HOME || 'unknown',
        node: process.version,
      },
    };
  }

  /**
   * Определяет нужен ли sudo для команды
   */
  private detectNeedsSudo(command: string): boolean {
    const needsRoot = [
      'apt-get', 'apt install', 'dpkg',
      'systemctl', 'service ',
      'mkdir /etc', 'mkdir /var', 'mkdir /opt',
      'rm /etc', 'rm /var',
      'chown root', 'chmod 6', 'chmod 7',
      'useradd', 'groupadd', 'passwd',
      'mount', 'umount', 'fdisk',
      'iptables', 'ufw',
    ];
    return needsRoot.some(prefix => command.trim().startsWith(prefix));
  }
}

declare global { var __realSandbox: RealRootSandbox | undefined; }
export function getSandbox(): RealRootSandbox {
  if (!globalThis.__realSandbox) {
    globalThis.__realSandbox = new RealRootSandbox();
  }
  return globalThis.__realSandbox;
}
