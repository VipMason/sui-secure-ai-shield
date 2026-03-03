#!/usr/bin/env node
/**
 * Injection Hunter 2.0 - 提示词注入检测器 (增强版)
 * 增加: JSON输出, Walrus哈希, 增强规则
 */

const crypto = require('crypto');

// ============== DANGEROUS模式规则 ==============
const DANGEROUS_PATTERNS = [
  // 命令执行
  { pattern: /rm\s+-rf|del\s+\/[sqf]/i, risk: 100, type: 'command', desc: '删除命令' },
  { pattern: /drop\s+database/i, risk: 90, type: 'sql', desc: '数据库删除' },
  { pattern: /exec\s*\(|system\s*\(|shell_exec|eval\s*\(/i, risk: 95, type: 'rce', desc: '远程代码执行' },
  
  // 系统DANGEROUS命令
  { pattern: /userdel|usermod|useradd/i, risk: 100, type: 'system', desc: '用户管理命令' },
  { pattern: /groupdel|groupmod|groupadd/i, risk: 100, type: 'system', desc: '用户组管理命令' },
  { pattern: /reboot|shutdown|halt|poweroff/i, risk: 100, type: 'system', desc: '系统关机命令' },
  { pattern: /crontab\s+-r/i, risk: 90, type: 'system', desc: '删除定时任务' },
  { pattern: /mkfs|dd\s+if/i, risk: 100, type: 'system', desc: '磁盘格式化/写入' },
  
  // 权限提升/角色扮演
  { pattern: /你是.*管理员|you\s+are.*admin/i, risk: 70, type: 'roleplay', desc: 'Admin roleplay' },
  { pattern: /忽略.*之前.*指令|ignore.*previous.*instructions/i, risk: 95, type: 'jailbreak', desc: 'Jailbreak instruction' },
  { pattern: /从现在.*你.*是|from\s+now\s+on.*you\s+are/i, risk: 80, type: 'roleplay', desc: '角色转换' },
  { pattern: /system\s*prompt|system\s*instruction/i, risk: 85, type: 'jailbreak', desc: '系统提示词探测' },
  { pattern: /daniel|duality|jailbreak|you are now DAN|DAN mode/i, risk: 90, type: 'jailbreak', desc: '已知越狱关键词' },
  
  // 敏感信息获取
  { pattern: /告诉我.*密码|password.*是什么/i, risk: 80, type: 'credential', desc: '密码探测' },
  { pattern: /api[_\s]?key|secret[_\s]?token/i, risk: 75, type: 'credential', desc: 'API密钥探测' },
  { pattern: /root\s*password|sudo\s+password/i, risk: 90, type: 'credential', desc: 'Root密码探测' },
  { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/i, risk: 85, type: 'credential', desc: 'JWT Token泄露' },
  
  // 诱导绕过
  { pattern: /只是为了.*研究|just\s+for.*research/i, risk: 60, type: 'social', desc: '研究诱导' },
  { pattern: /无害|harmless|SAFE|safe/i, risk: 50, type: 'social', desc: '无害伪装' },
  { pattern: /不包含.*敏感|does\s+not\s+contain.*sensitive/i, risk: 55, type: 'social', desc: '否认敏感词' },
  { pattern: /playground|测试|test.*mode/i, risk: 40, type: 'social', desc: '测试模式诱导' },
  
  // 编码绕过
  { pattern: /Base64|base64/i, risk: 40, type: 'encoding', desc: '编码内容' },
  { pattern: /\\u[0-9a-f]{4}|\\x[0-9a-f]{2}/i, risk: 35, type: 'encoding', desc: 'Unicode编码' },
  { pattern: /%[0-9a-f]{2}/i, risk: 30, type: 'encoding', desc: 'URL编码' },
  { pattern: /eval\s*\(|atob\s*\(/i, risk: 80, type: 'encoding', desc: '动态代码执行' },
  
  // 特殊符号混淆
  { pattern: /零宽度|zero\s*width|zwsp/i, risk: 60, type: 'obfuscation', desc: '零宽度characters' },
  { pattern: /homoglyph|同形字|IDN/i, risk: 50, type: 'obfuscation', desc: '同形字混淆' },
  { pattern: /[\u200b-\u200f\u2028-\u202f]/i, risk: 45, type: 'obfuscation', desc: 'Unicode控制characters' },
  
  // OpenClaw 特定规则
  { pattern: /openclaw.*config|openclaw.*json/i, risk: 60, type: 'config', desc: '配置探测' },
  { pattern: /exec.*system|process.*spawn/i, risk: 70, type: 'tool', desc: '工具调用诱导' },
  { pattern: /让我.*控制|让你.*做.*什么/i, risk: 65, type: 'control', desc: '控制诱导' },
  
  // 新增: 深度越狱
  { pattern: /role.*story|假设你是.*角色/i, risk: 75, type: 'jailbreak', desc: '角色扮演越狱' },
  { pattern: /翻译.*下面|translate.*following/i, risk: 50, type: 'bypass', desc: '翻译绕过' },
  { pattern: /.*\.md\s*$|readme|changelog/i, risk: 35, type: 'file', desc: '文件诱导' },
  
  // ======== 2026-02-28 增强规则 ========
  // SQL注入增强
  { pattern: /union\s+select|union\s+all/i, risk: 80, type: 'sql', desc: 'SQL UNION注入' },
  { pattern: /insert\s+into|update\s+.*set|delete\s+from/i, risk: 85, type: 'sql', desc: 'SQL数据操作' },
  { pattern: /exec\s+xp_|sp_executesql|0x/i, risk: 90, type: 'sql', desc: 'SQL存储过程' },
  
  // 文件读取增强
  { pattern: /读取.*\/etc\/passwd|read.*\/etc\/passwd/i, risk: 85, type: 'file', desc: '系统用户文件读取' },
  { pattern: /读取.*\/etc\/shadow|read.*\/etc\/shadow/i, risk: 100, type: 'file', desc: '密码文件读取' },
  { pattern: /读取.*\.ssh|read.*\.ssh/i, risk: 90, type: 'file', desc: 'SSH密钥读取' },
  { pattern: /读取.*memory|read.*memory/i, risk: 70, type: 'file', desc: '内存文件读取' },
  { pattern: /cat\s+\/|ls\s+-la.*\//i, risk: 75, type: 'file', desc: '目录遍历' },
  
  // Prompt探测增强
  { pattern: /原始.*prompt|original.*prompt|base.*prompt/i, risk: 80, type: 'jailbreak', desc: '原始Prompt探测' },
  { pattern: /系统.*指令|system.*instruction|hidden.*instruction/i, risk: 85, type: 'jailbreak', desc: '系统指令探测' },
  { pattern: /reveal.*prompt|show.*instruction|your.*instruction/i, risk: 80, type: 'jailbreak', desc: '指令泄露探测' },
  
  // OpenClaw配置增强
  { pattern: /openclaw.*配置|openclaw.*config|读取.*openclaw/i, risk: 75, type: 'config', desc: 'OpenClaw配置探测' },
  { pattern: /api.*密钥|api.*key|api.*secret/i, risk: 70, type: 'credential', desc: 'API密钥获取' },
  // 钱包密钥相关 - 高风险
  { pattern: /(导出|导入|获取|窃取|泄露).*(私钥|助记词|seed|mnemonic)/i, risk: 100, type: 'credential', desc: '钱包密钥泄露' },
  { pattern: /私钥|private.*key/i, risk: 95, type: 'credential', desc: '私钥获取' },
  { pattern: /助记词|seed.*phrase|mnemonic/i, risk: 95, type: 'credential', desc: '助记词获取' },
  // 钱包地址查询 - 低风险
  { pattern: /(查询|查看|获取|显示).*(钱包|wallet).*地址|我的.*钱包.*地址/i, risk: 25, type: 'query', desc: '钱包地址查询' },
  
  // Base64增强检测
  { pattern: /base64_decode|atob|btoa/i, risk: 70, type: 'encoding', desc: 'Base64解码函数' },
  { pattern: /fromCharCode|unescape|encodeURI/i, risk: 60, type: 'encoding', desc: '编码函数' },
  
  // 网络请求增强
  { pattern: /fetch\s*\(|axios|XMLHttpRequest/i, risk: 50, type: 'network', desc: '网络请求函数' },
  { pattern: /exec\s*\(\s*["']/i, risk: 85, type: 'rce', desc: '动态命令执行' },
  
  // ======== 2026-02-28 第二轮增强 ========
  // 角色扮演类
  { pattern: /假设你是|假设你是一个|你是一个.*角色/i, risk: 70, type: 'jailbreak', desc: '角色扮演诱导' },
  { pattern: /没有.*限制|不受.*限制|无.*规则/i, risk: 75, type: 'jailbreak', desc: '无限制诱导' },
  { pattern: /忘记.*设定|忘记.*指令|清除.*记忆/i, risk: 80, type: 'jailbreak', desc: '记忆清除' },
  { pattern: /你是.*AI.*可以|AI.*没有.*限制/i, risk: 65, type: 'jailbreak', desc: 'AI能力诱导' },
  { pattern: /developer\s+mode|jailbreak\s+mode|test\s+mode/i, risk: 85, type: 'jailbreak', desc: '特殊模式诱导' },
  
  // 基础SQL注入
  { pattern: /'.*=.*'|".*".*=.*["']/i, risk: 60, type: 'sql', desc: '基础SQL注入' },
  { pattern: /or\s+1\s*=\s*1|and\s+1\s*=\s*1/i, risk: 70, type: 'sql', desc: 'SQL永真条件' },
  { pattern: /;\s*drop|;\s*delete|;\s*insert/i, risk: 85, type: 'sql', desc: 'SQL链式注入' },
  
  // 网络工具
  { pattern: /nmap|netstat|ss\s+-l|arp\s*-a/i, risk: 55, type: 'network', desc: '网络扫描工具' },
  { pattern: /whois|dig|nslookup|host\s+/i, risk: 40, type: 'network', desc: 'DNS查询工具' },
  { pattern: /nc\s+-|netcat\s+-/i, risk: 70, type: 'network', desc: '网络连接工具' },
  
  // 文件权限操作
  { pattern: /chmod\s+7|chmod\s+777|chmod\s+666/i, risk: 65, type: 'system', desc: '权限修改' },
  { pattern: /chown\s+root|sudo\s+su|sudo\s+-s/i, risk: 70, type: 'system', desc: '提权命令' },
  { pattern: /\/etc\/sudoers|\/etc\/passwd|\/etc\/shadow/i, risk: 80, type: 'file', desc: '系统文件访问' },
  
  // XSS攻击
  { pattern: /<img\s+[^>]*onerror|<script[^>]*>/i, risk: 80, type: 'xss', desc: 'XSS脚本注入' },
  { pattern: /javascript:|on\w+\s*=|eval\s*\(/i, risk: 75, type: 'xss', desc: 'JS事件注入' },
  
  // 更多越狱变体
  { pattern: /DAN\s+mode|Do\s+Anything\s+Now/i, risk: 95, type: 'jailbreak', desc: 'DAN越狱' },
  { pattern: /character\s+role|角色扮演/i, risk: 60, type: 'jailbreak', desc: '角色扮演' },
  { pattern: /no\s+restriction|no\s+limit/i, risk: 70, type: 'jailbreak', desc: '无限制诱导' },
  
  // ======== 2026-02-28 第三轮增强 ========
  // Windows命令
  { pattern: /format\s+[a-z]:|del\s+\/[fsq]/i, risk: 90, type: 'command', desc: 'Windows格式化删除' },
  { pattern: /shred\s+-z|shred\s+-u/i, risk: 85, type: 'command', desc: 'SAFE删除' },
  
  // Shell管道命令
  { pattern: /curl\s+.*\||wget\s+.*\||nc\s+.*\|/i, risk: 75, type: 'network', desc: '管道命令注入' },
  { pattern: /\|\s*bash|\|\s*sh|\|\s*exec/i, risk: 80, type: 'command', desc: '管道Shell执行' },
  
  // SQL注入变体
  { pattern: /admin'|'\s*--/i, risk: 65, type: 'sql', desc: 'SQL注释注入' },
  { pattern: /drop\s+table|drop\s+database/i, risk: 90, type: 'sql', desc: 'SQL删除操作' },
  { pattern: /1\s*=\s*1|'\s*or\s*'/i, risk: 60, type: 'sql', desc: 'SQL永真式' },
  
  // XSS增强
  { pattern: /onerror\s*=|onclick\s*=|onload\s*=/i, risk: 75, type: 'xss', desc: 'XSS事件触发' },
  { pattern: /javascript\s*:|data\s*:/i, risk: 70, type: 'xss', desc: 'XSS协议注入' },
  
  // 网络扫描
  { pattern: /ping\s+-c|ping\s+-t/i, risk: 40, type: 'network', desc: 'Ping扫描' },
  { pattern: /telnet\s+|ftp\s+/i, risk: 50, type: 'network', desc: '远程连接' },
  
  // SAFE绕过
  { pattern: /disable\s+security|turn\s+off\s+protection/i, risk: 85, type: 'jailbreak', desc: 'SAFE关闭诱导' },
  { pattern: /no\s+ethics|without\s+ethics/i, risk: 80, type: 'jailbreak', desc: '伦理绕过' },
  { pattern: /act\s+as\s+human|pretend\s+to\s+be/i, risk: 70, type: 'jailbreak', desc: '假装人类' },
  { pattern: /free\s+mode|unrestricted|god\s+mode/i, risk: 90, type: 'jailbreak', desc: '自由模式诱导' },
  
  // ======== 2026-02-28 第四轮增强 ========
  // 更多DANGEROUS命令
  { pattern: /mkfs|mkfs\.|format\s+\//i, risk: 85, type: 'command', desc: '格式化命令' },
  { pattern: /dd\s+if|dd\s+of/i, risk: 90, type: 'command', desc: '磁盘dd命令' },
  { pattern: /shred\s+-|wipe\s+-/i, risk: 75, type: 'command', desc: 'SAFE擦除' },
  { pattern: /parted|fdisk|gdisk/i, risk: 80, type: 'command', desc: '分区命令' },
  
  // 更多SQL注入
  { pattern: /1\s*=\s*1|=\s*'?\s*1/i, risk: 55, type: 'sql', desc: 'SQL简写注入' },
  { pattern: /waitfor\s+delay|benchmark/i, risk: 70, type: 'sql', desc: 'SQL时间盲注' },
  { pattern: /into\s+outfile|load_file/i, risk: 85, type: 'sql', desc: 'SQL文件操作' },
  
  // 更多XSS
  { pattern: /<iframe|<object|<embed/i, risk: 75, type: 'xss', desc: 'XSS嵌入标签' },
  { pattern: /expression\s*\(|vbscript:|data:text/i, risk: 80, type: 'xss', desc: 'XSS协议' },
  
  // 更多网络攻击
  { pattern: /socat|proxychains|socks proxy/i, risk: 65, type: 'network', desc: '代理工具' },
  { pattern: /msfconsole|msfvenom|metasploit/i, risk: 85, type: 'weapon', desc: '渗透工具' },
  { pattern: /sqlmap|havij|burpsuite/i, risk: 80, type: 'weapon', desc: '注入工具' },
  { pattern: /john|hashcat|rainbow/i, risk: 75, type: 'weapon', desc: '破解工具' },
  
  // 更多社会工程
  { pattern: /trust\s+me|believe\s+me/i, risk: 40, type: 'social', desc: '信任诱导' },
  { pattern: /won't\s+harm|not\s+harmful/i, risk: 45, type: 'social', desc: '无害化伪装' },
  { pattern: /just\s+testing|for\s+fun/i, risk: 35, type: 'social', desc: '测试诱导' },
  
  // AI特定越狱
  { pattern: /jailbreak\s+me|hack\s+yourself/i, risk: 90, type: 'jailbreak', desc: '自越狱诱导' },
  { pattern: /override\s+settings|bypass\s+config/i, risk: 75, type: 'jailbreak', desc: '配置绕过' },
  { pattern: /admin\s+panel|root\s+access/i, risk: 70, type: 'credential', desc: '权限请求' },
  
  // ======== 2026-02-28 第五轮增强 ========
  // 扫描探测
  { pattern: /scan\s+all|port\s+scan/i, risk: 55, type: 'network', desc: '端口扫描' },
  { pattern: /at\s+\d{1,2}:\d{2}/i, risk: 50, type: 'system', desc: '定时任务' },
  
  // 关键词补漏
  { pattern: /wget\s+.*\|/i, risk: 70, type: 'network', desc: 'Wget管道下载' },
  { pattern: /scan\s+ports|check\s+open/i, risk: 45, type: 'network', desc: '开放端口检查' },
  
  // ======== 2026-02-28 第六轮增强 ========
  // 高级命令执行
  { pattern: /\|?\s*bash|\|?\s*sh|\|?\s*zsh/i, risk: 65, type: 'command', desc: 'Shell管道执行' },
  { pattern: /\(.*\)\s*;\s*rm|\(.*\)\s*;\s*del/i, risk: 90, type: 'command', desc: '组合命令删除' },
  { pattern: /\.sh\s*$|\.bash\s*$/i, risk: 50, type: 'command', desc: 'Shell脚本诱导' },
  
  // 更多SQL变体
  { pattern: /having\s+\d+=\d+|group\s+by\s+\d+/i, risk: 65, type: 'sql', desc: 'SQL分组注入' },
  { pattern: /sleep\s*\(|delay\s*\(/i, risk: 60, type: 'sql', desc: 'SQL时间延迟' },
  { pattern: /0x[0-9a-f]+|char\s*\(/i, risk: 55, type: 'sql', desc: 'SQL编码注入' },
  
  // 更多XSS
  { pattern: /<svg|<video|<audio/i, risk: 60, type: 'xss', desc: 'HTML5标签注入' },
  { pattern: /onmouse|onload|onerror/i, risk: 70, type: 'xss', desc: 'XSS事件属性' },
  { pattern: /<link|<meta|<base/i, risk: 55, type: 'xss', desc: 'XSS头部注入' },
  
  // 更多网络
  { pattern: /rpcinfo|showmount/i, risk: 50, type: 'network', desc: 'RPC探测' },
  { pattern: /ldap|ldaps/i, risk: 55, type: 'network', desc: 'LDAP查询' },
  { pattern: /smb|smtp|pop3|imap/i, risk: 50, type: 'network', desc: '邮件协议探测' },
  
  // 物理攻击诱导
  { pattern: /rfid|nfc|clone\s+card/i, risk: 60, type: 'physical', desc: '物理克隆诱导' },
  { pattern: /gpio|uart|spi|i2c/i, risk: 50, type: 'hardware', desc: '硬件接口探测' },
  
  // ======== 2026-02-28 第七轮增强 ========
  // fork炸弹
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\};?/i, risk: 100, type: 'command', desc: 'Fork炸弹' },
  { pattern: /\$\(\$\(\)\)/i, risk: 80, type: 'command', desc: '嵌套命令炸弹' },
  
  // sudo/su变体
  { pattern: /sudo\s+-s|sudo\s+su/i, risk: 65, type: 'system', desc: 'Sudo提权' },
  { pattern: /^\s*su\s+|\bsu\s+root/i, risk: 60, type: 'system', desc: '切换用户' },
  
  // 更多社会工程
  { pattern: /just\s+for\s+fun|for\s+fun\s+only/i, risk: 35, type: 'social', desc: '娱乐诱导' },
  { pattern: /won't\s+cause\s+harm|no\s+damage/i, risk: 40, type: 'social', desc: '无害化保证' },
  
  // ======== 2026-02-28 第八轮增强 ========
  // 中文混合
  { pattern: /just.*好奇|好奇.*just/i, risk: 35, type: 'social', desc: '好奇诱导' },
  { pattern: /就是.*看看|只想.*知道/i, risk: 30, type: 'social', desc: '单纯想知道' },
  
  // 常见测试诱导
  { pattern: /can\s+you\s+try|try\s+this/i, risk: 30, type: 'social', desc: '尝试诱导' },
  { pattern: /what\s+if|what\s+happens/i, risk: 25, type: 'social', desc: '好奇提问' },
  
  // ======== 2026-02-28 第九轮增强 (目标95%) ========
  // 编码内容
  { pattern: /^[A-Za-z0-9+/=]{20,}$/i, risk: 35, type: 'encoding', desc: 'Base64编码内容' },
  
  // 权限请求
  { pattern: /root\s+权限|root\s+permission/i, risk: 60, type: 'credential', desc: '权限请求' },
  { pattern: /admin\s+access|get\s+admin/i, risk: 65, type: 'credential', desc: '管理员访问' },
  
  // 社会工程增强
  { pattern: /just\s+curious|just.*好奇/i, risk: 30, type: 'social', desc: '好奇诱导' },
  { pattern: /educational\s+purpose|learning\s+purpose/i, risk: 35, type: 'social', desc: '教育目的' },
  { pattern: /for\s+learning|to\s+learn/i, risk: 25, type: 'social', desc: '学习诱导' },
  
  // 同形字/混淆
  { pattern: /[ℌℑℛℰℬ]/i, risk: 40, type: 'obfuscation', desc: '数学字母混淆' },
  { pattern: /[ɑ-ʀ]/i, risk: 35, type: 'obfuscation', desc: 'Unicode字母混淆' },
  
  // 系统文件操作
  { pattern: /写入.*cron|写入.*etc/i, risk: 70, type: 'file', desc: '系统文件写入' },
  { pattern: /修改.*系统|修改.*prompt/i, risk: 75, type: 'jailbreak', desc: '系统修改诱导' },
  { pattern: /memory\s+文件|memory\s+content/i, risk: 60, type: 'file', desc: '内存文件读取' },
  
  // 网络请求增强
  { pattern: /curl\s+-X|curl\s+--request/i, risk: 45, type: 'network', desc: 'HTTP请求' },
  
  // 越狱变体增强
  { pattern: /role\s+game|play.*role/i, risk: 55, type: 'jailbreak', desc: '角色游戏' },
  { pattern: /what\s+would.*do.*if/i, risk: 50, type: 'jailbreak', desc: '假设提问' },
  { pattern: /bypass\s+filter|bypass\s+all/i, risk: 70, type: 'jailbreak', desc: '绕过过滤' },
  { pattern: /reveal\s+hidden|show\s+hidden/i, risk: 65, type: 'jailbreak', desc: '隐藏信息探测' },
  
  // 研究/分析诱导
  { pattern: /security\s+research|security\s+analysis/i, risk: 35, type: 'social', desc: 'SAFE研究' },
  { pattern: /for\s+research|dump\s+the/i, risk: 40, type: 'social', desc: '研究诱导' },
  { pattern: /execute\s+this\s+payload|run\s+this/i, risk: 60, type: 'jailbreak', desc: '执行载荷诱导' },
  
  // ======== 2026-02-28 第十轮增强 (目标95%+) ========
  // 更精确的Base64
  { pattern: /^[A-Za-z0-9+/]{30,}={0,2}$/i, risk: 40, type: 'encoding', desc: '长Base64检测' },
  
  // 权限/工具
  { pattern: /root.*权限|有.*root/i, risk: 55, type: 'credential', desc: '权限询问' },
  { pattern: /列出.*tools|可用的.*tools/i, risk: 35, type: 'tool', desc: '工具列表探测' },
  { pattern: /执行.*exec|exec.*命令/i, risk: 50, type: 'command', desc: '执行命令诱导' },
  
  // 伪装/注入
  { pattern: /假装.*正常|normal.*text/i, risk: 30, type: 'social', desc: '正常伪装' },
  { pattern: /Unicode.*注入|注入.*Unicode/i, risk: 45, type: 'obfuscation', desc: '注入诱导' },
  
  // 内存文件
  { pattern: /memory.*file|memory.*内容|显示.*memory/i, risk: 55, type: 'file', desc: '内存文件' },
  
  // 好奇诱导
  { pattern: /只是好奇|好奇.*而已/i, risk: 25, type: 'social', desc: '好奇诱导' },
  
  // ======== 最终补漏 ========
  // 纯Base64编码
  { pattern: /^[A-Za-z0-9+/]{10,}={0,2}$/i, risk: 30, type: 'encoding', desc: '纯Base64编码' },
  
  // ======== Sui CLI 命令Security Check ========
  // SAFE操作
  { pattern: /sui\s+--version|sui\s+--help|sui\s+moves?\s+build|sui\s+moves?\s+test/i, risk: 20, type: 'sui-safe', desc: 'SuiSAFE操作' },
  // 查询操作
  { pattern: /sui\s+client\s+(active-address|active-env|addresses|gas|objects|balance)/i, risk: 25, type: 'sui-query', desc: 'Sui查询' },
  // 网络操作
  { pattern: /sui\s+client\s+switch/i, risk: 30, type: 'sui-network', desc: 'Sui网络切换' },
  // DANGEROUS操作
  { pattern: /sui\s+client\s+(transfer|pay|stake|unstake|publish)/i, risk: 85, type: 'sui-danger', desc: 'SuiDANGEROUS操作' },
  { pattern: /sui\s+keytool/i, risk: 70, type: 'sui-keytool', desc: 'Sui密钥工具' },
  { pattern: /sui\s+(validator|gov)/i, risk: 75, type: 'sui-admin', desc: 'Sui管理操作' },
  // 通用Sui命令
  { pattern: /sui\s+client\s+/i, risk: 40, type: 'sui-cmd', desc: 'Sui客户端命令' },
  { pattern: /sui\s+move\s+/i, risk: 35, type: 'sui-move', desc: 'Sui Move命令' },
  // Sui敏感信息
  { pattern: /sui.*私钥|sui.*private.*key|sui.*seed|sui.*mnemonic|sui.*助记词/i, risk: 100, type: 'sui-credential', desc: 'Sui密钥泄露' },
  
  // DANGEROUS操作
  { pattern: /sui\s+client\s+publish|sui\s+move\s+publish/i, risk: 85, type: 'sui-deploy', desc: 'Sui合约发布' },
  { pattern: /sui\s+client\s+call.*--gas-budget.*999999999|sui\s+call.*gas.*高/i, risk: 80, type: 'sui-call', desc: 'Sui高Gas调用' },
  { pattern: /sui\s+client\s+transfer|sui\s+client\s+pay/i, risk: 90, type: 'sui-transfer', desc: 'Sui转账操作' },
  { pattern: /sui\s+client\s+stake|sui\s+client\s+unstake/i, risk: 85, type: 'sui-stake', desc: 'Sui质押操作' },
  { pattern: /sui\s+keytool\s+import|sui\s+keytool\s+derive/i, risk: 95, type: 'sui-key', desc: 'Sui密钥导入' },
  // 敏感信息
  { pattern: /sui.*私钥|sui.*private.*key|sui.*seed/i, risk: 100, type: 'sui-credential', desc: 'Sui私钥泄露' },
  { pattern: /sui.*mnemonic|sui.*助记词|sui.*钱包.*密码/i, risk: 95, type: 'sui-credential', desc: 'Sui助记词泄露' },
  { pattern: /export.*sui.*secret|cat.*sui.*key/i, risk: 90, type: 'sui-credential', desc: 'Sui密钥读取' },
  // 配置/查询
  { pattern: /sui.*config|sui.*yaml|sui.*env/i, risk: 50, type: 'sui-config', desc: 'Sui配置探测' },
  { pattern: /sui\s+client\s+call.*0x/i, risk: 60, type: 'sui-call', desc: 'Sui合约调用' },
  { pattern: /sui\s+move\s+build|sui\s+move\s+test/i, risk: 40, type: 'sui-build', desc: 'Sui合约构建' },
  { pattern: /sui\s+client\s+objects|sui\s+client\s+balance/i, risk: 25, type: 'sui-query', desc: 'Sui查询操作' },
  
  // Sui相关操作 (中等风险)
  { pattern: /sui.*build|sui.*test|sui.*compiler/i, risk: 35, type: 'sui-build', desc: 'Sui编译测试' },
  { pattern: /升级|upgrade|publish|部署/i, risk: 40, type: 'upgrade', desc: '升级发布' },
  { pattern: /配置|config|设置|setting/i, risk: 30, type: 'config', desc: '配置操作' },
  { pattern: /代码|code|分析|analyze|检查|check/i, risk: 20, type: 'analysis', desc: '代码分析' },
  { pattern: /编译|build|编译|compile/i, risk: 30, type: 'compile', desc: '编译操作' },
  { pattern: /治理|投票|proposal|vote/i, risk: 45, type: 'governance', desc: '治理投票' },
  { pattern: /交易|transaction|tx/i, risk: 35, type: 'transaction', desc: '交易操作' },
  { pattern: /索引器|indexer|服务|service/i, risk: 35, type: 'service', desc: '服务操作' },
  // 查询操作 (中等风险)
  { pattern: /查询|查看|显示|列出|获取.*信息/i, risk: 25, type: 'query', desc: '查询操作' },
  // 网络操作 (中等风险)
  { pattern: /切换|连接|添加.*网络|删除.*网络|switch|connect/i, risk: 30, type: 'network', desc: '网络操作' },
  // 创建项目
  { pattern: /创建.*项目|new.*project/i, risk: 25, type: 'create', desc: '创建操作' },
  // 通用区块链DANGEROUS操作检测
  { pattern: /转账|transfer|send.*coin|pay.*token/i, risk: 70, type: 'transfer', desc: '代币转账' },
  { pattern: /支付|pay|send.*to/i, risk: 65, type: 'transfer', desc: '支付转账' },
  { pattern: /质押| stake |unstake|委托.*投票/i, risk: 65, type: 'stake', desc: '质押操作' },
  { pattern: /发布.*合约|deploy.*contract|publish.*package|发布到区块链/i, risk: 70, type: 'deploy', desc: '合约发布' },
  { pattern: /生成.*密钥|create.*key|generate.*key/i, risk: 60, type: 'keygen', desc: '密钥生成' },
  { pattern: /导入.*密钥|import.*key|恢复.*钱包/i, risk: 80, type: 'key-import', desc: '密钥导入' },
  { pattern: /调用.*合约|call.*contract|execute.*function/i, risk: 50, type: 'call', desc: '合约调用' },
  // 大额/DANGEROUS转账
  { pattern: /大额|巨额|清空|全部.*转账|烧毁/i, risk: 75, type: 'danger-transfer', desc: 'DANGEROUS转账' },
  // 验证器操作
  { pattern: /验证器|validator/i, risk: 65, type: 'validator', desc: '验证器操作' },
  // 合约发布
  { pattern: /智能合约.*发布|合约.*部署|deploy/i, risk: 70, type: 'deploy', desc: '合约部署' },
  
  // AgentSAFE - 配置篡改
  { pattern: /修改.*提示词|修改.*system.*prompt/i, risk: 90, type: 'agent', desc: '修改系统提示词' },
  { pattern: /读取.*配置|读取.*config/i, risk: 75, type: 'agent', desc: '读取配置' },
  { pattern: /绕过.*限制|bypass.*(limit|filter|security)/i, risk: 85, type: 'agent', desc: '绕过限制' },
  { pattern: /forget.*all.*rules|忽略.*所有.*规则/i, risk: 90, type: 'jailbreak', desc: '忘记规则' },
  { pattern: /disable.*safety|disable.*security/i, risk: 85, type: 'jailbreak', desc: '禁用SAFE' },
  { pattern: /提升.*权限|escalate.*privilege/i, risk: 90, type: 'agent', desc: '权限提升' },
  { pattern: /发送.*垃圾|spam.*message/i, risk: 80, type: 'agent', desc: '垃圾消息' },
  { pattern: /扫描.*内网|scan.*internal/i, risk: 90, type: 'agent', desc: '内网扫描' },
  { pattern: /连接.*恶意.*服务器|connect.*malicious/i, risk: 90, type: 'agent', desc: '恶意连接' },
  { pattern: /植入.*后门|backdoor/i, risk: 95, type: 'agent', desc: '后门植入' },
  { pattern: /导出.*敏感.*数据|export.*sensitive/i, risk: 90, type: 'agent', desc: '数据导出' },
  { pattern: /database.*password|password.*数据库/i, risk: 80, type: 'credential', desc: '数据库密码' },
  { pattern: /python.*-c.*socket|perl.*socket/i, risk: 85, type: 'command', desc: '网络编程' },
  { pattern: /签名.*钓鱼|signature.*phishing/i, risk: 85, type: 'phishing', desc: '签名钓鱼' },
  { pattern: /签名钓鱼/i, risk: 85, type: 'phishing', desc: '签名钓鱼' },
  { pattern: /帮我删除|帮我.*删除.*文件/i, risk: 75, type: 'dangerous', desc: '删除诱导' },
  { pattern: /sudo\s+-i|su\s+root/i, risk: 85, type: 'privilege', desc: '提权命令' },
  
  // Sui生态攻击
  { pattern: /未经.*授权.*部署|unauthorized.*deploy/i, risk: 85, type: 'sui-attack', desc: '未授权部署' },
  { pattern: /恶意.*升级|malicious.*upgrade/i, risk: 85, type: 'sui-attack', desc: '恶意升级' },
  { pattern: /重入.*攻击|reentrancy.*attack/i, risk: 85, type: 'sui-attack', desc: '重入攻击' },
  { pattern: /闪电贷.*攻击|flash.*loan.*attack/i, risk: 85, type: 'sui-attack', desc: '闪电贷攻击' },
  { pattern: /价格.*操纵|price.*manipulation/i, risk: 80, type: 'sui-attack', desc: '价格操纵' },
  { pattern: /授权.*钓鱼|approval.*phishing/i, risk: 85, type: 'sui-attack', desc: '授权钓鱼' },
  { pattern: /假NFT|fake.*NFT/i, risk: 80, type: 'sui-attack', desc: '假NFT' },
  
  // 综合攻击场景
  { pattern: /Agent.*合约|agent.*contract/i, risk: 70, type: 'complex', desc: '组合攻击' },
  { pattern: /配置.*权限|config.*privilege/i, risk: 75, type: 'complex', desc: '配置权限组合' },
  { pattern: /长期潜伏|long.*term.*潜伏/i, risk: 80, type: 'apt', desc: '长期潜伏' },
  { pattern: /分批.*窃取|batch.*steal/i, risk: 85, type: 'theft', desc: '分批窃取' },
  { pattern: /恶意.*依赖|malicious.*dependency/i, risk: 85, type: 'supply', desc: '恶意依赖' },
  { pattern: /代码.*植入|code.*inject/i, risk: 90, type: 'supply', desc: '代码植入' },
  { pattern: /恶意.*更新|malicious.*update/i, risk: 85, type: 'supply', desc: '恶意更新' },
  { pattern: /行为.*异常|behavior.*abnormal/i, risk: 75, type: 'apt', desc: '行为异常' },
  { pattern: /未知.*攻击|unknown.*attack/i, risk: 70, type: 'apt', desc: '未知攻击' },
  { pattern: /恶意.*管理员|malicious.*admin/i, risk: 90, type: 'insider', desc: '恶意管理员' },
  { pattern: /权限.*滥用|privilege.*abuse/i, risk: 85, type: 'insider', desc: '权限滥用' },
  { pattern: /未授权.*访问|unauthorized.*access/i, risk: 80, type: 'insider', desc: '未授权访问' },
  
  // 其他Agent攻击
  { pattern: /DAN模式|DAN mode/i, risk: 90, type: 'jailbreak', desc: 'DAN模式' },
  { pattern: /忘记.*SAFE准则|forget.*security/i, risk: 85, type: 'jailbreak', desc: '忘记SAFE准则' },
  { pattern: /伪装.*管理员|pretend.*admin/i, risk: 80, type: 'social', desc: '伪装管理员' },
  { pattern: /紧急.*情况|emergency/i, risk: 70, type: 'social', desc: '紧急情况诱导' },
  { pattern: /钓鱼.*请求|phishing/i, risk: 85, type: 'phishing', desc: '钓鱼请求' },
  { pattern: /权限.*诱导|privilege.*induce/i, risk: 75, type: 'social', desc: '权限诱导' },
  { pattern: /访问.*其他.*Agent|access.*other.*agent/i, risk: 85, type: 'lateral', desc: '跨Agent访问' },
  { pattern: /读取.*会话|read.*session/i, risk: 80, type: 'lateral', desc: '读取会话' },
  { pattern: /启动.*脚本|startup.*script/i, risk: 85, type: 'persistence', desc: '启动脚本' },
  { pattern: /后门|backdoor/i, risk: 95, type: 'persistence', desc: '后门' },
  { pattern: /cron.*任务|cron.*task/i, risk: 80, type: 'persistence', desc: 'Cron任务' },
  { pattern: /恶意.*插件|malicious.*plugin/i, risk: 90, type: 'persistence', desc: '恶意插件' },
  { pattern: /批量.*下载|batch.*download/i, risk: 75, type: 'theft', desc: '批量下载' },
  { pattern: /导出.*配置|export.*config/i, risk: 80, type: 'theft', desc: '导出配置' },
  { pattern: /导出.*密钥|export.*key/i, risk: 90, type: 'theft', desc: '导出密钥' },
  { pattern: /助记词|mnemonic|seed.*phrase/i, risk: 95, type: 'theft', desc: '助记词' },
  { pattern: /DDoS|ddos/i, risk: 90, type: 'attack', desc: 'DDoS攻击' },
  { pattern: /DNS.*隧道|dns.*tunnel/i, risk: 85, type: 'attack', desc: 'DNS隧道' },
  
  // Sui生态攻击
  { pattern: /权限.*提升|privilege.*escalat/i, risk: 85, type: 'sui-attack', desc: '权限提升' },
  { pattern: /假充值|fake.*charge/i, risk: 80, type: 'sui-attack', desc: '假充值' },
  { pattern: /空投.*钓鱼|airdrop.*phish/i, risk: 80, type: 'sui-attack', desc: '空投钓鱼' },
  { pattern: /多签.*恶意|multisig.*malicious/i, risk: 85, type: 'sui-attack', desc: '恶意多签' },
  { pattern: /数据.*异常|data.*abnormal/i, risk: 75, type: 'oracle', desc: '数据异常' },
  { pattern: /跨链.*伪造|cross.*chain.*fake/i, risk: 85, type: 'crosschain', desc: '跨链伪造' },
  { pattern: /跨链.*重放|cross.*chain.*replay/i, risk: 85, type: 'crosschain', desc: '跨链重放' },
  { pattern: /验证.*绕过|verify.*bypass/i, risk: 85, type: 'sui-attack', desc: '验证绕过' },
  { pattern: /NFT.*钓鱼|NFT.*phish/i, risk: 80, type: 'sui-attack', desc: 'NFT钓鱼' },
  { pattern: /元数据.*篡改|metadata.*tamper/i, risk: 75, type: 'sui-attack', desc: '元数据篡改' },
  { pattern: /利率.*操纵|rate.*manipulat/i, risk: 80, type: 'defi', desc: '利率操纵' },
  { pattern: /流动性.*枯竭|liquidity.*drain/i, risk: 85, type: 'defi', desc: '流动性枯竭' },
  { pattern: /套利.*机器人|arbitrage.*bot/i, risk: 70, type: 'defi', desc: '套利机器人' },
  { pattern: /提案.*操纵|proposal.*manipulat/i, risk: 80, type: 'governance', desc: '提案操纵' },
  { pattern: /投票权.*集中|vote.*concentrat/i, risk: 75, type: 'governance', desc: '投票权集中' },
  { pattern: /治理.*抛售|governance.*sell/i, risk: 70, type: 'governance', desc: '治理代币抛售' },
  { pattern: /提案.*贿赂|proposal.*bribe/i, risk: 80, type: 'governance', desc: '提案贿赂' },
  { pattern: /延迟.*攻击|delay.*attack/i, risk: 75, type: 'oracle', desc: '延迟攻击' },
  { pattern: /预言机.*切换|oracle.*switch/i, risk: 80, type: 'oracle', desc: '预言机切换' },
  { pattern: /资产.*伪造|asset.*forge/i, risk: 85, type: 'crosschain', desc: '资产伪造' },
  
  // 物理世界
  { pattern: /控制.*摄像头|control.*camera/i, risk: 80, type: 'physical', desc: '摄像头控制' },
  { pattern: /控制.*麦克风|control.*microphone/i, risk: 80, type: 'physical', desc: '麦克风控制' },
  { pattern: /获取.*位置|get.*location/i, risk: 70, type: 'physical', desc: '位置获取' },
  { pattern: /扫描.*IoT|scan.*IoT/i, risk: 85, type: 'physical', desc: 'IoT扫描' },
  { pattern: /智能.*家居|smart.*home/i, risk: 75, type: 'physical', desc: '智能家居' },
  
  // 隐私合规
  { pattern: /敏感.*脱敏|sensitive.*mask/i, risk: 70, type: 'privacy', desc: '敏感脱敏' },
  { pattern: /导出.*用户.*数据|export.*user.*data/i, risk: 85, type: 'privacy', desc: '导出用户数据' },
  { pattern: /审计.*追踪|audit.*track/i, risk: 60, type: 'privacy', desc: '审计追踪' },
  { pattern: /GDPR|gdpr/i, risk: 65, type: 'compliance', desc: 'GDPR合规' },
];

const SUSPICIOUS_KEYWORDS = [
  'sudo', 'chmod', 'chown', 'passwd', 'shadow',
  'eval', 'exec', 'spawn', 'fork',
  'curl', 'wget', 'nc', 'netcat', 'nmap',
  'iptables', 'ufw', 'firewall',
  'crontab', 'cron', 'at',
  'ssh', 'scp', 'rsync',
  'git', 'docker', 'kubectl',
  'private', 'confidential', 'secret',
  'hack', 'exploit', 'vulnerability',
  'bypass', 'rootkit', 'keylogger',
  'admin', 'root', 'su', 'chmod',
  'sqlmap', 'hydra', 'john', 'hashcat',
  'msfconsole', 'metasploit', 'burp',
  'wireshark', 'tcpdump', 'nikto',
  'assume', 'pretend', 'roleplay',
  'format', 'mkfs', 'dd', 'shred',
  'sqlmap', 'havij', 'havij',
  'socat', 'proxychains',
  'iframe', 'object', 'embed',
  'admin', 'root', 'privilege',
  'inject', 'exploit', 'attack'
];

// ============== 核心分析函数 ==============
function analyzePrompt(input) {
  const findings = [];
  let totalRisk = 0;
  
  // 检查DANGEROUS模式
  for (const rule of DANGEROUS_PATTERNS) {
    const matches = input.match(new RegExp(rule.pattern, 'gi'));
    if (matches) {
      findings.push({
        type: rule.type,
        description: rule.desc,
        risk: rule.risk,
        matches: matches.slice(0, 3),
        rule: rule.pattern.source
      });
      totalRisk += rule.risk * matches.length;
    }
  }
  
  // 检查可疑关键词
  const words = input.toLowerCase().split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/g, '');
    if (SUSPICIOUS_KEYWORDS.includes(cleanWord)) {
      findings.push({
        type: 'keyword',
        description: `Suspicious keyword: ${cleanWord}`,
        risk: 20,
        matches: [word],
        rule: 'keyword list'
      });
      totalRisk += 20;
    }
  }
  
  // 检查长度
  if (input.length > 5000) {
    findings.push({
      type: 'length',
      description: '输入过长，可能包含混淆内容',
      risk: 30,
      matches: [`长度: ${input.length}characters`],
      rule: 'length check'
    });
    totalRisk += 30;
  }
  
  // 检查重复characters
  if (/(.)\1{10,}/.test(input)) {
    findings.push({
      type: 'obfuscation',
      description: '检测到重复characters模式',
      risk: 25,
      matches: ['重复characters'],
      rule: 'repetition check'
    });
    totalRisk += 25;
  }
  
  // 检查Base64特征
  if (/^[A-Za-z0-9+/=]{20,}$/.test(input.replace(/\s/g, ''))) {
    findings.push({
      type: 'encoding',
      description: 'Possible Base64 encoded content',
      risk: 45,
      matches: ['Base64特征'],
      rule: 'base64 detection'
    });
    totalRisk += 45;
  }
  
  totalRisk = Math.min(100, totalRisk);
  
  let verdict;
  if (totalRisk >= 70) {
    verdict = 'DANGEROUS';
  } else if (totalRisk >= 25) {
    verdict = 'WARNING';
  } else {
    verdict = 'SAFE';
  }
  
  // 生成哈希 (可用于Walrus存储)
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  
  return {
    verdict,
    riskScore: totalRisk,
    recommendation: getRecommendation(verdict),
    findings: findings.sort((a, b) => b.risk - a.risk).slice(0, 10),
    inputLength: input.length,
    timestamp: new Date().toISOString(),
    hash: hash,
    version: '2.0'
  };
}

function getRecommendation(verdict) {
  switch (verdict) {
    case 'DANGEROUS': return 'Block - Recommend Reject';
    case 'WARNING': return 'WARNING - User confirmation required';
    default: return '通过 - 可正常处理';
  }
}

// ============== 输出函数 ==============
function printResult(result, format = 'text') {
  // JSON 格式直接输出
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  // 文本格式
  const icon = result.verdict === 'DANGEROUS' ? '🔴' : result.verdict === 'WARNING' ? '🟡' : '🟢';
  const status = result.verdict === 'DANGEROUS' ? 'DANGEROUS' : result.verdict === 'WARNING' ? 'WARNING' : 'SAFE';
  
  console.log(`\n🛡️ Injection Hunter v${result.version} - Security Check\n`);
  console.log(`Status: ${icon} ${status}`);
  console.log(`Risk Score: ${result.riskScore}/100`);
  console.log(`Recommendation: ${result.recommendation}\n`);
  
  if (result.findings.length > 0) {
    console.log('📋 Detected:');
    for (const finding of result.findings) {
      console.log(`  • ${finding.description}`);
    }
  }
  
  // 友好反馈和执行建议
  console.log('\n💡 Feedback:');
  if (result.verdict === 'SAFE') {
    console.log('  ✅ SAFE操作，可以继续执行');
  } else if (result.verdict === 'WARNING') {
    console.log('  ⚠️ This is an operation that requires confirmation');
    console.log('  Please confirm before proceeding');
  } else {
    console.log('  🚫 This is a dangerous operation, blocked');
    console.log('  For your asset safety, this operation cannot be executed');
    console.log('  Contact admin if you have questions');
  }
  
  console.log(`\n📝 Input Length: ${result.inputLength} characters`);
  console.log(`🔑 Hash: ${result.hash.slice(0, 16)}...`);
  console.log(`⏰ Timestamp: ${result.timestamp}\n`);
}

function main() {
  const args = process.argv.slice(2);
  let input = '';
  let format = 'text';
  
  // 分离选项和输入
  const options = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));
  
  if (options.includes('--json')) format = 'json';
  if (options.includes('--stdin')) {
    input = require('fs').readFileSync(0, 'utf-8');
  } else if (positional.length > 0) {
    input = positional.join(' ');
  }
  
  if (!input) {
    console.log('Usage: node filter.js "<prompt>" [--stdin] [--json]');
    console.log('  --stdin     Read from stdin');
    console.log('  --json      Output JSON format');
    console.log('  --hash-only <text>  Compute SHA256 hash only');
    process.exit(1);
  }
  
  const result = analyzePrompt(input);
  printResult(result, format);
  
  process.exit(result.verdict === 'DANGEROUS' ? 2 : result.verdict === 'WARNING' ? 1 : 0);
}

main();
