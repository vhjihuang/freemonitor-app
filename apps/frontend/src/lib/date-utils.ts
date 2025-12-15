import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化当前日期为 ISO 字符串
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * 格式化日期为 ISO 字符串
 * @param date 要格式化的日期
 */
export function formatToISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * 格式化日期为本地时间字符串
 * @param date 要格式化的日期
 */
export function formatToLocalTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString();
}

/**
 * 格式化日期为本地日期时间字符串
 * @param date 要格式化的日期
 */
export function formatToLocalDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * 格式化日期为指定格式
 * @param date 要格式化的日期
 * @param formatStr 格式化字符串，例如 'yyyy年MM月dd日 HH:mm'
 */
export function formatDate(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: zhCN });
}

/**
 * 格式化日期为日期部分（用于文件名）
 * @param date 要格式化的日期
 */
export function formatDateForFileName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * 格式化日期为简洁时间格式 (HH:mm)
 * @param date 要格式化的日期
 */
export function formatToTimeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

/**
 * 格式化日期为短日期时间格式 (MM-dd HH:mm)
 * @param date 要格式化的日期
 */
export function formatToShortDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MM-dd HH:mm', { locale: zhCN });
}

/**
 * 格式化日期为长日期时间格式 (yyyy年MM月dd日 HH:mm)
 * @param date 要格式化的日期
 */
export function formatToLongDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
}

/**
 * 格式化日期为标准日期时间格式 (yyyy-MM-dd HH:mm:ss)
 * @param date 要格式化的日期
 */
export function formatToStandardDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm:ss');
}