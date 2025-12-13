// packages/types/src/validation.ts
// 共享的验证规则和函数

/**
 * 密码复杂度要求：
 * - 至少6个字符
 * - 包含小写字母
 * - 包含大写字母
 * - 包含数字
 * - 包含特殊字符 (@$!%*?&)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * 验证密码是否符合复杂度要求
 * @param password 要验证的密码
 * @returns 验证结果和错误消息
 */
export function validatePassword(password: string): { isValid: boolean; errorMessage: string | null } {
  if (!password) {
    return { isValid: false, errorMessage: '密码不能为空' };
  }

  if (password.length < 6) {
    return { isValid: false, errorMessage: '密码长度至少6位' };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return { isValid: false, errorMessage: '密码必须包含大小写字母、数字和特殊字符' };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * 验证邮箱格式
 * @param email 要验证的邮箱
 * @returns 是否为有效邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}