// packages/types/src/database/database.filters.ts
/**
 * 数据库查询过滤器工具
 * 提供清晰、可读性高的过滤器构建函数
 */

// ==================== 活跃记录过滤器 ====================

/**
 * 只返回活跃的用户记录（未删除且激活）
 */
export function activeUser() {
  return {
    isActive: true,
    deletedAt: null,
  };
}

/**
 * 只返回活跃的设备记录
 */
export function activeDevice() {
  return {
    isActive: true,
  };
}

/**
 * 只返回活跃的设备组记录
 */
export function activeDeviceGroup() {
  return {
    isActive: true,
  };
}

/**
 * 只返回活跃的告警记录
 */
export function activeAlert() {
  return {
    isActive: true,
  };
}

/**
 * 只返回活跃的指标记录
 */
export function activeMetric() {
  return {
    isActive: true,
  };
}

/**
 * 只返回有效的刷新令牌（未撤销且未过期）
 */
export function validRefreshToken() {
  return {
    revoked: false,
    expiresAt: {
      gt: new Date(),
    },
  };
}

// ==================== 包含软删除的过滤器 ====================

/**
 * 包含所有用户记录（包括软删除的）
 */
export function allUsers() {
  return {};
}

/**
 * 包含所有设备记录（包括软删除的）
 */
export function allDevices() {
  return {};
}

// ==================== 仅软删除的过滤器 ====================

/**
 * 只返回已删除的用户记录
 */
export function deletedUsers() {
  return {
    OR: [
      { isActive: false },
      { deletedAt: { not: null } },
    ],
  };
}

/**
 * 只返回已删除的设备记录
 */
export function deletedDevices() {
  return {
    isActive: false,
  };
}

// ==================== 时间范围过滤器 ====================

/**
 * 创建时间在指定范围内
 */
export function createdAtBetween(startDate: Date, endDate: Date) {
  return {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };
}

/**
 * 更新时间在指定范围内
 */
export function updatedAtBetween(startDate: Date, endDate: Date) {
  return {
    updatedAt: {
      gte: startDate,
      lte: endDate,
    },
  };
}

/**
 * 最近几天内创建的记录
 */
export function createdInLastDays(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    createdAt: {
      gte: startDate,
    },
  };
}

/**
 * 最近几天内更新的记录
 */
export function updatedInLastDays(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    updatedAt: {
      gte: startDate,
    },
  };
}

// ==================== 分页和排序工具 ====================

/**
 * 构建分页参数
 */
export function paginate(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

/**
 * 按字段升序排序
 */
export function sortAsc(field: string) {
  return {
    orderBy: { [field]: 'asc' },
  };
}

/**
 * 按字段降序排序
 */
export function sortDesc(field: string) {
  return {
    orderBy: { [field]: 'desc' },
  };
}

/**
 * 按多个字段排序
 */
export function sortByMultiple(fields: Array<{ field: string; order: 'asc' | 'desc' }>) {
  const orderBy = fields.map(({ field, order }) => ({ [field]: order }));
  return { orderBy };
}

// ==================== 关联查询工具 ====================

/**
 * 包含关联数据
 */
export function includeRelations(relations: string[]) {
  const include = relations.reduce((acc, relation) => {
    acc[relation] = true;
    return acc;
  }, {} as Record<string, boolean>);

  return { include };
}

/**
 * 包含设备关联数据
 */
export function includeDeviceRelations() {
  return {
    include: {
      deviceGroup: true,
      metrics: {
        take: 1,
        orderBy: { timestamp: 'desc' },
      },
    },
  };
}

/**
 * 包含用户关联数据
 */
export function includeUserRelations() {
  return {
    include: {
      devices: true,
      deviceGroups: true,
    },
  };
}

// ==================== 组合查询工具 ====================

/**
 * 组合多个过滤条件
 */
export function combineFilters(...filters: Array<Record<string, any>>) {
  return Object.assign({}, ...filters);
}

/**
 * 搜索条件构建器
 */
export function searchConditions(search: string, fields: string[]) {
  if (!search) return {};
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
}

// ==================== 导出所有工具 ====================

export const DatabaseFilters = {
  // 活跃记录
  activeUser,
  activeDevice,
  activeDeviceGroup,
  activeAlert,
  activeMetric,
  validRefreshToken,
  
  // 包含所有记录
  allUsers,
  allDevices,
  
  // 仅删除记录
  deletedUsers,
  deletedDevices,
  
  // 时间范围
  createdAtBetween,
  updatedAtBetween,
  createdInLastDays,
  updatedInLastDays,
  
  // 分页排序
  paginate,
  sortAsc,
  sortDesc,
  sortByMultiple,
  
  // 关联查询
  includeRelations,
  includeDeviceRelations,
  includeUserRelations,
  
  // 组合工具
  combineFilters,
  searchConditions,
};