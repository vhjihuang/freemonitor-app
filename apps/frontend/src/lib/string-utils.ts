/**
 * 安全地获取字符串的前缀
 * @param str 要截取的字符串
 * @param length 前缀长度
 * @param suffix 可选的后缀，默认为 '...'
 */
export function getStringPrefix(str: string | null | undefined, length: number, suffix: string = '...'): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.substring(0, length)}${suffix}`;
}

/**
 * 安全地截取数组的一部分
 * @param array 要截取的数组
 * @param start 起始索引
 * @param end 结束索引
 */
export function getArraySlice<T>(array: T[], start?: number, end?: number): T[] {
  if (!array || array.length === 0) return [];
  if (start === undefined && end === undefined) return [...array];
  if (start === undefined) return array.slice(0, end);
  if (end === undefined) return array.slice(start);
  return array.slice(start, end);
}

/**
 * 获取数组的最后N个元素
 * @param array 要截取的数组
 * @param count 要保留的元素数量
 */
export function getArrayLast<T>(array: T[], count: number): T[] {
  if (!array || array.length === 0) return [];
  if (array.length <= count) return [...array];
  return array.slice(-count);
}

/**
 * 安全地解析JWT令牌
 * @param token 要解析的JWT令牌
 */
export function parseJWT(token: string): any {
  try {
    if (!token || !token.includes('.')) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('解析JWT令牌失败:', error);
    return null;
  }
}

/**
 * 安全地清理和分割字符串
 * @param str 要处理的字符串
 * @param separator 分隔符
 */
export function splitAndClean(str: string, separator: string = ','): string[] {
  if (!str || str.trim().length === 0) return [];
  return str.split(separator).map(part => part.trim()).filter(part => part.length > 0);
}

/**
 * 清理输入字符串
 * @param str 要清理的字符串
 */
export function cleanString(str: string): string {
  return str ? str.trim() : '';
}

/**
 * 验证IP地址格式
 * @param ip 要验证的IP地址
 */
export function isValidIP(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  
  const ipParts = ip.split('.').map(Number);
  return ipParts.every(part => part >= 0 && part <= 255);
}

/**
 * 分割并解析IP地址
 * @param ip 要分割的IP地址
 */
export function parseIP(ip: string): number[] {
  return ip.split('.').map(Number);
}

/**
 * 文本高亮处理
 * @param text 要处理的文本
 * @param regex 匹配的正则表达式
 */
export function highlightText(text: string, regex: RegExp): {text: string, match: boolean} {
  const parts = text.split(regex);
  const matches = text.match(regex);
  return {text: parts.join(''), match: !!matches};
}

/**
 * 安全地截取字节数组
 * @param buffer 要截取的字节数组
 * @param length 要截取的长度
 */
export function getBufferSlice(buffer: Uint8Array, length: number): Uint8Array {
  if (!buffer || buffer.length === 0) return new Uint8Array(0);
  if (buffer.length <= length) return buffer;
  return buffer.slice(0, length);
}

/**
 * 创建安全的文件名
 * @param prefix 文件名前缀
 * @param date 日期
 * @param extension 文件扩展名
 */
export function createSafeFileName(prefix: string, date: Date | string, extension: string = 'json'): string {
  const dateStr = formatDateForFileName(date);
  return `${prefix}-${dateStr}.${extension}`;
}

/**
 * 格式化日期为文件名格式
 * @param date 要格式化的日期
 */
export function formatDateForFileName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}