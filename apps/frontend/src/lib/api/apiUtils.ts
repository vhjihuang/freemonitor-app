// src/lib/api/apiUtils.ts
/**
 * 处理API响应，统一提取data字段
 * @param response API响应对象
 * @returns 提取后的数据
 */
export const handleResponse = <T>(response: { data: T } | T): T => {
  // 如果响应是对象且包含data字段，返回data字段
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  // 否则直接返回响应
  return response as T;
};