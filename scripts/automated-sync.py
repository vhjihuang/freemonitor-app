#!/usr/bin/env python3
"""
自动化任务同步脚本
定期从文档同步任务信息到project-plan-structured.json
"""

import os
import sys
import time
import schedule
from datetime import datetime

# 添加脚本目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 直接导入同步函数
from sync_tasks_from_docs import update_project_plan_from_docs


def run_sync():
    """执行同步任务"""
    print(f"\n🔄 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始自动同步...")
    
    try:
        manager = UnifiedTaskManager()
        
        # 验证数据一致性
        if not manager.validate_data_consistency():
            print("⚠️ 数据一致性存在问题，跳过本次同步")
            return
        
        # 从文档同步任务信息
        update_project_plan_from_docs()
        
        print(f"✅ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 自动同步完成")
        
    except Exception as e:
        print(f"❌ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 同步失败: {e}")


def setup_schedule():
    """设置定时任务"""
    # 每30分钟执行一次
    schedule.every(30).minutes.do(run_sync)
    
    # 每天9:00执行一次
    schedule.every().day.at("09:00").do(run_sync)
    
    # 每天18:00执行一次
    schedule.every().day.at("18:00").do(run_sync)
    
    print("⏰ 定时任务已设置:")
    print("  • 每30分钟执行一次")
    print("  • 每天09:00执行一次")
    print("  • 每天18:00执行一次")


def main():
    """主函数"""
    print("🤖 自动化同步脚本启动")
    print("=" * 50)
    
    # 立即执行一次同步
    run_sync()
    
    # 设置定时任务
    setup_schedule()
    
    print("\n📡 开始监听定时任务...")
    print("按 Ctrl+C 退出")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 每分钟检查一次
    except KeyboardInterrupt:
        print("\n👋 用户中断，退出自动化同步")


if __name__ == "__main__":
    main()