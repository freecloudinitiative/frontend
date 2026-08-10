export interface MockShellResult {
  output: string
  clear?: boolean
}

const HELP_TEXT = [
  'Available commands:',
  '  help       show this help text',
  '  ls         list directory contents',
  '  pwd        print working directory',
  '  whoami     print current user',
  '  uname -a   print system information',
  '  df -h      report disk space usage',
  '  free -m    report memory usage',
  '  uptime     tell how long the system has been running',
  '  clear      clear the terminal screen',
].join('\r\n')

const LS_TEXT = 'bin  etc  home  var  usr  tmp'

const UNAME_TEXT = 'Linux vm-instance 6.1.0-gcp #1 SMP PREEMPT_DYNAMIC Debian 6.1.109-1 x86_64 GNU/Linux'

const DF_TEXT = [
  'Filesystem      Size  Used Avail Use% Mounted on',
  '/dev/sda1        50G   14G   34G  30% /',
  'tmpfs           2.0G     0  2.0G   0% /dev/shm',
].join('\r\n')

const FREE_TEXT = [
  '              total        used        free      shared  buff/cache   available',
  'Mem:           3936        812        1820          12        1304        2912',
  'Swap:             0           0           0',
].join('\r\n')

const UPTIME_TEXT = ' 14:32:07 up 21 days,  4:12,  1 user,  load average: 0.08, 0.05, 0.01'

export function createMockShell(vmName: string) {
  return {
    getWelcomeBanner(): string {
      return [
        'Free Cloud Initiative — Serial Console',
        `Connected to ${vmName}`,
        "Type 'help' for available commands.",
      ].join('\r\n')
    },

    getPrompt(): string {
      return `root@${vmName}:~$ `
    },

    runCommand(line: string): MockShellResult {
      const cmd = line.trim()

      if (cmd === '') {
        return { output: '' }
      }
      if (cmd === 'help') {
        return { output: HELP_TEXT }
      }
      if (cmd === 'ls') {
        return { output: LS_TEXT }
      }
      if (cmd === 'pwd') {
        return { output: '/root' }
      }
      if (cmd === 'whoami') {
        return { output: 'root' }
      }
      if (cmd === 'uname -a') {
        return { output: UNAME_TEXT }
      }
      if (cmd === 'df -h') {
        return { output: DF_TEXT }
      }
      if (cmd === 'free -m') {
        return { output: FREE_TEXT }
      }
      if (cmd === 'uptime') {
        return { output: UPTIME_TEXT }
      }
      if (cmd === 'clear') {
        return { output: '', clear: true }
      }

      return { output: `${cmd}: command not found` }
    },
  }
}

export type MockShell = ReturnType<typeof createMockShell>
